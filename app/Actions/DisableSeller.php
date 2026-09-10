<?php

namespace App\Actions;

use App\Enums\UserRole;
use App\Models\User;
use InvalidArgumentException;

class DisableSeller
{
    public function execute(User $seller): User
    {
        if ($seller->role !== UserRole::Seller) {
            throw new InvalidArgumentException('DisableSeller ne peut agir que sur des utilisateurs du rôle vendeur.');
        }

        if (! $seller->active || $seller->disabled_at !== null) {
            return $seller;
        }

        $seller->active = false;
        $seller->disabled_at = now();
        $seller->save();

        return $seller;
    }
}
