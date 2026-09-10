<?php

namespace App\Http\Controllers\Public;

use App\Actions\CreateOrder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\StorePublicOrderRequest;
use App\Models\Order;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function store(StorePublicOrderRequest $request, Shop $shop, CreateOrder $action): RedirectResponse
    {
        $order = $action->execute(
            $shop,
            $request->string('customer_name')->toString(),
            $request->string('customer_phone')->toString(),
            $request->string('delivery_address')->toString(),
            $request->integer('quantity'),
            $request->string('request_token')->toString(),
        );

        return redirect()->route('public.orders.show', [
            'order' => $order->reference,
            'requestToken' => $order->request_token,
        ]);
    }

    public function show(Order $order, string $requestToken): Response
    {
        abort_unless(hash_equals($order->request_token, $requestToken), 404);

        $order->load('shop:id,name,zone');

        return Inertia::render('public/orders/show', [
            'order' => [
                'reference' => $order->reference,
                'shop_name' => $order->shop->name,
                'shop_zone' => $order->shop->zone,
                'customer_name' => $order->customer_name,
                'customer_phone_masked' => substr($order->customer_phone, 0, 7).'•••'.substr($order->customer_phone, -2),
                'delivery_address' => $order->delivery_address,
                'quantity' => $order->quantity,
                'average_weight_snapshot' => $order->average_weight_snapshot,
                'unit_price' => $order->unit_price,
                'subtotal' => $order->subtotal,
                'status' => $order->status->value,
                'cancellation_reason' => $order->status->value === 'cancelled'
                    ? $order->cancellation_reason
                    : null,
                'created_at' => $order->created_at?->toIso8601String(),
            ],
        ]);
    }
}
