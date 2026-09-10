<?php

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests can browse active shops without private seller data', function () {
    $seller = User::factory()->seller()->create();
    $activeShop = Shop::factory()->for($seller, 'seller')->create([
        'name' => 'Poulets de Yoff',
        'zone' => 'Yoff',
        'average_weight' => 2100,
        'stock_quantity' => 8,
    ]);
    Shop::factory()->inactive()->create(['name' => 'Boutique inactive']);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/shops/index')
            ->has('shops.data', 1)
            ->where('shops.data.0.name', $activeShop->name)
            ->where('shops.data.0.unit_price', 3250)
            ->missing('shops.data.0.seller_id')
            ->missing('shops.data.0.image_path'));
});

test('the marketplace search and zone filter are server-side and combinable', function () {
    $seller = User::factory()->seller()->create();
    Shop::factory()->for($seller, 'seller')->create(['name' => 'Ferme Almadies', 'zone' => 'Almadies']);
    Shop::factory()->for($seller, 'seller')->create(['name' => 'Poulets Yoff', 'zone' => 'Yoff']);

    $this->get(route('public.shops.index', ['search' => 'Ferme', 'zone' => 'Almadies']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('shops.data', 1)
            ->where('shops.data.0.name', 'Ferme Almadies')
            ->where('filters.search', 'Ferme')
            ->where('filters.zone', 'Almadies'));
});

test('the marketplace paginates active shops', function () {
    $seller = User::factory()->seller()->create();
    Shop::factory()->for($seller, 'seller')->count(13)->create();

    $this->get(route('public.shops.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('shops.data', 12)
            ->where('shops.total', 13)
            ->where('shops.last_page', 2));
});

test('an active shop is accessible by its slug with public pricing details', function () {
    $shop = Shop::factory()->create([
        'slug' => 'poulets-ouakam',
        'average_weight' => 1999,
        'stock_quantity' => 4,
    ]);

    $this->get(route('public.shops.show', ['shop' => $shop->slug]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/shops/show')
            ->where('shop.slug', $shop->slug)
            ->where('shop.unit_price', 2900)
            ->where('shop.formatted_weight', '1,999 kg')
            ->where('shop.stock_quantity', 4)
            ->missing('shop.seller'));
});

test('inactive shops, inactive sellers, and unknown slugs are not publicly accessible', function () {
    $inactiveShop = Shop::factory()->inactive()->create(['slug' => 'inactive']);
    $inactiveSeller = User::factory()->seller()->inactive()->create();
    $shopWithInactiveSeller = Shop::factory()->for($inactiveSeller, 'seller')->create(['slug' => 'vendeur-inactif']);

    $this->get(route('public.shops.show', ['shop' => $inactiveShop->slug]))->assertNotFound();
    $this->get(route('public.shops.show', ['shop' => $shopWithInactiveSeller->slug]))->assertNotFound();
    $this->get('/boutiques/introuvable')->assertNotFound();
});

test('public marketplace routes cannot modify a shop or its stock', function () {
    $shop = Shop::factory()->create(['stock_quantity' => 5]);

    $this->post(route('public.shops.index'), ['stock_quantity' => 0])
        ->assertMethodNotAllowed();
    $this->patch(route('public.shops.show', ['shop' => $shop->slug]), ['stock_quantity' => 0])
        ->assertMethodNotAllowed();

    $this->assertDatabaseHas('shops', [
        'id' => $shop->id,
        'stock_quantity' => 5,
    ]);
});
