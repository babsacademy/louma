<?php

use App\Actions\Fortify\CreateNewUser;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Inscription publique désactivée
|--------------------------------------------------------------------------
*/

test('register route is not available publicly', function () {
    $response = $this->get('/register');

    $response->assertNotFound();
});

test('public request to register endpoint returns not found', function () {
    $response = $this->post('/register', [
        'name' => 'Intruder',
        'email' => 'intruder@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertNotFound();
    $this->assertGuest();
    $this->assertDatabaseMissing('users', ['email' => 'intruder@example.com']);
});

test('public request cannot create a seller or admin account', function () {
    $response = $this->post('/register', [
        'name' => 'Intruder',
        'email' => 'intruder@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'admin',
    ]);

    $response->assertNotFound();
    $this->assertGuest();
});

/*
|--------------------------------------------------------------------------
| Connexion et Redirections
|--------------------------------------------------------------------------
*/

test('active admin can authenticate and is redirected to /admin', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->post(route('login.store'), [
        'email' => $admin->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($admin);
    $response->assertRedirect(route('admin.dashboard'));
});

test('active seller can authenticate and is redirected to /seller', function () {
    $seller = User::factory()->seller()->create();

    $response = $this->post(route('login.store'), [
        'email' => $seller->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($seller);
    $response->assertRedirect(route('seller.dashboard'));
});

test('inactive user cannot authenticate', function () {
    $user = User::factory()->seller()->inactive()->create();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors('email');
});

/*
|--------------------------------------------------------------------------
| Autorisations et Middlewares
|--------------------------------------------------------------------------
*/

test('unauthenticated user cannot access protected spaces', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
    $this->get(route('seller.dashboard'))->assertRedirect(route('login'));
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('admin can access /admin but is forbidden on /seller', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('seller.dashboard'))
        ->assertForbidden();
});

test('seller can access /seller but is forbidden on /admin', function () {
    $seller = User::factory()->seller()->create();

    $this->actingAs($seller)
        ->get(route('seller.dashboard'))
        ->assertOk();

    $this->actingAs($seller)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('dashboard route dispatches admin to /admin and seller to /seller', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertRedirect(route('admin.dashboard'));

    $this->actingAs($seller)
        ->get(route('dashboard'))
        ->assertRedirect(route('seller.dashboard'));
});

test('disabled user with an existing session is blocked and redirected to login', function () {
    $seller = User::factory()->seller()->create(['active' => true]);

    $this->actingAs($seller);
    $this->assertAuthenticatedAs($seller);

    // Admin disables the seller directly in database via query builder (bypassing model events/cache)
    DB::table('users')
        ->where('id', $seller->id)
        ->update([
            'active' => false,
            'disabled_at' => now(),
        ]);

    // Sanity check: fresh model confirms disabled state
    expect($seller->fresh()->active)->toBeFalse();

    // Next request with the active session is intercepted by EnsureUserIsActive
    $response = $this->get(route('seller.dashboard'));

    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('disabled user cannot access any protected settings route while session was open', function () {
    $seller = User::factory()->seller()->create();
    $this->actingAs($seller);

    DB::table('users')
        ->where('id', $seller->id)
        ->update(['active' => false, 'disabled_at' => now()]);

    $this->get(route('profile.edit'))->assertRedirect(route('login'));
    $this->assertGuest();
});

test('CreateNewUser ignores injected role and fails because role is required', function () {
    $action = new CreateNewUser;

    $this->expectException(QueryException::class);

    $action->create([
        'name' => 'Test',
        'email' => 'new@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'admin',
        'active' => true,
    ]);
});

test('cannot assign admin or seller role via mass assignment on User create', function () {
    $user = User::factory()->seller()->create();

    $fillable = (new ReflectionClass($user))->getAttributes(Fillable::class);
    $allowedFields = $fillable[0]->getArguments()[0] ?? [];

    expect($allowedFields)->toContain('name', 'email', 'password');
    expect($allowedFields)->not->toContain('role', 'active', 'disabled_at', 'created_by');
});

test('User model guards protected fields against fill even if explicitly attempted', function () {
    $seller = User::factory()->seller()->create();
    $originalRole = $seller->role;
    $originalActive = $seller->active;

    $seller->fill([
        'name' => 'Updated Name',
        'role' => UserRole::Admin,
        'active' => false,
        'disabled_at' => now(),
    ]);

    expect($seller->name)->toBe('Updated Name');
    expect($seller->role)->toBe($originalRole);
    expect($seller->active)->toBe($originalActive);
    expect($seller->disabled_at)->toBeNull();
});

test('admin user cannot access seller-exclusive routes', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('seller.dashboard'))
        ->assertForbidden();
});

test('seller cannot delete account even via profile.destroy route', function () {
    $seller = User::factory()->seller()->create();

    $response = $this->actingAs($seller)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response->assertForbidden();
    $this->assertModelExists($seller);
});

test('public cannot access admin, seller or dashboard routes', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
    $this->get(route('seller.dashboard'))->assertRedirect(route('login'));
    $this->get(route('dashboard'))->assertRedirect(route('login'));
    $this->get(route('profile.edit'))->assertRedirect(route('login'));
});

/*
|--------------------------------------------------------------------------
| Rôles et Mass Assignment Protection
|--------------------------------------------------------------------------
*/

test('user roles are correctly recognized', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();

    expect($admin->role)->toBe(UserRole::Admin)
        ->and($admin->isAdmin())->toBeTrue()
        ->and($admin->isSeller())->toBeFalse();

    expect($seller->role)->toBe(UserRole::Seller)
        ->and($seller->isSeller())->toBeTrue()
        ->and($seller->isAdmin())->toBeFalse();
});

test('role cannot be altered via mass assignment or profile update', function () {
    $seller = User::factory()->seller()->create();

    $this->actingAs($seller)
        ->patch(route('profile.update'), [
            'name' => 'Updated Name',
            'email' => $seller->email,
            'role' => 'admin',
            'active' => false,
        ]);

    $seller->refresh();

    expect($seller->name)->toBe('Updated Name')
        ->and($seller->role)->toBe(UserRole::Seller)
        ->and($seller->active)->toBeTrue();
});

/*
|--------------------------------------------------------------------------
| Suppression de compte désactivée pour les comptes métier
|--------------------------------------------------------------------------
*/

test('seller or user cannot delete their account', function () {
    $seller = User::factory()->seller()->create();

    $response = $this->actingAs($seller)->delete('/settings/profile', [
        'password' => 'password',
    ]);

    $response->assertForbidden();
    expect($seller->fresh())->not->toBeNull();
});
