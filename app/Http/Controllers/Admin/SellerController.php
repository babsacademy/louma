<?php

namespace App\Http\Controllers\Admin;

use App\Actions\CreateSeller;
use App\Actions\DisableSeller;
use App\Actions\EnableSeller;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSellerRequest;
use App\Http\Requests\Admin\UpdateSellerRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SellerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $sellers = User::where('role', UserRole::Seller)
            ->withCount('shops')
            ->with(['creator:id,name'])
            ->when($search, function ($query, $search) {
                $like = '%'.$search.'%';
                $query->where(function ($q) use ($like) {
                    $q->where('name', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like);
                });
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/sellers/index', [
            'sellers' => $sellers,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/sellers/create');
    }

    public function store(StoreSellerRequest $request, CreateSeller $action): RedirectResponse
    {
        $seller = $action->execute($request->safe()->only(['name', 'email', 'phone', 'password']), $request->user());

        return redirect()->route('admin.sellers.show', $seller)->with('success', 'Vendeur créé avec succès.');
    }

    public function show(User $seller): Response
    {
        abort_if(! $seller->isSeller(), 404);

        $seller->loadCount('shops');
        $seller->load(['creator:id,name']);

        return Inertia::render('admin/sellers/show', [
            'seller' => $seller,
        ]);
    }

    public function edit(User $seller): Response
    {
        abort_if(! $seller->isSeller(), 404);

        return Inertia::render('admin/sellers/edit', [
            'seller' => $seller->only(['id', 'name', 'email', 'phone', 'active', 'disabled_at', 'created_at']),
        ]);
    }

    public function update(UpdateSellerRequest $request, User $seller): RedirectResponse
    {
        abort_if(! $seller->isSeller(), 404);

        $seller->update($request->safe()->only(['name', 'email', 'phone']));

        return redirect()->route('admin.sellers.show', $seller)->with('success', 'Informations du vendeur mises à jour.');
    }

    public function disable(Request $request, User $seller, DisableSeller $action): RedirectResponse
    {
        abort_if(! $seller->isSeller(), 404);
        abort_if(! $request->user()?->isAdmin(), 403);

        $action->execute($seller);

        return back()->with('success', 'Vendeur désactivé.');
    }

    public function enable(Request $request, User $seller, EnableSeller $action): RedirectResponse
    {
        abort_if(! $seller->isSeller(), 404);
        abort_if(! $request->user()?->isAdmin(), 403);

        $action->execute($seller);

        return back()->with('success', 'Vendeur réactivé.');
    }
}
