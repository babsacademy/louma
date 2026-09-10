<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RecordOrderPayment
{
    public function execute(Order $order, User $administrator, string $transactionReference): Payment
    {
        if (! $administrator->isAdmin()) {
            throw new AuthorizationException('Seul un administrateur peut enregistrer un paiement.');
        }

        $reference = Str::of($transactionReference)->trim()->toString();

        return DB::transaction(function () use ($order, $administrator, $reference): Payment {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);

            if ($lockedOrder->status !== OrderStatus::Delivered) {
                throw ValidationException::withMessages([
                    'order' => 'Le paiement client ne peut être enregistré qu’après livraison.',
                ]);
            }

            if (Payment::query()->where('order_id', $lockedOrder->id)->exists()) {
                throw ValidationException::withMessages([
                    'payment' => 'Le paiement de cette commande a déjà été enregistré.',
                ]);
            }

            if (Payment::query()->where('transaction_reference', $reference)->exists()) {
                throw ValidationException::withMessages([
                    'transaction_reference' => 'Cette référence Wave est déjà utilisée.',
                ]);
            }

            return Payment::query()->create([
                'order_id' => $lockedOrder->id,
                'amount' => $lockedOrder->subtotal,
                'method' => PaymentMethod::Wave,
                'status' => PaymentStatus::Paid,
                'transaction_reference' => $reference,
                'recorded_by' => $administrator->id,
                'paid_at' => now(),
            ]);
        }, 3);
    }
}
