<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated seller is dispatched from dashboard to seller space', function () {
    $seller = User::factory()->seller()->create();
    $this->actingAs($seller);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('seller.dashboard'));
});

test('authenticated admin is dispatched from dashboard to admin space', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('admin.dashboard'));
});
