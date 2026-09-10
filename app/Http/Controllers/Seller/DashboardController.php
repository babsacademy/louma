<?php

namespace App\Http\Controllers\Seller;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\SellerPayout;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
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
            ->latest()
            ->get();

        return Inertia::render('seller/dashboard', [
            'stats' => [
                'total_shops' => $shops->count(),
                'total_stock' => $shops->sum('stock_quantity'),
                'active_shops' => $shops->where('active', true)->count(),
                'out_of_stock_shops' => $shops->where('stock_quantity', 0)->count(),
                'orders_to_prepare' => $this->orderCount($request, [OrderStatus::Pending, OrderStatus::Confirmed]),
                'orders_preparing' => $this->orderCount($request, [OrderStatus::Preparing]),
                'recently_delivered' => $this->orderCount($request, [OrderStatus::Delivered]),
                'pending_payout_amount' => $this->pendingPayoutAmount($request),
                'paid_payout_amount' => (int) SellerPayout::query()
                    ->where('seller_id', $this->seller($request)->id)
                    ->sum('amount'),
            ],
            'shops' => $shops->map(fn (Shop $shop) => $this->shopData($shop)),
        ]);
    }

    /** @param list<OrderStatus> $statuses */
    private function orderCount(Request $request, array $statuses): int
    {
        return Order::query()
            ->whereHas('shop', fn ($query) => $query->where('seller_id', $this->seller($request)->id))
            ->whereIn('status', $statuses)
            ->count();
    }

    private function pendingPayoutAmount(Request $request): int
    {
        return (int) Order::query()
            ->whereHas('shop', fn ($query) => $query->where('seller_id', $this->seller($request)->id))
            ->where('status', OrderStatus::Delivered)
            ->whereDoesntHave('sellerPayout')
            ->sum('seller_amount');
    }

    private function seller(Request $request): User
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        return $user;
    }

    /** @return array<string, bool|int|string|null> */
    private function shopData(Shop $shop): array
    {
        return [
            'id' => $shop->id,
            'name' => $shop->name,
            'zone' => $shop->zone,
            'image_url' => $shop->image_url,
            'stock_quantity' => $shop->stock_quantity,
            'formatted_weight' => $shop->formatted_weight,
            'unit_price' => $shop->unit_price,
            'active' => $shop->active,
        ];
    }
}
