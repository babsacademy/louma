<?php

namespace App\Console\Commands;

use App\Actions\ExpireOrderReservation;
use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('orders:expire-reservations')]
#[Description('Expire les réservations de commande pending arrivées à échéance.')]
class ExpireOrderReservations extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(ExpireOrderReservation $action): int
    {
        $expiredCount = 0;
        $expirationThreshold = now();

        Order::query()
            ->select('id')
            ->where('status', OrderStatus::Pending)
            ->whereNotNull('reservation_expires_at')
            ->where('reservation_expires_at', '<=', $expirationThreshold)
            ->whereNull('stock_released_at')
            ->lazyById(100)
            ->each(function (Order $order) use ($action, &$expiredCount): void {
                if ($action->execute($order) !== null) {
                    $expiredCount++;
                }
            });

        $this->components->info("{$expiredCount} réservation(s) expirée(s).");

        return self::SUCCESS;
    }
}
