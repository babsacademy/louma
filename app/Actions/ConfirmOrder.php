<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;

class ConfirmOrder
{
    public function __construct(private TransitionOrderStatus $transitionOrderStatus) {}

    public function execute(Order $order, User $administrator): Order
    {
        return $this->transitionOrderStatus->execute($order, $administrator, OrderStatus::Confirmed);
    }
}
