<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TransitionOrderStatus
{
    public function execute(Order $order, User $administrator, OrderStatus $targetStatus): Order
    {
        if (! $administrator->isAdmin()) {
            throw new AuthorizationException('Seul un administrateur peut faire progresser une commande.');
        }

        return DB::transaction(function () use ($order, $administrator, $targetStatus): Order {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);

            if ($lockedOrder->status === $targetStatus) {
                return $lockedOrder;
            }

            if (! $this->isAllowed($lockedOrder->status, $targetStatus)) {
                throw ValidationException::withMessages([
                    'order' => 'Cette transition de commande n’est pas autorisée.',
                ]);
            }

            $now = now()->toMutable();
            $timestampField = $this->timestampField($targetStatus);
            $previousStatus = $lockedOrder->status;
            $lockedOrder->forceFill([
                'status' => $targetStatus,
                $timestampField => $now,
            ])->save();

            OrderStatusHistory::query()->create([
                'order_id' => $lockedOrder->id,
                'from_status' => $previousStatus,
                'to_status' => $targetStatus,
                'changed_by' => $administrator->id,
                'reason' => null,
                'created_at' => $now,
            ]);

            return $lockedOrder;
        }, 3);
    }

    private function isAllowed(OrderStatus $from, OrderStatus $to): bool
    {
        return match ($from) {
            OrderStatus::Pending => $to === OrderStatus::Confirmed,
            OrderStatus::Confirmed => $to === OrderStatus::Preparing,
            OrderStatus::Preparing => $to === OrderStatus::PickedUp,
            OrderStatus::PickedUp => $to === OrderStatus::Delivering,
            OrderStatus::Delivering => $to === OrderStatus::Delivered,
            OrderStatus::Delivered, OrderStatus::Cancelled => false,
        };
    }

    private function timestampField(OrderStatus $targetStatus): string
    {
        return match ($targetStatus) {
            OrderStatus::Confirmed => 'confirmed_at',
            OrderStatus::Preparing => 'preparing_at',
            OrderStatus::PickedUp => 'picked_up_at',
            OrderStatus::Delivering => 'delivering_at',
            OrderStatus::Delivered => 'delivered_at',
            default => throw new \LogicException('Le statut cible ne possède pas d’horodatage opérationnel.'),
        };
    }
}
