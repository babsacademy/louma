<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\SellerPayoutStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SellerPayout;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RecordSellerPayout
{
    public function execute(Order $order, User $administrator, string $transactionReference): SellerPayout
    {
        if (! $administrator->isAdmin()) {
            throw new AuthorizationException('Seul un administrateur peut enregistrer un reversement.');
        }

        $reference = Str::of($transactionReference)->trim()->toString();

        return DB::transaction(function () use ($order, $administrator, $reference): SellerPayout {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);

            if ($lockedOrder->status !== OrderStatus::Delivered) {
                throw ValidationException::withMessages([
                    'order' => 'Le reversement est disponible uniquement pour une commande livrée.',
                ]);
            }

            if (! Payment::query()->where('order_id', $lockedOrder->id)->exists()) {
                throw ValidationException::withMessages([
                    'payout' => 'Le paiement client doit être enregistré avant le reversement vendeur.',
                ]);
            }

            if (SellerPayout::query()->where('order_id', $lockedOrder->id)->exists()) {
                throw ValidationException::withMessages([
                    'payout' => 'Le reversement de cette commande a déjà été enregistré.',
                ]);
            }

            if (SellerPayout::query()->where('transaction_reference', $reference)->exists()) {
                throw ValidationException::withMessages([
                    'transaction_reference' => 'Cette référence Wave est déjà utilisée.',
                ]);
            }

            $shop = Shop::query()->lockForUpdate()->findOrFail($lockedOrder->shop_id);

            return SellerPayout::query()->create([
                'order_id' => $lockedOrder->id,
                'seller_id' => $shop->seller_id,
                'amount' => $lockedOrder->seller_amount,
                'method' => PaymentMethod::Wave,
                'status' => SellerPayoutStatus::Paid,
                'transaction_reference' => $reference,
                'recorded_by' => $administrator->id,
                'paid_at' => now(),
            ]);
        }, 3);
    }
}
