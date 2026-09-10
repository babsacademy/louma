<?php

namespace App\Actions;

use App\Enums\UserRole;
use App\Models\User;
use InvalidArgumentException;

class EnableSeller
{
    public function execute(User $seller): User
    {
        if ($seller->role !== UserRole::Seller) {
            throw new InvalidArgumentException('EnableSeller ne peut agir que sur des utilisateurs du rôle vendeur.');
        }

        if ($seller->active && $seller->disabled_at === null) {
            return $seller;
        }

        $seller->active = true;
        $seller->disabled_at = null;
        $seller->save();

        return $seller;
    }
}
