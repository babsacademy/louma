<?php

namespace App\Policies;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ShopPolicy
{
    public function view(User $user, Shop $shop): Response
    {
        return $this->ownsShop($user, $shop)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function updateInventory(User $user, Shop $shop): Response
    {
        return $this->ownsShop($user, $shop) && $shop->active
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    private function ownsShop(User $user, Shop $shop): bool
    {
        return $user->isSeller() && $shop->seller_id === $user->id;
    }
}
