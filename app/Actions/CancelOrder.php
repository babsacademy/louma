<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CancelOrder
{
    public function execute(Order $order, User $administrator, ?string $reason): Order
    {
        if (! $administrator->isAdmin()) {
            throw new AuthorizationException('Seul un administrateur peut annuler une commande.');
        }

        return DB::transaction(function () use ($order, $administrator, $reason): Order {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);

            if ($lockedOrder->status === OrderStatus::Cancelled) {
                return $lockedOrder;
            }

            if (! in_array($lockedOrder->status, [OrderStatus::Pending, OrderStatus::Confirmed, OrderStatus::Preparing], true)) {
                throw ValidationException::withMessages([
                    'order' => 'Cette commande ne peut plus être annulée après récupération chez le vendeur.',
                ]);
            }

            if ($lockedOrder->status !== OrderStatus::Pending && blank($reason)) {
                throw ValidationException::withMessages([
                    'cancellation_reason' => 'Un motif est obligatoire après confirmation.',
                ]);
            }

            $now = now()->toMutable();
            $lockedShop = Shop::query()->lockForUpdate()->findOrFail($lockedOrder->shop_id);

            if ($lockedOrder->stock_released_at === null) {
                $lockedShop->increment('stock_quantity', $lockedOrder->quantity);
                $lockedOrder->stock_released_at = $now;
            }

            $previousStatus = $lockedOrder->status;
            $lockedOrder->forceFill([
                'status' => OrderStatus::Cancelled,
                'cancelled_at' => $now,
                'cancellation_reason' => $reason,
            ])->save();

            OrderStatusHistory::query()->create([
                'order_id' => $lockedOrder->id,
                'from_status' => $previousStatus,
                'to_status' => OrderStatus::Cancelled,
                'changed_by' => $administrator->id,
                'reason' => $reason,
                'created_at' => $now,
            ]);

            return $lockedOrder;
        }, 3);
    }
}
