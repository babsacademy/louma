<?php

namespace App\Actions;

use App\Models\Shop;

class EnableShop
{
    /**
     * Réactive une boutique de façon idempotente.
     */
    public function execute(Shop $shop): Shop
    {
        if ($shop->active) {
            return $shop;
        }

        $shop->active = true;
        $shop->save();

        return $shop;
    }
}
