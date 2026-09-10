<?php

namespace App\Actions;

use App\Models\Shop;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class UpdateSellerShopInventory
{
    public function execute(Shop $shop, int $stockQuantity, int $averageWeightInGrams): Shop
    {
        if ($stockQuantity < 0 || $averageWeightInGrams < 500 || $averageWeightInGrams > 10000) {
            throw new InvalidArgumentException('Les données de stock ou de poids sont invalides.');
        }

        return DB::transaction(function () use ($shop, $stockQuantity, $averageWeightInGrams): Shop {
            $lockedShop = Shop::query()
                ->lockForUpdate()
                ->findOrFail($shop->id);

            if (! $lockedShop->active) {
                throw (new AuthorizationException)->asNotFound();
            }

            $lockedShop->stock_quantity = $stockQuantity;
            $lockedShop->average_weight = $averageWeightInGrams;
            $lockedShop->save();

            return $lockedShop;
        });
    }
}
