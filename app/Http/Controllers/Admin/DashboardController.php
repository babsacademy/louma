<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $sellerQuery = User::where('role', UserRole::Seller);

        $stats = [
            'total_sellers' => (clone $sellerQuery)->count(),
            'active_sellers' => (clone $sellerQuery)->where('active', true)->count(),
            'inactive_sellers' => (clone $sellerQuery)->where('active', false)->count(),
            'total_shops' => Shop::count(),
            'total_orders' => Order::count(),
        ];

        $recentSellers = User::where('role', UserRole::Seller)
            ->withCount('shops')
            ->latest()
            ->take(5)
            ->get(['id', 'name', 'email', 'phone', 'active', 'disabled_at', 'created_at']);

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recent_sellers' => $recentSellers,
        ]);
    }
}
