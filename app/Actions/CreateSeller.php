<?php

namespace App\Actions;

use App\Enums\UserRole;
use App\Models\User;

class CreateSeller
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function execute(array $validated, User $admin): User
    {
        $seller = new User;
        $seller->name = $validated['name'];
        $seller->email = $validated['email'];
        $seller->phone = $validated['phone'] ?? null;
        $seller->password = $validated['password'];
        $seller->role = UserRole::Seller;
        $seller->active = true;
        $seller->disabled_at = null;
        $seller->created_by = $admin->id;
        $seller->email_verified_at = now();
        $seller->save();

        return $seller->fresh();
    }
}
