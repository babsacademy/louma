<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('an administrator progresses a confirmed order through every operational status', function () {
    $administrator = User::factory()->admin()->create();
    $shop = Shop::factory()->create(['stock_quantity' => 7]);
    $order = Order::factory()->for($shop, 'shop')->confirmed()->create(['quantity' => 3]);

    $this->actingAs($administrator)->post(route('admin.orders.start-preparing', $order))->assertRedirect();
    $this->actingAs($administrator)->post(route('admin.orders.mark-picked-up', $order))->assertRedirect();
    $this->actingAs($administrator)->post(route('admin.orders.start-delivery', $order))->assertRedirect();
    $this->actingAs($administrator)->post(route('admin.orders.mark-delivered', $order))->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Delivered)
        ->and($order->preparing_at)->not->toBeNull()
        ->and($order->picked_up_at)->not->toBeNull()
        ->and($order->delivering_at)->not->toBeNull()
        ->and($order->delivered_at)->not->toBeNull();
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 7]);
    $this->assertDatabaseHas('order_status_histories', ['order_id' => $order->id, 'from_status' => 'confirmed', 'to_status' => 'preparing', 'changed_by' => $administrator->id]);
    $this->assertDatabaseHas('order_status_histories', ['order_id' => $order->id, 'from_status' => 'delivering', 'to_status' => 'delivered', 'changed_by' => $administrator->id]);
});

test('replaying an operational transition does not overwrite its timestamp or duplicate history', function () {
    $administrator = User::factory()->admin()->create();
    $order = Order::factory()->confirmed()->create();

    $this->actingAs($administrator)->post(route('admin.orders.start-preparing', $order))->assertRedirect();
    $preparedAt = $order->fresh()->preparing_at;
    $this->actingAs($administrator)->post(route('admin.orders.start-preparing', $order))->assertRedirect();

    expect($order->fresh()->preparing_at?->toIso8601String())->toBe($preparedAt?->toIso8601String())
        ->and($order->fresh()->statusHistories()->where('to_status', 'preparing')->count())->toBe(1);
});

test('invalid operational transitions are rejected without changing stock', function (OrderStatus $status, string $routeName): void {
    $administrator = User::factory()->admin()->create();
    $shop = Shop::factory()->create(['stock_quantity' => 6]);
    $order = Order::factory()->for($shop, 'shop')->create(['status' => $status]);

    $this->actingAs($administrator)->post(route($routeName, $order))
        ->assertSessionHasErrors('order');

    expect($order->fresh()->status)->toBe($status);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 6]);
})->with([
    'pending to delivering' => [OrderStatus::Pending, 'admin.orders.start-delivery'],
    'confirmed to delivered' => [OrderStatus::Confirmed, 'admin.orders.mark-delivered'],
    'delivered to preparing' => [OrderStatus::Delivered, 'admin.orders.start-preparing'],
    'cancelled to confirmed' => [OrderStatus::Cancelled, 'admin.orders.confirm'],
]);

test('an administrator may cancel during preparation but not after pickup', function () {
    $administrator = User::factory()->admin()->create();
    $shop = Shop::factory()->create(['stock_quantity' => 7]);
    $preparing = Order::factory()->for($shop, 'shop')->create(['status' => OrderStatus::Preparing, 'quantity' => 2]);
    $pickedUp = Order::factory()->for($shop, 'shop')->create(['status' => OrderStatus::PickedUp, 'quantity' => 1]);

    $this->actingAs($administrator)->post(route('admin.orders.cancel', $preparing), ['cancellation_reason' => 'Incident avant retrait'])->assertRedirect();
    $this->actingAs($administrator)->post(route('admin.orders.cancel', $pickedUp), ['cancellation_reason' => 'Trop tard'])->assertSessionHasErrors('order');

    expect($preparing->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($pickedUp->fresh()->status)->toBe(OrderStatus::PickedUp);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 9]);
});

test('only administrators can run operational transitions', function () {
    $seller = User::factory()->seller()->create();
    $order = Order::factory()->confirmed()->create();

    $this->actingAs($seller)->post(route('admin.orders.start-preparing', $order))->assertForbidden();
});
