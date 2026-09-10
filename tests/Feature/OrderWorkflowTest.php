<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function orderPayload(array $overrides = []): array
{
    return array_merge([
        'customer_name' => 'Awa Ndiaye',
        'customer_phone' => '77 123 45 67',
        'delivery_address' => '123, rue de la Paix, Dakar',
        'quantity' => 1,
        'request_token' => (string) Str::uuid(),
    ], $overrides);
}

test('a public order reserves stock and snapshots all authoritative amounts', function () {
    $shop = Shop::factory()->create(['stock_quantity' => 5, 'average_weight' => 1999]);

    $this->post(route('public.orders.store', $shop), orderPayload([
        'quantity' => 2,
        'unit_price' => 1,
        'subtotal' => 1,
        'platform_commission' => 1,
        'seller_amount' => 1,
        'status' => 'delivered',
    ]))->assertRedirect();

    $order = Order::sole();
    expect($order->reference)->toMatch('/^LG-'.now()->year.'-\d{6,}$/')
        ->and($order->status)->toBe(OrderStatus::Pending)
        ->and($order->customer_phone)->toBe('+221771234567')
        ->and($order->quantity)->toBe(2)
        ->and($order->average_weight_snapshot)->toBe(1999)
        ->and($order->unit_price)->toBe(2900)
        ->and($order->commission_per_unit)->toBe(400)
        ->and($order->subtotal)->toBe(5800)
        ->and($order->platform_commission)->toBe(800)
        ->and($order->seller_amount)->toBe(5000)
        ->and($order->stock_reserved_at)->not->toBeNull()
        ->and($order->reservation_expires_at)->not->toBeNull();
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 3]);
    $this->assertDatabaseHas('order_status_histories', ['order_id' => $order->id, 'to_status' => 'pending']);
});

test('the pricing boundary uses integer grams and preserves the seller amount', function (int $weight, int $price): void {
    $shop = Shop::factory()->create(['average_weight' => $weight, 'stock_quantity' => 2]);

    $this->post(route('public.orders.store', $shop), orderPayload())->assertRedirect();

    $order = Order::sole();
    expect($order->unit_price)->toBe($price)
        ->and($order->subtotal)->toBe($price)
        ->and($order->seller_amount)->toBe($price - 400);
})->with([
    'below threshold' => [1999, 2900],
    'threshold included' => [2000, 3250],
    'above threshold' => [2100, 3250],
]);

test('the same public request token is idempotent and does not reserve stock twice', function () {
    $shop = Shop::factory()->create(['stock_quantity' => 3]);
    $payload = orderPayload(['quantity' => 2]);

    $this->post(route('public.orders.store', $shop), $payload)->assertRedirect();
    $this->post(route('public.orders.store', $shop), $payload)->assertRedirect();

    expect(Order::count())->toBe(1);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 1]);
});

test('stock boundaries and inactive sources reject public orders without creating one', function () {
    $exactStock = Shop::factory()->create(['stock_quantity' => 2]);
    $this->post(route('public.orders.store', $exactStock), orderPayload(['quantity' => 2]))->assertRedirect();
    $this->assertDatabaseHas('shops', ['id' => $exactStock->id, 'stock_quantity' => 0]);

    $this->post(route('public.orders.store', $exactStock), orderPayload())->assertSessionHasErrors('quantity');
    $inactiveShop = Shop::factory()->inactive()->create();
    $inactiveSeller = User::factory()->seller()->inactive()->create();
    $inactiveSellerShop = Shop::factory()->for($inactiveSeller, 'seller')->create();
    $this->post(route('public.orders.store', $inactiveShop), orderPayload())->assertSessionHasErrors('quantity');
    $this->post(route('public.orders.store', $inactiveSellerShop), orderPayload())->assertSessionHasErrors('quantity');
    expect(Order::count())->toBe(1);
});

test('public confirmation requires both the readable reference and its opaque request token', function () {
    $shop = Shop::factory()->create();
    $this->post(route('public.orders.store', $shop), orderPayload())->assertRedirect();
    $order = Order::sole();

    $this->get(route('public.orders.show', [$order, $order->request_token]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/orders/show')
            ->where('order.reference', $order->reference)
            ->missing('order.customer_phone'));
    $this->get(route('public.orders.show', [$order, (string) Str::uuid()]))->assertNotFound();
    $this->get('/commande/'.$order->id.'/'.$order->request_token)->assertNotFound();
});

test('only administrators can list orders and see their filtered detail history', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();
    $order = Order::factory()->for(Shop::factory()->create())->create([
        'reference' => 'LG-2026-000456',
        'customer_name' => 'Moussa Fall',
    ]);

    $this->get(route('admin.orders.index'))->assertRedirect(route('login'));
    $this->actingAs($seller)->get(route('admin.orders.index'))->assertForbidden();
    $this->actingAs($admin)->get(route('admin.orders.index', ['search' => 'Moussa', 'status' => 'pending']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/orders/index')->has('orders.data', 1));
    $this->actingAs($admin)->get(route('admin.orders.show', $order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/orders/show')->has('order.history'));
});

test('an administrator confirms a pending order once without touching its reserved stock', function () {
    $admin = User::factory()->admin()->create();
    $shop = Shop::factory()->create(['stock_quantity' => 4]);
    $this->post(route('public.orders.store', $shop), orderPayload(['quantity' => 2]));
    $order = Order::sole();

    $this->actingAs($admin)->post(route('admin.orders.confirm', $order))->assertRedirect();
    $this->actingAs($admin)->post(route('admin.orders.confirm', $order))->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Confirmed)
        ->and($order->confirmed_at)->not->toBeNull()
        ->and($order->statusHistories()->where('to_status', 'confirmed')->count())->toBe(1);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 2]);
});

test('cancellation restores reserved stock exactly once and requires a reason after confirmation', function () {
    $admin = User::factory()->admin()->create();
    $shop = Shop::factory()->create(['stock_quantity' => 5]);
    $this->post(route('public.orders.store', $shop), orderPayload(['quantity' => 2]));
    $order = Order::sole();
    $this->actingAs($admin)->post(route('admin.orders.confirm', $order));

    $this->actingAs($admin)->post(route('admin.orders.cancel', $order), [])
        ->assertSessionHasErrors('cancellation_reason');
    $this->actingAs($admin)->post(route('admin.orders.cancel', $order), ['cancellation_reason' => 'Client indisponible'])
        ->assertRedirect();
    $this->actingAs($admin)->post(route('admin.orders.cancel', $order), ['cancellation_reason' => 'Autre motif'])
        ->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Cancelled)
        ->and($order->stock_released_at)->not->toBeNull()
        ->and($order->statusHistories()->where('to_status', 'cancelled')->count())->toBe(1);
    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 5]);
});

test('sellers cannot confirm or cancel orders', function () {
    $seller = User::factory()->seller()->create();
    $order = Order::factory()->create();

    $this->actingAs($seller)->post(route('admin.orders.confirm', $order))->assertForbidden();
    $this->actingAs($seller)->post(route('admin.orders.cancel', $order))->assertForbidden();
});
