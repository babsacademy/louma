<?php

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('guests and sellers cannot access shop management while active admins can', function () {
    $shop = Shop::factory()->create();
    $seller = User::factory()->seller()->create();
    $admin = User::factory()->admin()->create();

    $this->get(route('admin.shops.index'))->assertRedirect(route('login'));
    $this->actingAs($seller)->get(route('admin.shops.index'))->assertForbidden();
    $this->actingAs($admin)->get(route('admin.shops.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/shops/index'));
});

test('admin creates a shop with a seller and converts kilograms to integer grams', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();

    $this->actingAs($admin)->post(route('admin.shops.store'), [
        'seller_id' => $seller->id,
        'name' => 'Poulets des Almadies',
        'zone' => 'Almadies',
        'description' => 'Poulets fermiers',
        'stock_quantity' => 12,
        'average_weight' => '2.1',
    ])->assertRedirect();

    $shop = Shop::where('name', 'Poulets des Almadies')->firstOrFail();
    $this->assertDatabaseHas('shops', [
        'seller_id' => $seller->id,
        'slug' => 'poulets-des-almadies',
        'stock_quantity' => 12,
        'average_weight' => 2100,
        'active' => 1,
    ]);
    expect($shop->formatted_weight)->toBe('2,1 kg');
});

test('admin creation assigns the shared default image when no image is uploaded', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();

    $this->actingAs($admin)->post(route('admin.shops.store'), [
        'seller_id' => $seller->id,
        'name' => 'Boutique sans photo',
        'zone' => 'Yoff',
        'stock_quantity' => 4,
        'average_weight' => '2',
    ])->assertRedirect();

    $this->assertDatabaseHas('shops', [
        'name' => 'Boutique sans photo',
        'image_path' => Shop::DEFAULT_IMAGE_PATH,
    ]);
});

test('an admin account cannot own a shop', function () {
    $admin = User::factory()->admin()->create();
    $targetAdmin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.shops.store'), [
        'seller_id' => $targetAdmin->id,
        'name' => 'Boutique interdite',
        'zone' => 'Plateau',
        'stock_quantity' => 1,
        'average_weight' => '2',
    ])->assertSessionHasErrors('seller_id');

    $this->assertDatabaseMissing('shops', ['name' => 'Boutique interdite']);
});

test('shop names receive a unique generated slug', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();
    Shop::factory()->create(['name' => 'Même nom', 'slug' => 'meme-nom']);

    $this->actingAs($admin)->post(route('admin.shops.store'), [
        'seller_id' => $seller->id,
        'name' => 'Même nom',
        'zone' => 'Yoff',
        'stock_quantity' => 0,
        'average_weight' => '1.999',
    ])->assertRedirect();

    $this->assertDatabaseHas('shops', ['slug' => 'meme-nom-1', 'average_weight' => 1999]);
});

test('admin updates a shop and replaces its image safely', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();
    $shop = Shop::factory()->create(['image_path' => 'shops/old.jpg']);
    Storage::disk('public')->put('shops/old.jpg', 'old');

    $this->actingAs($admin)->patch(route('admin.shops.update', $shop), [
        'seller_id' => $seller->id,
        'name' => 'Boutique modifiée',
        'zone' => 'Yoff',
        'stock_quantity' => 5,
        'average_weight' => '1.999',
        'image' => UploadedFile::fake()->image('nouvelle.png', 640, 480),
    ])->assertRedirect();

    $shop->refresh();
    expect($shop->seller_id)->toBe($seller->id)
        ->and($shop->average_weight)->toBe(1999)
        ->and($shop->stock_quantity)->toBe(5)
        ->and($shop->image_path)->not->toBe('shops/old.jpg');
    Storage::disk('public')->assertMissing('shops/old.jpg');
    Storage::disk('public')->assertExists($shop->image_path);
});

test('replacing the default image keeps the shared asset available', function () {
    Storage::fake('public');
    Storage::disk('public')->put(Shop::DEFAULT_IMAGE_PATH, 'default image');

    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();
    $shop = Shop::factory()->create(['image_path' => Shop::DEFAULT_IMAGE_PATH]);

    $this->actingAs($admin)->patch(route('admin.shops.update', $shop), [
        'seller_id' => $seller->id,
        'name' => $shop->name,
        'zone' => $shop->zone,
        'stock_quantity' => $shop->stock_quantity,
        'average_weight' => '2',
        'image' => UploadedFile::fake()->image('photo-boutique.png', 640, 480),
    ])->assertRedirect();

    $shop->refresh();

    expect($shop->image_path)->not->toBe(Shop::DEFAULT_IMAGE_PATH);
    Storage::disk('public')->assertExists(Shop::DEFAULT_IMAGE_PATH);
    Storage::disk('public')->assertExists($shop->image_path);
});

test('shop activation actions are idempotent', function () {
    $admin = User::factory()->admin()->create();
    $shop = Shop::factory()->inactive()->create();

    $this->actingAs($admin)->post(route('admin.shops.enable', $shop))->assertRedirect();
    $shop->refresh();
    expect($shop->active)->toBeTrue();

    $this->actingAs($admin)->post(route('admin.shops.enable', $shop))->assertRedirect();
    $this->actingAs($admin)->post(route('admin.shops.disable', $shop))->assertRedirect();
    $shop->refresh();
    expect($shop->active)->toBeFalse();

    $this->actingAs($admin)->post(route('admin.shops.disable', $shop))->assertRedirect();
    expect($shop->fresh()->active)->toBeFalse();
});

test('shop creation validates non-negative stock and reasonable weight', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();

    $this->actingAs($admin)->post(route('admin.shops.store'), [
        'seller_id' => $seller->id,
        'name' => 'Entrée invalide',
        'zone' => 'Plateau',
        'stock_quantity' => -1,
        'average_weight' => '12',
    ])->assertSessionHasErrors(['stock_quantity', 'average_weight']);
});
