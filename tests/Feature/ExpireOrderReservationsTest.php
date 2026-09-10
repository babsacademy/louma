<?php

use App\Actions\CancelOrder;
use App\Actions\ConfirmOrder;
use App\Actions\ExpireOrderReservation;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function expiredReservation(Shop $shop, array $overrides = []): Order
{
    return Order::factory()->for($shop, 'shop')->create(array_merge([
        'status' => OrderStatus::Pending,
        'quantity' => 3,
        'stock_reserved_at' => now()->subMinutes(31),
        'stock_released_at' => null,
        'cancelled_at' => null,
        'cancellation_reason' => null,
        'reservation_expires_at' => now()->subMinute(),
    ], $overrides));
}

test('an expired pending reservation is cancelled and restores its stock once', function () {
    $shop = Shop::factory()->create(['stock_quantity' => 7]);
    $order = expiredReservation($shop);

    $expiredOrder = app(ExpireOrderReservation::class)->execute($order);

    expect($expiredOrder)->not->toBeNull();
    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Cancelled)
        ->and($order->cancelled_at)->not->toBeNull()
        ->and($order->stock_released_at)->not->toBeNull()
        ->and($order->cancellation_reason)->toBe('Réservation expirée');
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 10]);
    $this->assertDatabaseHas('order_status_histories', [
        'order_id' => $order->id,
        'from_status' => 'pending',
        'to_status' => 'cancelled',
        'changed_by' => null,
        'reason' => 'Réservation expirée',
    ]);
});

test('expiring the same reservation twice does not restore stock twice', function () {
    $shop = Shop::factory()->create(['stock_quantity' => 7]);
    $order = expiredReservation($shop);
    $action = app(ExpireOrderReservation::class);

    $action->execute($order);
    $secondAttempt = $action->execute($order->fresh());

    expect($secondAttempt)->toBeNull()
        ->and($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($order->fresh()->statusHistories()->where('to_status', 'cancelled')->count())->toBe(1);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 10]);
});

test('a pending reservation before its deadline remains pending', function () {
    $shop = Shop::factory()->create(['stock_quantity' => 20]);
    $notYetExpired = expiredReservation($shop, ['reservation_expires_at' => now()->addMinute()]);

    $expirationAttempt = app(ExpireOrderReservation::class)->execute($notYetExpired);

    expect($expirationAttempt)->toBeNull()
        ->and($notYetExpired->fresh()->status)->toBe(OrderStatus::Pending);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 20]);
});

test('a non-pending order is never expired', function (OrderStatus $status): void {
    $shop = Shop::factory()->create(['stock_quantity' => 7]);
    $order = expiredReservation($shop, [
        'status' => $status,
        'stock_released_at' => $status === OrderStatus::Cancelled ? now()->subMinute() : null,
        'cancelled_at' => $status === OrderStatus::Cancelled ? now()->subMinute() : null,
    ]);

    $expirationAttempt = app(ExpireOrderReservation::class)->execute($order);

    expect($expirationAttempt)->toBeNull()
        ->and($order->fresh()->status)->toBe($status);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 7]);
})->with([
    'confirmed' => OrderStatus::Confirmed,
    'cancelled' => OrderStatus::Cancelled,
    'preparing' => OrderStatus::Preparing,
    'picked up' => OrderStatus::PickedUp,
    'delivering' => OrderStatus::Delivering,
    'delivered' => OrderStatus::Delivered,
]);

test('the expiry command processes all eligible reservations and ignores other orders', function () {
    $shop = Shop::factory()->create(['stock_quantity' => 8]);
    $firstExpired = expiredReservation($shop, ['quantity' => 2]);
    $secondExpired = expiredReservation($shop, ['quantity' => 1]);
    $futureReservation = expiredReservation($shop, [
        'quantity' => 2,
        'reservation_expires_at' => now()->addMinute(),
    ]);
    $confirmed = expiredReservation($shop, ['quantity' => 1, 'status' => OrderStatus::Confirmed]);

    $this->artisan('orders:expire-reservations')->assertSuccessful();

    expect($firstExpired->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($secondExpired->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($futureReservation->fresh()->status)->toBe(OrderStatus::Pending)
        ->and($confirmed->fresh()->status)->toBe(OrderStatus::Confirmed);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 11]);
});

test('confirmation wins over a later expiration attempt and cancellation still restores stock', function () {
    $administrator = User::factory()->admin()->create();
    $shop = Shop::factory()->create(['stock_quantity' => 7]);
    $order = expiredReservation($shop);

    app(ConfirmOrder::class)->execute($order, $administrator);
    $expirationAttempt = app(ExpireOrderReservation::class)->execute($order->fresh());
    app(CancelOrder::class)->execute($order->fresh(), $administrator, 'Annulation administrative');

    expect($expirationAttempt)->toBeNull()
        ->and($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($order->fresh()->cancellation_reason)->toBe('Annulation administrative');
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 10]);
});

test('the protected public confirmation reports an expired reservation as cancelled', function () {
    $shop = Shop::factory()->create(['stock_quantity' => 7]);
    $order = expiredReservation($shop);
    app(ExpireOrderReservation::class)->execute($order);

    $this->get(route('public.orders.show', [$order, $order->request_token]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/orders/show')
            ->where('order.status', 'cancelled')
            ->where('order.cancellation_reason', 'Réservation expirée'));
});
