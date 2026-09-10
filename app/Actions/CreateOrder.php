<?php

namespace App\Actions;

use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Shop;
use App\Services\ChickenPriceCalculator;
use Carbon\CarbonInterface;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateOrder
{
    /**
     * Reserve stock and create a public order from validated customer details.
     */
    public function execute(
        Shop $shop,
        string $customerName,
        string $customerPhone,
        string $deliveryAddress,
        int $quantity,
        string $requestToken,
    ): Order {
        $details = [
            'customer_name' => $customerName,
            'customer_phone' => $customerPhone,
            'delivery_address' => $deliveryAddress,
            'quantity' => $quantity,
            'request_token' => $requestToken,
        ];

        $existingOrder = Order::query()
            ->where('request_token', $details['request_token'])
            ->first();

        if ($existingOrder) {
            return $existingOrder;
        }

        try {
            return DB::transaction(function () use ($shop, $details): Order {
                $existingOrder = Order::query()
                    ->where('request_token', $details['request_token'])
                    ->first();

                if ($existingOrder) {
                    return $existingOrder;
                }

                $lockedShop = Shop::query()
                    ->with('seller:id,active')
                    ->lockForUpdate()
                    ->findOrFail($shop->id);

                if (! $lockedShop->active || ! $lockedShop->seller?->active) {
                    throw ValidationException::withMessages([
                        'quantity' => 'Cette boutique ne peut pas accepter de commande actuellement.',
                    ]);
                }

                if ($lockedShop->stock_quantity < $details['quantity']) {
                    throw ValidationException::withMessages([
                        'quantity' => 'La quantité demandée n’est plus disponible.',
                    ]);
                }

                $now = now()->toMutable();
                $unitPrice = ChickenPriceCalculator::calculateUnitPrice($lockedShop->average_weight);
                $subtotal = $details['quantity'] * $unitPrice;
                $platformCommission = $details['quantity'] * ChickenPriceCalculator::COMMISSION_PER_UNIT;

                $order = Order::query()->create([
                    'reference' => 'TEMP-'.Str::uuid(),
                    'request_token' => $details['request_token'],
                    'shop_id' => $lockedShop->id,
                    'source' => OrderSource::WebWhatsapp,
                    'customer_name' => $details['customer_name'],
                    'customer_phone' => $details['customer_phone'],
                    'delivery_address' => $details['delivery_address'],
                    'quantity' => $details['quantity'],
                    'average_weight_snapshot' => $lockedShop->average_weight,
                    'unit_price' => $unitPrice,
                    'commission_per_unit' => ChickenPriceCalculator::COMMISSION_PER_UNIT,
                    'subtotal' => $subtotal,
                    'platform_commission' => $platformCommission,
                    'seller_amount' => $subtotal - $platformCommission,
                    'status' => OrderStatus::Pending,
                    'stock_reserved_at' => $now,
                    'reservation_expires_at' => $now->copy()->addMinutes(30),
                ]);

                $order->reference = $this->referenceFor($order->id, $now);
                $order->save();

                $lockedShop->decrement('stock_quantity', $details['quantity']);

                OrderStatusHistory::query()->create([
                    'order_id' => $order->id,
                    'from_status' => null,
                    'to_status' => OrderStatus::Pending,
                    'changed_by' => null,
                    'reason' => 'Réservation créée depuis la boutique publique.',
                    'created_at' => $now,
                ]);

                return $order;
            }, 3);
        } catch (UniqueConstraintViolationException $exception) {
            $existingOrder = Order::query()
                ->where('request_token', $requestToken)
                ->first();

            if ($existingOrder) {
                return $existingOrder;
            }

            throw $exception;
        }
    }

    private function referenceFor(int $orderId, CarbonInterface $createdAt): string
    {
        return sprintf('LG-%s-%06d', $createdAt->format('Y'), $orderId);
    }
}
