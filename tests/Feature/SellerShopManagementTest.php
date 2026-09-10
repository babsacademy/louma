<?php

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests and admins cannot access seller shop routes', function () {
    $admin = User::factory()->admin()->create();

    $this->get(route('seller.dashboard'))->assertRedirect(route('login'));
    $this->actingAs($admin)->get(route('seller.dashboard'))->assertForbidden();
    $this->actingAs($admin)->get(route('seller.shops.index'))->assertForbidden();
});

test('an active seller receives only their dashboard statistics and shops', function () {
    $seller = User::factory()->seller()->create();
    $otherSeller = User::factory()->seller()->create();
    Shop::factory()->for($seller, 'seller')->create(['stock_quantity' => 6, 'active' => true]);
    Shop::factory()->for($seller, 'seller')->create(['stock_quantity' => 0, 'active' => false]);
    Shop::factory()->for($otherSeller, 'seller')->create(['stock_quantity' => 30]);

    $this->actingAs($seller)->get(route('seller.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('seller/dashboard')
            ->where('stats.total_shops', 2)
            ->where('stats.total_stock', 6)
            ->where('stats.active_shops', 1)
            ->where('stats.out_of_stock_shops', 1)
            ->has('shops', 2)
            ->missing('shops.0.seller_id'));
});

test('a seller can list and view only their own shops', function () {
    $seller = User::factory()->seller()->create();
    $otherSeller = User::factory()->seller()->create();
    $ownShop = Shop::factory()->for($seller, 'seller')->create(['name' => 'Ma boutique']);
    $otherShop = Shop::factory()->for($otherSeller, 'seller')->create(['name' => 'Boutique privée']);

    $this->actingAs($seller)->get(route('seller.shops.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('seller/shops/index')
            ->has('shops', 1)
            ->where('shops.0.name', $ownShop->name));

    $this->actingAs($seller)->get(route('seller.shops.show', $ownShop))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('seller/shops/show')
            ->where('shop.name', $ownShop->name));

    $this->actingAs($seller)->get(route('seller.shops.show', $otherShop))
        ->assertNotFound();
});

test('a seller cannot update another seller shop', function () {
    $seller = User::factory()->seller()->create();
    $otherSeller = User::factory()->seller()->create();
    $otherShop = Shop::factory()->for($otherSeller, 'seller')->create([
        'stock_quantity' => 8,
        'average_weight' => 2100,
    ]);

    $this->actingAs($seller)->patch(route('seller.shops.inventory.update', $otherShop), [
        'stock_quantity' => 0,
        'average_weight' => '1.95',
    ])->assertNotFound();

    $this->assertDatabaseHas('shops', [
        'id' => $otherShop->id,
        'stock_quantity' => 8,
        'average_weight' => 2100,
    ]);
});

test('a seller can update stock including zero', function () {
    $seller = User::factory()->seller()->create();
    $shop = Shop::factory()->for($seller, 'seller')->create(['stock_quantity' => 8]);

    $this->actingAs($seller)->patch(route('seller.shops.inventory.update', $shop), [
        'stock_quantity' => 0,
        'average_weight' => '2',
    ])->assertRedirect(route('seller.shops.show', $shop));

    $this->assertDatabaseHas('shops', [
        'id' => $shop->id,
        'stock_quantity' => 0,
        'average_weight' => 2000,
    ]);
});

test('a seller cannot save an invalid stock value', function (string $stockQuantity) {
    $seller = User::factory()->seller()->create();
    $shop = Shop::factory()->for($seller, 'seller')->create(['stock_quantity' => 8]);

    $this->actingAs($seller)->patch(route('seller.shops.inventory.update', $shop), [
        'stock_quantity' => $stockQuantity,
        'average_weight' => '2',
    ])->assertSessionHasErrors('stock_quantity');

    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'stock_quantity' => 8]);
})->with([
    'negative stock' => '-1',
    'non-integer stock' => '1.5',
]);

test('a seller input weight is converted to integer grams and uses the central price', function (
    string $weight,
    int $grams,
    int $price,
) {
    $seller = User::factory()->seller()->create();
    $shop = Shop::factory()->for($seller, 'seller')->create();

    $this->actingAs($seller)->patch(route('seller.shops.inventory.update', $shop), [
        'stock_quantity' => 3,
        'average_weight' => $weight,
    ])->assertRedirect();

    $shop->refresh();

    expect($shop->average_weight)->toBe($grams)
        ->and($shop->unit_price)->toBe($price);
})->with([
    '1.95 kg' => ['1.95', 1950, 2900],
    '1.999 kg' => ['1.999', 1999, 2900],
    '2 kg' => ['2', 2000, 3250],
    '2.1 kg' => ['2.1', 2100, 3250],
]);

test('a seller cannot save an invalid weight', function () {
    $seller = User::factory()->seller()->create();
    $shop = Shop::factory()->for($seller, 'seller')->create(['average_weight' => 2100]);

    $this->actingAs($seller)->patch(route('seller.shops.inventory.update', $shop), [
        'stock_quantity' => 3,
        'average_weight' => 'invalid',
    ])->assertSessionHasErrors('average_weight');

    $this->assertDatabaseHas('shops', ['id' => $shop->id, 'average_weight' => 2100]);
});

test('unexpected administrative fields are ignored during seller inventory updates', function () {
    $seller = User::factory()->seller()->create();
    $otherSeller = User::factory()->seller()->create();
    $shop = Shop::factory()->for($seller, 'seller')->create([
        'name' => 'Boutique originale',
        'zone' => 'Yoff',
        'active' => true,
    ]);

    $this->actingAs($seller)->patch(route('seller.shops.inventory.update', $shop), [
        'stock_quantity' => 9,
        'average_weight' => '2.1',
        'seller_id' => $otherSeller->id,
        'name' => 'Nom injecté',
        'zone' => 'Zone injectée',
        'active' => false,
    ])->assertRedirect();

    $this->assertDatabaseHas('shops', [
        'id' => $shop->id,
        'seller_id' => $seller->id,
        'name' => 'Boutique originale',
        'zone' => 'Yoff',
        'active' => true,
        'stock_quantity' => 9,
        'average_weight' => 2100,
    ]);
});

test('a seller can view an inactive shop but cannot update its inventory', function () {
    $seller = User::factory()->seller()->create();
    $shop = Shop::factory()->for($seller, 'seller')->inactive()->create([
        'stock_quantity' => 4,
        'average_weight' => 2100,
    ]);

    $this->actingAs($seller)->get(route('seller.shops.show', $shop))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('shop.active', false));

    $this->actingAs($seller)->patch(route('seller.shops.inventory.update', $shop), [
        'stock_quantity' => 0,
        'average_weight' => '2',
    ])->assertNotFound();

    $this->assertDatabaseHas('shops', [
        'id' => $shop->id,
        'stock_quantity' => 4,
        'average_weight' => 2100,
    ]);
});
