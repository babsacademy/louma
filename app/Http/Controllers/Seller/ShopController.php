<?php

namespace App\Http\Controllers\Seller;

use App\Actions\UpdateSellerShopInventory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\UpdateSellerShopInventoryRequest;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(Request $request): Response
    {
        $shops = $this->seller($request)->shops()
            ->select([
                'id',
                'name',
                'zone',
                'image_path',
                'stock_quantity',
                'average_weight',
                'active',
                'created_at',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Shop $shop) => $this->shopData($shop));

        return Inertia::render('seller/shops/index', ['shops' => $shops]);
    }

    public function show(Shop $shop): Response
    {
        Gate::authorize('view', $shop);

        return Inertia::render('seller/shops/show', [
            'shop' => $this->shopData($shop, true),
        ]);
    }

    public function updateInventory(
        UpdateSellerShopInventoryRequest $request,
        Shop $shop,
        UpdateSellerShopInventory $action,
    ): RedirectResponse {
        $updatedShop = $action->execute(
            $shop,
            $request->stockQuantity(),
            $request->averageWeightInGrams(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Les informations de stock ont été mises à jour.',
        ]);

        return to_route('seller.shops.show', $updatedShop);
    }

    private function seller(Request $request): User
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        return $user;
    }

    /** @return array<string, bool|float|int|string|null> */
    private function shopData(Shop $shop, bool $withDescription = false): array
    {
        return [
            'id' => $shop->id,
            'name' => $shop->name,
            'zone' => $shop->zone,
            'description' => $withDescription ? $shop->description : null,
            'image_url' => $shop->image_url,
            'stock_quantity' => $shop->stock_quantity,
            'average_weight_kg' => $shop->average_weight_kg,
            'formatted_weight' => $shop->formatted_weight,
            'unit_price' => $shop->unit_price,
            'active' => $shop->active,
        ];
    }
}
