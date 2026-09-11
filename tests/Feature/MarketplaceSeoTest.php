<?php

use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('robots excludes private areas and references the sitemap', function () {
    $this->get(route('robots'))
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
        ->assertSee('Disallow: /admin', false)
        ->assertSee('Disallow: /seller', false)
        ->assertSee('Disallow: /commande/', false)
        ->assertSee('Sitemap: '.route('sitemap'), false);
});

test('sitemap contains only publicly visible shops', function () {
    $activeSeller = User::factory()->seller()->create();
    $activeShop = Shop::factory()->for($activeSeller, 'seller')->create([
        'slug' => 'poulets-yoff',
    ]);
    $inactiveShop = Shop::factory()->inactive()->create([
        'slug' => 'boutique-inactive',
    ]);
    $inactiveSeller = User::factory()->seller()->inactive()->create();
    $shopWithInactiveSeller = Shop::factory()->for($inactiveSeller, 'seller')->create([
        'slug' => 'vendeur-inactif',
    ]);

    $this->get(route('sitemap'))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
        ->assertSee(route('home'), false)
        ->assertSee(route('public.shops.show', $activeShop), false)
        ->assertDontSee(route('public.shops.show', $inactiveShop), false)
        ->assertDontSee(route('public.shops.show', $shopWithInactiveSeller), false);
});

test('public shop pages provide indexable canonical metadata', function () {
    $shop = Shop::factory()->create([
        'name' => 'Poulets de Yoff',
        'slug' => 'poulets-de-yoff',
        'zone' => 'Yoff',
    ]);

    $this->get(route('public.shops.show', $shop))
        ->assertOk()
        ->assertSee('Poulets de Yoff — Poulets à Yoff', false)
        ->assertSee('name="robots" content="index, follow"', false)
        ->assertSee('rel="canonical" href="'.route('public.shops.show', $shop).'"', false)
        ->assertSee('type="application/ld+json"', false)
        ->assertSee('https://schema.org/InStock', false);
});

test('public order confirmations are not indexable', function () {
    $order = Order::factory()->create();

    $this->get(route('public.orders.show', [
        'order' => $order->reference,
        'requestToken' => $order->request_token,
    ]))
        ->assertOk()
        ->assertSee('name="robots" content="noindex, nofollow"', false);
});
