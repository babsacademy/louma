<?php

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthenticated guest cannot access admin dashboard', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('login'));
});

test('seller cannot access admin dashboard', function () {
    $seller = User::factory()->seller()->create();

    $this->actingAs($seller)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('active admin can access admin dashboard and receives expected data', function () {
    $admin = User::factory()->admin()->create();

    // Create 3 active sellers and 2 inactive sellers
    User::factory()->seller()->count(3)->create(['active' => true]);
    User::factory()->seller()->inactive()->count(2)->create();

    // Create shops associated with one of the sellers
    $sellerWithShops = User::where('active', true)->where('role', 'seller')->first();
    Shop::factory()->count(2)->create(['seller_id' => $sellerWithShops->id]);

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('stats')
            ->where('stats.total_sellers', 5)
            ->where('stats.active_sellers', 3)
            ->where('stats.inactive_sellers', 2)
            ->where('stats.total_shops', 2)
            ->where('stats.total_orders', 0)
            ->has('recent_sellers', 5)
        );
});

test('admin dashboard accurately limits recent sellers to 5', function () {
    $admin = User::factory()->admin()->create();

    User::factory()->seller()->count(8)->create();

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('recent_sellers', 5)
        );
});
