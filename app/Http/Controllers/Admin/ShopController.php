<?php

namespace App\Http\Controllers\Admin;

use App\Actions\CreateShop;
use App\Actions\DisableShop;
use App\Actions\EnableShop;
use App\Actions\UpdateShop;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreShopRequest;
use App\Http\Requests\Admin\UpdateShopRequest;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    /**
     * Display a paginated listing of shops.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $zone = $request->input('zone');
        $status = $request->input('status');

        $shops = Shop::with('seller:id,name,email,phone')
            ->when($search, function ($query, $search) {
                $like = '%'.$search.'%';
                $query->where(function ($q) use ($like) {
                    $q->where('name', 'like', $like)
                        ->orWhere('zone', 'like', $like)
                        ->orWhereHas('seller', function ($sq) use ($like) {
                            $sq->where('name', 'like', $like)
                                ->orWhere('email', 'like', $like);
                        });
                });
            })
            ->when($zone, function ($query, $zone) {
                $query->where('zone', $zone);
            })
            ->when($status !== null && $status !== '', function ($query) use ($status) {
                if ($status === 'active') {
                    $query->where('active', true);
                } elseif ($status === 'inactive') {
                    $query->where('active', false);
                }
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $zones = Shop::distinct()->orderBy('zone')->pluck('zone');

        return Inertia::render('admin/shops/index', [
            'shops' => $shops,
            'zones' => $zones,
            'filters' => [
                'search' => $search,
                'zone' => $zone,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Show the form for creating a new shop.
     */
    public function create(): Response
    {
        $sellers = User::where('role', UserRole::Seller)
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone']);

        return Inertia::render('admin/shops/create', [
            'sellers' => $sellers,
        ]);
    }

    /**
     * Store a newly created shop in storage.
     */
    public function store(StoreShopRequest $request, CreateShop $action): RedirectResponse
    {
        $shop = $action->execute(
            $request->safe()->except(['image']),
            $request->file('image')
        );

        return redirect()->route('admin.shops.show', $shop)
            ->with('success', 'Boutique créée avec succès.');
    }

    /**
     * Display the specified shop.
     */
    public function show(Shop $shop): Response
    {
        $shop->load('seller:id,name,email,phone,active');

        return Inertia::render('admin/shops/show', [
            'shop' => $shop,
        ]);
    }

    /**
     * Show the form for editing the specified shop.
     */
    public function edit(Shop $shop): Response
    {
        $sellers = User::where('role', UserRole::Seller)
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone']);

        // S'assurer que le propriétaire actuel fait partie de la liste même s'il est inactif
        if (! $sellers->contains('id', $shop->seller_id)) {
            $currentSeller = User::whereKey($shop->seller_id)
                ->where('role', UserRole::Seller)
                ->first();
            if ($currentSeller) {
                $sellers->prepend($currentSeller);
            }
        }

        return Inertia::render('admin/shops/edit', [
            'shop' => $shop->load('seller:id,name,email,phone'),
            'sellers' => $sellers,
        ]);
    }

    /**
     * Update the specified shop in storage.
     */
    public function update(UpdateShopRequest $request, Shop $shop, UpdateShop $action): RedirectResponse
    {
        $action->execute(
            $shop,
            $request->safe()->except(['image']),
            $request->file('image')
        );

        return redirect()->route('admin.shops.show', $shop)
            ->with('success', 'Boutique mise à jour avec succès.');
    }

    /**
     * Disable the specified shop.
     */
    public function disable(Request $request, Shop $shop, DisableShop $action): RedirectResponse
    {
        abort_if(! $request->user()?->isAdmin(), 403);

        $action->execute($shop);

        return back()->with('success', 'Boutique désactivée.');
    }

    /**
     * Enable the specified shop.
     */
    public function enable(Request $request, Shop $shop, EnableShop $action): RedirectResponse
    {
        abort_if(! $request->user()?->isAdmin(), 403);

        $action->execute($shop);

        return back()->with('success', 'Boutique réactivée.');
    }
}
