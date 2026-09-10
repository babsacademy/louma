<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $sellerId = $request->user()?->id;

        $orders = Order::query()
            ->with(['shop:id,seller_id,name,zone', 'sellerPayout:id,order_id,status,paid_at'])
            ->whereHas('shop', fn ($query) => $query->where('seller_id', $sellerId))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->through(fn (Order $order): array => $this->orderData($order));

        return Inertia::render('seller/orders/index', ['orders' => $orders]);
    }

    public function show(Order $order): Response
    {
        Gate::authorize('view', $order);
        $order->load(['shop:id,seller_id,name,zone', 'sellerPayout:id,order_id,status,paid_at']);

        return Inertia::render('seller/orders/show', [
            'order' => $this->orderData($order),
        ]);
    }

    /** @return array<string, int|string|array<string, string|null>|null> */
    private function orderData(Order $order): array
    {
        return [
            'id' => $order->id,
            'reference' => $order->reference,
            'status' => $order->status->value,
            'quantity' => $order->quantity,
            'average_weight_snapshot' => $order->average_weight_snapshot,
            'seller_amount' => $order->seller_amount,
            'seller_payout' => $order->sellerPayout ? [
                'status' => $order->sellerPayout->status->value,
                'paid_at' => $order->sellerPayout->paid_at->toIso8601String(),
            ] : null,
            'created_at' => $order->created_at?->toIso8601String(),
            'shop' => [
                'name' => $order->shop->name,
                'zone' => $order->shop->zone,
            ],
        ];
    }
}
