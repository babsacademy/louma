<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $zone = $request->string('zone')->trim()->toString();

        $shops = $this->publicShops()
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.$search.'%';

                $query->where(function ($query) use ($like) {
                    $query->where('name', 'like', $like)
                        ->orWhere('zone', 'like', $like);
                });
            })
            ->when($zone !== '', fn ($query) => $query->where('zone', $zone))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(12)
            ->through(fn (Shop $shop) => $this->shopData($shop))
            ->withQueryString();

        $zones = $this->publicShops()
            ->distinct()
            ->orderBy('zone')
            ->pluck('zone');

        $mapShops = $this->publicShops()
            ->orderBy('zone')
            ->orderBy('name')
            ->get()
            ->map(fn (Shop $shop) => $this->shopData($shop));

        return Inertia::render('public/shops/index', [
            'shops' => $shops,
            'zones' => $zones,
            'mapShops' => $mapShops,
            'filters' => [
                'search' => $search,
                'zone' => $zone,
            ],
        ]);
    }

    public function show(Shop $shop): Response
    {
        abort_unless(
            $shop->active && $shop->seller()->where('active', true)->exists(),
            404,
        );

        return Inertia::render('public/shops/show', [
            'shop' => $this->shopData($shop, true),
        ]);
    }

    /**
     * @return Builder<Shop>
     */
    private function publicShops(): Builder
    {
        return Shop::query()
            ->select([
                'id',
                'name',
                'slug',
                'zone',
                'description',
                'image_path',
                'stock_quantity',
                'average_weight',
                'active',
                'created_at',
            ])
            ->where('active', true)
            ->whereHas('seller', fn ($query) => $query->where('active', true));
    }

    /**
     * @return array<string, int|string|null>
     */
    private function shopData(Shop $shop, bool $withDescription = false): array
    {
        return [
            'id' => $shop->id,
            'name' => $shop->name,
            'slug' => $shop->slug,
            'zone' => $shop->zone,
            'description' => $withDescription ? $shop->description : null,
            'image_url' => $shop->image_url,
            'stock_quantity' => $shop->stock_quantity,
            'formatted_weight' => $shop->formatted_weight,
            'unit_price' => $shop->unit_price,
        ];
    }
}
