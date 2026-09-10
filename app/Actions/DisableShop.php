<?php

namespace App\Actions;

use App\Models\Shop;

class DisableShop
{
    /**
     * Désactive une boutique de façon idempotente.
     */
    public function execute(Shop $shop): Shop
    {
        if (! $shop->active) {
            return $shop;
        }

        $shop->active = false;
        $shop->save();

        return $shop;
    }
}
