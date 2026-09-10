<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
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
            'amount' => 5800, // example 2 * 2900
            'method' => PaymentMethod::Wave,
            'status' => PaymentStatus::Paid,
            'transaction_reference' => 'WAVE-'.fake()->unique()->regexify('[A-Z0-9]{10}'),
            'recorded_by' => User::factory()->admin(),
            'paid_at' => now(),
        ];
    }
}
