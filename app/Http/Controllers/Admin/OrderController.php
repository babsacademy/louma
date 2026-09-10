<?php

namespace App\Http\Controllers\Admin;

use App\Actions\CancelOrder;
use App\Actions\ConfirmOrder;
use App\Actions\RecordOrderPayment;
use App\Actions\RecordSellerPayout;
use App\Actions\TransitionOrderStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CancelOrderRequest;
use App\Http\Requests\Admin\ConfirmOrderRequest;
use App\Http\Requests\Admin\StoreOrderPaymentRequest;
use App\Http\Requests\Admin\StoreSellerPayoutRequest;
use App\Http\Requests\Admin\TransitionOrderStatusRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $status = OrderStatus::tryFrom((string) $request->input('status'));

        $orders = Order::query()
            ->with(['shop:id,seller_id,name,zone', 'shop.seller:id,name'])
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.$search.'%';
                $query->where(function ($nestedQuery) use ($like) {
                    $nestedQuery->where('reference', 'like', $like)
                        ->orWhere('customer_name', 'like', $like)
                        ->orWhere('customer_phone', 'like', $like);
                });
            })
            ->when($status, fn ($query) => $query->where('status', $status))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Order $order): array => $this->orderSummary($order));

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => ['search' => $search, 'status' => $status?->value],
            'statuses' => array_map(
                fn (OrderStatus $orderStatus): array => [
                    'value' => $orderStatus->value,
                    'label' => $this->statusLabel($orderStatus),
                ],
                OrderStatus::cases(),
            ),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load([
            'shop:id,seller_id,name,zone',
            'shop.seller:id,name,email,phone',
            'statusHistories' => fn ($query) => $query->with('changer:id,name')->oldest('created_at'),
            'payment.recorder:id,name',
            'sellerPayout.seller:id,name',
            'sellerPayout.recorder:id,name',
        ]);

        return Inertia::render('admin/orders/show', [
            'order' => [
                ...$this->orderSummary($order),
                'customer_phone' => $order->customer_phone,
                'delivery_address' => $order->delivery_address,
                'average_weight_snapshot' => $order->average_weight_snapshot,
                'commission_per_unit' => $order->commission_per_unit,
                'platform_commission' => $order->platform_commission,
                'seller_amount' => $order->seller_amount,
                'stock_reserved_at' => $order->stock_reserved_at?->toIso8601String(),
                'stock_released_at' => $order->stock_released_at?->toIso8601String(),
                'confirmed_at' => $order->confirmed_at?->toIso8601String(),
                'preparing_at' => $order->preparing_at?->toIso8601String(),
                'picked_up_at' => $order->picked_up_at?->toIso8601String(),
                'delivering_at' => $order->delivering_at?->toIso8601String(),
                'delivered_at' => $order->delivered_at?->toIso8601String(),
                'cancelled_at' => $order->cancelled_at?->toIso8601String(),
                'cancellation_reason' => $order->cancellation_reason,
                'reservation_expires_at' => $order->reservation_expires_at?->toIso8601String(),
                'history' => $order->statusHistories->map(fn ($history): array => [
                    'id' => $history->id,
                    'from_status' => $history->from_status?->value,
                    'to_status' => $history->to_status->value,
                    'reason' => $history->reason,
                    'changed_by' => $history->changer?->name,
                    'created_at' => $history->created_at->toIso8601String(),
                ])->values(),
                'payment' => $order->payment ? [
                    'id' => $order->payment->id,
                    'amount' => $order->payment->amount,
                    'method' => $order->payment->method->value,
                    'status' => $order->payment->status->value,
                    'transaction_reference' => $order->payment->transaction_reference,
                    'paid_at' => $order->payment->paid_at->toIso8601String(),
                    'recorded_by' => $order->payment->recorder?->name,
                ] : null,
                'seller_payout' => $order->sellerPayout ? [
                    'id' => $order->sellerPayout->id,
                    'amount' => $order->sellerPayout->amount,
                    'method' => $order->sellerPayout->method->value,
                    'status' => $order->sellerPayout->status->value,
                    'transaction_reference' => $order->sellerPayout->transaction_reference,
                    'paid_at' => $order->sellerPayout->paid_at->toIso8601String(),
                    'seller_name' => $order->sellerPayout->seller?->name,
                    'recorded_by' => $order->sellerPayout->recorder?->name,
                ] : null,
            ],
        ]);
    }

    public function confirm(ConfirmOrderRequest $request, Order $order, ConfirmOrder $action): RedirectResponse
    {
        $action->execute($order, $request->user());

        return back()->with('success', 'Commande confirmée.');
    }

    public function cancel(CancelOrderRequest $request, Order $order, CancelOrder $action): RedirectResponse
    {
        $action->execute($order, $request->user(), $request->validated('cancellation_reason'));

        return back()->with('success', 'Commande annulée et stock mis à jour.');
    }

    public function startPreparing(TransitionOrderStatusRequest $request, Order $order, TransitionOrderStatus $action): RedirectResponse
    {
        $action->execute($order, $request->user(), OrderStatus::Preparing);

        return back()->with('success', 'Préparation démarrée.');
    }

    public function markPickedUp(TransitionOrderStatusRequest $request, Order $order, TransitionOrderStatus $action): RedirectResponse
    {
        $action->execute($order, $request->user(), OrderStatus::PickedUp);

        return back()->with('success', 'Commande marquée comme récupérée.');
    }

    public function startDelivery(TransitionOrderStatusRequest $request, Order $order, TransitionOrderStatus $action): RedirectResponse
    {
        $action->execute($order, $request->user(), OrderStatus::Delivering);

        return back()->with('success', 'Livraison démarrée.');
    }

    public function markDelivered(TransitionOrderStatusRequest $request, Order $order, TransitionOrderStatus $action): RedirectResponse
    {
        $action->execute($order, $request->user(), OrderStatus::Delivered);

        return back()->with('success', 'Commande marquée comme livrée.');
    }

    public function recordPayment(StoreOrderPaymentRequest $request, Order $order, RecordOrderPayment $action): RedirectResponse
    {
        $action->execute($order, $request->user(), $request->validated('transaction_reference'));

        return back()->with('success', 'Paiement Wave enregistré.');
    }

    public function recordPayout(StoreSellerPayoutRequest $request, Order $order, RecordSellerPayout $action): RedirectResponse
    {
        $action->execute($order, $request->user(), $request->validated('transaction_reference'));

        return back()->with('success', 'Reversement Wave enregistré.');
    }

    /** @return array<string, mixed> */
    private function orderSummary(Order $order): array
    {
        return [
            'id' => $order->id,
            'reference' => $order->reference,
            'status' => $order->status->value,
            'status_label' => $this->statusLabel($order->status),
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'quantity' => $order->quantity,
            'unit_price' => $order->unit_price,
            'subtotal' => $order->subtotal,
            'created_at' => $order->created_at?->toIso8601String(),
            'shop' => [
                'name' => $order->shop->name,
                'zone' => $order->shop->zone,
                'seller_name' => $order->shop->seller?->name,
                'seller_phone' => $order->shop->seller?->phone,
            ],
        ];
    }

    private function statusLabel(OrderStatus $status): string
    {
        return match ($status) {
            OrderStatus::Pending => 'En attente',
            OrderStatus::Confirmed => 'Confirmée',
            OrderStatus::Preparing => 'En préparation',
            OrderStatus::PickedUp => 'Récupérée',
            OrderStatus::Delivering => 'En livraison',
            OrderStatus::Delivered => 'Livrée',
            OrderStatus::Cancelled => 'Annulée',
        };
    }
}
