<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Shop;
use Illuminate\Support\Facades\DB;

class ExpireOrderReservation
{
    public const CANCELLATION_REASON = 'Réservation expirée';

    /**
     * Expire one pending reservation when it is still eligible.
     */
    public function execute(Order $order): ?Order
    {
        return DB::transaction(function () use ($order): ?Order {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);
            $now = now()->toMutable();

            if (
                $lockedOrder->status !== OrderStatus::Pending
                || $lockedOrder->reservation_expires_at === null
                || $lockedOrder->reservation_expires_at->isAfter($now)
                || $lockedOrder->stock_released_at !== null
            ) {
                return null;
            }

            $lockedShop = Shop::query()->lockForUpdate()->findOrFail($lockedOrder->shop_id);

            $lockedShop->increment('stock_quantity', $lockedOrder->quantity);
            $lockedOrder->forceFill([
                'status' => OrderStatus::Cancelled,
                'stock_released_at' => $now,
                'cancelled_at' => $now,
                'cancellation_reason' => self::CANCELLATION_REASON,
            ])->save();

            OrderStatusHistory::query()->create([
                'order_id' => $lockedOrder->id,
                'from_status' => OrderStatus::Pending,
                'to_status' => OrderStatus::Cancelled,
                'changed_by' => null,
                'reason' => self::CANCELLATION_REASON,
                'created_at' => $now,
            ]);

            return $lockedOrder;
        }, 3);
    }
}
