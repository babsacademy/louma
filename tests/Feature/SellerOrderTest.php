<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('a seller sees only orders from their shops without client address or platform finance', function () {
    $seller = User::factory()->seller()->create();
    $otherSeller = User::factory()->seller()->create();
    $ownOrder = Order::factory()->for(Shop::factory()->for($seller, 'seller'), 'shop')->create(['status' => OrderStatus::Confirmed]);
    Order::factory()->for(Shop::factory()->for($otherSeller, 'seller'), 'shop')->create();

    $this->actingAs($seller)->get(route('seller.orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('seller/orders/index')
            ->has('orders.data', 1)
            ->where('orders.data.0.reference', $ownOrder->reference)
            ->missing('orders.data.0.customer_phone')
            ->missing('orders.data.0.delivery_address')
            ->missing('orders.data.0.platform_commission'));
});

test('a seller can view only their own order and an admin cannot use seller routes', function () {
    $seller = User::factory()->seller()->create();
    $otherSeller = User::factory()->seller()->create();
    $administrator = User::factory()->admin()->create();
    $ownOrder = Order::factory()->for(Shop::factory()->for($seller, 'seller'), 'shop')->create();
    $foreignOrder = Order::factory()->for(Shop::factory()->for($otherSeller, 'seller'), 'shop')->create();

    $this->actingAs($seller)->get(route('seller.orders.show', $ownOrder))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('seller/orders/show')->missing('order.delivery_address'));
    $this->actingAs($seller)->get(route('seller.orders.show', $foreignOrder))->assertNotFound();
    $this->actingAs($administrator)->get(route('seller.orders.index'))->assertForbidden();
});
