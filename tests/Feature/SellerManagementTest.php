<?php

use App\Actions\CreateSeller;
use App\Actions\DisableSeller;
use App\Actions\EnableSeller;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Accès — Contrôle d'autorisation
|--------------------------------------------------------------------------
*/

test('guest cannot access sellers management routes', function () {
    $seller = User::factory()->seller()->create();

    $this->get(route('admin.sellers.index'))->assertRedirect(route('login'));
    $this->get(route('admin.sellers.create'))->assertRedirect(route('login'));
    $this->post(route('admin.sellers.store'))->assertRedirect(route('login'));
    $this->get(route('admin.sellers.show', $seller))->assertRedirect(route('login'));
    $this->get(route('admin.sellers.edit', $seller))->assertRedirect(route('login'));
    $this->patch(route('admin.sellers.update', $seller))->assertRedirect(route('login'));
    $this->post(route('admin.sellers.disable', $seller))->assertRedirect(route('login'));
    $this->post(route('admin.sellers.enable', $seller))->assertRedirect(route('login'));
});

test('seller cannot access sellers management routes', function () {
    $actor = User::factory()->seller()->create();
    $target = User::factory()->seller()->create();

    $this->actingAs($actor)->get(route('admin.sellers.index'))->assertForbidden();
    $this->actingAs($actor)->get(route('admin.sellers.create'))->assertForbidden();
    $this->actingAs($actor)->post(route('admin.sellers.store'), [])->assertForbidden();
    $this->actingAs($actor)->get(route('admin.sellers.show', $target))->assertForbidden();
    $this->actingAs($actor)->get(route('admin.sellers.edit', $target))->assertForbidden();
    $this->actingAs($actor)->patch(route('admin.sellers.update', $target), [])->assertForbidden();
    $this->actingAs($actor)->post(route('admin.sellers.disable', $target))->assertForbidden();
    $this->actingAs($actor)->post(route('admin.sellers.enable', $target))->assertForbidden();
});

test('active admin can access seller list', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->seller()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.sellers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/sellers/index'));
});

/*
|--------------------------------------------------------------------------
| Création vendeur
|--------------------------------------------------------------------------
*/

test('admin can create a seller', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->post(route('admin.sellers.store'), [
        'name' => 'Moussa Diallo',
        'email' => 'moussa@example.com',
        'phone' => '+221770000001',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('users', [
        'email' => 'moussa@example.com',
        'name' => 'Moussa Diallo',
    ]);
});

test('created seller always has role seller', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.sellers.store'), [
        'name' => 'Test Seller',
        'email' => 'test@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $user = User::where('email', 'test@example.com')->firstOrFail();
    expect($user->role)->toBe(UserRole::Seller);
});

test('created seller is active by default', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.sellers.store'), [
        'name' => 'Actif Seller',
        'email' => 'actif@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $user = User::where('email', 'actif@example.com')->firstOrFail();
    expect($user->active)->toBeTrue();
    expect($user->disabled_at)->toBeNull();
});

test('created_by is set to the creating admin id', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.sellers.store'), [
        'name' => 'Created By Test',
        'email' => 'createdby@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $user = User::where('email', 'createdby@example.com')->firstOrFail();
    expect($user->created_by)->toBe($admin->id);
});

test('password is hashed and not stored in clear text', function () {
    $admin = User::factory()->admin()->create();
    $plainPassword = 'SecurePass123!';

    $this->actingAs($admin)->post(route('admin.sellers.store'), [
        'name' => 'Hash Test',
        'email' => 'hash@example.com',
        'password' => $plainPassword,
        'password_confirmation' => $plainPassword,
    ]);

    $user = User::where('email', 'hash@example.com')->firstOrFail();

    expect($user->password)->not->toBe($plainPassword);
    expect(Hash::check($plainPassword, $user->password))->toBeTrue();
});

test('email must be unique on creation', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->seller()->create(['email' => 'existing@example.com']);

    $response = $this->actingAs($admin)->post(route('admin.sellers.store'), [
        'name' => 'Duplicate Email',
        'email' => 'existing@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $response->assertSessionHasErrors('email');
});

test('name and email are required when creating a seller', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.sellers.store'), [
            'name' => '',
            'email' => '',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ])
        ->assertSessionHasErrors(['name', 'email']);
});

test('artificially injected role in store request is ignored — role is always seller', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.sellers.store'), [
        'name' => 'Role Injection',
        'email' => 'injection@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
        'role' => 'admin',
    ]);

    $user = User::where('email', 'injection@example.com')->first();

    // If user was created, it should have seller role; if request failed, no user exists
    if ($user !== null) {
        expect($user->role)->toBe(UserRole::Seller);
    } else {
        $this->assertDatabaseMissing('users', ['email' => 'injection@example.com']);
    }
});

/*
|--------------------------------------------------------------------------
| Modification vendeur
|--------------------------------------------------------------------------
*/

test('admin can update seller name email and phone', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create(['name' => 'Old Name']);

    $this->actingAs($admin)
        ->patch(route('admin.sellers.update', $seller), [
            'name' => 'New Name',
            'email' => $seller->email,
            'phone' => '+221770000099',
        ])
        ->assertRedirect(route('admin.sellers.show', $seller));

    $seller->refresh();
    expect($seller->name)->toBe('New Name');
    expect($seller->phone)->toBe('+221770000099');
});

test('admin cannot change seller role to admin via update', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();

    $this->actingAs($admin)->patch(route('admin.sellers.update', $seller), [
        'name' => $seller->name,
        'email' => $seller->email,
        'role' => 'admin',
    ]);

    $seller->refresh();
    expect($seller->role)->toBe(UserRole::Seller);
});

test('seller cannot update another seller', function () {
    $actor = User::factory()->seller()->create();
    $target = User::factory()->seller()->create();

    $this->actingAs($actor)
        ->patch(route('admin.sellers.update', $target), [
            'name' => 'Hijacked',
            'email' => $target->email,
        ])
        ->assertForbidden();

    $target->refresh();
    expect($target->name)->not->toBe('Hijacked');
});

test('email must remain unique on update — excluding self', function () {
    $admin = User::factory()->admin()->create();
    $sellerA = User::factory()->seller()->create(['email' => 'a@example.com']);
    $sellerB = User::factory()->seller()->create(['email' => 'b@example.com']);

    // Try to take seller A's email
    $this->actingAs($admin)
        ->patch(route('admin.sellers.update', $sellerB), [
            'name' => $sellerB->name,
            'email' => 'a@example.com',
        ])
        ->assertSessionHasErrors('email');

    // Own email is allowed
    $this->actingAs($admin)
        ->patch(route('admin.sellers.update', $sellerA), [
            'name' => $sellerA->name,
            'email' => 'a@example.com',
        ])
        ->assertRedirect();
});

/*
|--------------------------------------------------------------------------
| Désactivation
|--------------------------------------------------------------------------
*/

test('admin can disable an active seller', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();

    $this->actingAs($admin)
        ->post(route('admin.sellers.disable', $seller))
        ->assertRedirect();

    $seller->refresh();
    expect($seller->active)->toBeFalse();
    expect($seller->disabled_at)->not->toBeNull();
});

test('disabling an already disabled seller is idempotent', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->inactive()->create();
    $firstDisabledAt = $seller->disabled_at;

    $this->actingAs($admin)->post(route('admin.sellers.disable', $seller));

    $seller->refresh();
    expect($seller->active)->toBeFalse();
    // disabled_at should not change (idempotent — action returns early)
    expect($seller->disabled_at->toDateTimeString())
        ->toBe($firstDisabledAt->toDateTimeString());
});

test('DisableSeller action sets active false and records disabled_at', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();

    (new DisableSeller)->execute($seller);

    $seller->refresh();
    expect($seller->active)->toBeFalse();
    expect($seller->disabled_at)->not->toBeNull();
});

/*
|--------------------------------------------------------------------------
| Réactivation
|--------------------------------------------------------------------------
*/

test('admin can enable a disabled seller', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->inactive()->create();

    $this->actingAs($admin)
        ->post(route('admin.sellers.enable', $seller))
        ->assertRedirect();

    $seller->refresh();
    expect($seller->active)->toBeTrue();
    expect($seller->disabled_at)->toBeNull();
});

test('enabling an already active seller is idempotent', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create(); // active by default

    $this->actingAs($admin)->post(route('admin.sellers.enable', $seller));

    $seller->refresh();
    expect($seller->active)->toBeTrue();
    expect($seller->disabled_at)->toBeNull();
});

test('EnableSeller action sets active true and clears disabled_at', function () {
    $seller = User::factory()->seller()->inactive()->create();

    (new EnableSeller)->execute($seller);

    $seller->refresh();
    expect($seller->active)->toBeTrue();
    expect($seller->disabled_at)->toBeNull();
});

/*
|--------------------------------------------------------------------------
| Protection des comptes admins
|--------------------------------------------------------------------------
*/

test('seller controller show returns 404 for admin id', function () {
    $admin = User::factory()->admin()->create();
    $targetAdmin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.sellers.show', $targetAdmin))
        ->assertNotFound();
});

test('seller controller edit returns 404 for admin id', function () {
    $admin = User::factory()->admin()->create();
    $targetAdmin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.sellers.edit', $targetAdmin))
        ->assertNotFound();
});

test('seller controller update returns 404 for admin id', function () {
    $admin = User::factory()->admin()->create();
    $targetAdmin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.sellers.update', $targetAdmin), [
            'name' => 'Hacked Admin',
            'email' => $targetAdmin->email,
        ])
        ->assertNotFound();

    $targetAdmin->refresh();
    expect($targetAdmin->name)->not->toBe('Hacked Admin');
});

test('seller controller disable returns 404 for admin id', function () {
    $admin = User::factory()->admin()->create();
    $targetAdmin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.sellers.disable', $targetAdmin))
        ->assertNotFound();

    $targetAdmin->refresh();
    expect($targetAdmin->active)->toBeTrue();
});

/*
|--------------------------------------------------------------------------
| Actions métier directes
|--------------------------------------------------------------------------
*/

test('CreateSeller action creates a seller with correct attributes', function () {
    $admin = User::factory()->admin()->create();

    $seller = (new CreateSeller)->execute([
        'name' => 'Fatou Diouf',
        'email' => 'fatou@example.com',
        'phone' => '+221780000001',
        'password' => bcrypt('secret'),
    ], $admin);

    expect($seller->role)->toBe(UserRole::Seller);
    expect($seller->active)->toBeTrue();
    expect($seller->created_by)->toBe($admin->id);
    expect($seller->email)->toBe('fatou@example.com');
});

test('DisableSeller action throws if called on a non-seller', function () {
    $admin = User::factory()->admin()->create();

    expect(fn () => (new DisableSeller)->execute($admin))
        ->toThrow(InvalidArgumentException::class);
});

test('EnableSeller action throws if called on a non-seller', function () {
    $admin = User::factory()->admin()->create();

    expect(fn () => (new EnableSeller)->execute($admin))
        ->toThrow(InvalidArgumentException::class);
});
