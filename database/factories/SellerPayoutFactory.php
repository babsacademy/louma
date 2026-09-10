<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\SellerPayoutStatus;
use App\Models\Order;
use App\Models\SellerPayout;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SellerPayout>
 */
class SellerPayoutFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'seller_id' => User::factory()->seller(),
            'amount' => 5000, // example 2 * 2500
            'method' => PaymentMethod::Wave,
            'status' => SellerPayoutStatus::Paid,
            'transaction_reference' => 'PAYOUT-'.fake()->unique()->regexify('[A-Z0-9]{10}'),
            'recorded_by' => User::factory()->admin(),
            'paid_at' => now(),
        ];
    }
}
