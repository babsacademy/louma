<?php

use App\Actions\ExpireOrderReservation;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SellerPayout;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

function publicOrderPayload(array $overrides = []): array
{
    return array_merge([
        'customer_name' => 'Awa Ndiaye',
        'customer_phone' => '77 123 45 67',
        'delivery_address' => 'Sacré-Cœur 3, Dakar',
        'quantity' => 3,
        'request_token' => (string) Str::uuid(),
    ], $overrides);
}

test('keeps stock, history, payments and payouts coherent through the complete business cycle', function () {
    $administrator = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create(['created_by' => $administrator->id]);
    $shop = Shop::factory()->for($seller, 'seller')->create([
        'stock_quantity' => 20,
        'average_weight' => 1999,
    ]);

    $this->post(route('public.orders.store', $shop), publicOrderPayload())->assertRedirect();

    $order = Order::sole();
    expect($order->status)->toBe(OrderStatus::Pending)
        ->and($order->unit_price)->toBe(2900)
        ->and($order->subtotal)->toBe(8700)
        ->and($order->seller_amount)->toBe(7500);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 17]);

    $this->actingAs($administrator)->post(route('admin.orders.confirm', $order))->assertRedirect();
    $this->actingAs($administrator)->post(route('admin.orders.start-preparing', $order))->assertRedirect();
    $this->actingAs($administrator)->post(route('admin.orders.mark-picked-up', $order))->assertRedirect();
    $this->actingAs($administrator)->post(route('admin.orders.start-delivery', $order))->assertRedirect();
    $this->actingAs($administrator)->post(route('admin.orders.mark-delivered', $order))->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Delivered)
        ->and($order->confirmed_at)->not->toBeNull()
        ->and($order->preparing_at)->not->toBeNull()
        ->and($order->picked_up_at)->not->toBeNull()
        ->and($order->delivering_at)->not->toBeNull()
        ->and($order->delivered_at)->not->toBeNull()
        ->and($order->statusHistories()->count())->toBe(6);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 17]);

    $this->actingAs($administrator)->post(route('admin.orders.payment', $order), [
        'transaction_reference' => 'WAVE-ORDER-001',
        'amount' => 1,
        'method' => 'cash',
        'status' => 'pending',
    ])->assertRedirect();
    $this->actingAs($administrator)->post(route('admin.orders.payout', $order), [
        'transaction_reference' => 'WAVE-PAYOUT-001',
        'amount' => 1,
        'seller_id' => User::factory()->seller()->create()->id,
    ])->assertRedirect();

    $payment = Payment::sole();
    $payout = SellerPayout::sole();
    expect($payment->amount)->toBe(8700)
        ->and($payment->recorded_by)->toBe($administrator->id)
        ->and($payout->amount)->toBe(7500)
        ->and($payout->seller_id)->toBe($seller->id)
        ->and($payout->recorded_by)->toBe($administrator->id);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 17]);
});

test('returns stock exactly once when a pending order expires', function () {
    $shop = Shop::factory()->create(['stock_quantity' => 8]);
    $order = Order::factory()->for($shop, 'shop')->create([
        'status' => OrderStatus::Pending,
        'quantity' => 3,
        'reservation_expires_at' => now()->subMinute(),
    ]);

    app(ExpireOrderReservation::class)->execute($order);
    app(ExpireOrderReservation::class)->execute($order);

    expect($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($order->fresh()->stock_released_at)->not->toBeNull();
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 11]);
});

test('returns stock exactly once when an administrator cancels before pickup', function () {
    $administrator = User::factory()->admin()->create();
    $shop = Shop::factory()->create(['stock_quantity' => 8]);
    $order = Order::factory()->for($shop, 'shop')->confirmed()->create(['quantity' => 3]);

    $this->actingAs($administrator)->post(route('admin.orders.cancel', $order), [
        'cancellation_reason' => 'Client indisponible',
    ])->assertRedirect();
    $this->actingAs($administrator)->post(route('admin.orders.cancel', $order), [
        'cancellation_reason' => 'Nouvelle demande',
    ])->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($order->fresh()->statusHistories()->where('to_status', OrderStatus::Cancelled)->count())->toBe(1);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 11]);
});

test('stores validated shop images under generated paths and safely replaces the old image', function () {
    Storage::fake('public');
    $administrator = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();

    $this->actingAs($administrator)->post(route('admin.shops.store'), [
        'seller_id' => $seller->id,
        'name' => 'Ferme de Ngor',
        'zone' => 'Ngor',
        'stock_quantity' => 12,
        'average_weight' => '1.999',
        'active' => true,
        'image' => UploadedFile::fake()->image('ferme.png', 640, 480),
    ])->assertRedirect();

    $shop = Shop::sole();
    $firstImagePath = $shop->image_path;
    expect($shop->average_weight)->toBe(1999)
        ->and($firstImagePath)->toStartWith('shops/');
    Storage::disk('public')->assertExists($firstImagePath);

    $this->actingAs($administrator)->patch(route('admin.shops.update', $shop), [
        'seller_id' => $seller->id,
        'name' => $shop->name,
        'zone' => $shop->zone,
        'stock_quantity' => 12,
        'average_weight' => '2.000',
        'active' => true,
        'image' => UploadedFile::fake()->image('ferme-mise-a-jour.png', 800, 600),
    ])->assertRedirect();

    $shop->refresh();
    Storage::disk('public')->assertMissing($firstImagePath);
    Storage::disk('public')->assertExists($shop->image_path);
});

test('rejects undersized images and assigning a new shop to an inactive seller', function () {
    Storage::fake('public');
    $administrator = User::factory()->admin()->create();
    $inactiveSeller = User::factory()->seller()->inactive()->create();

    $this->actingAs($administrator)->post(route('admin.shops.store'), [
        'seller_id' => $inactiveSeller->id,
        'name' => 'Ferme refusée',
        'zone' => 'Dakar',
        'stock_quantity' => 1,
        'average_weight' => '2.000',
        'image' => UploadedFile::fake()->image('minuscule.png', 100, 100),
    ])->assertSessionHasErrors(['seller_id', 'image']);

    expect(Shop::count())->toBe(0);
});

test('throttles public order attempts before stock is reserved', function () {
    $shop = Shop::factory()->create(['stock_quantity' => 20]);

    for ($attempt = 0; $attempt < 10; $attempt++) {
        $this->post(route('public.orders.store', $shop), [])->assertSessionHasErrors([
            'customer_name',
            'customer_phone',
            'delivery_address',
            'quantity',
            'request_token',
        ]);
    }

    $this->post(route('public.orders.store', $shop), [])->assertTooManyRequests();
    expect(Order::count())->toBe(0);
});
