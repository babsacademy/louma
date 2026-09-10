<?php

namespace Database\Factories;

use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 5);
        $averageWeight = fake()->numberBetween(1800, 2400);
        $unitPrice = $averageWeight >= 2000 ? 3250 : 2900;
        $commissionPerUnit = 400;
        $subtotal = $quantity * $unitPrice;
        $platformCommission = $quantity * $commissionPerUnit;
        $sellerAmount = $subtotal - $platformCommission;

        return [
            'reference' => 'LG-'.now()->year.'-'.str_pad((string) fake()->unique()->numberBetween(1, 999999), 6, '0', STR_PAD_LEFT),
            'request_token' => fake()->unique()->uuid(),
            'shop_id' => Shop::factory(),
            'source' => OrderSource::WebWhatsapp,
            'customer_name' => fake()->name(),
            'customer_phone' => '+22177'.fake()->numerify('#######'),
            'delivery_address' => fake()->address(),
            'quantity' => $quantity,
            'average_weight_snapshot' => $averageWeight,
            'unit_price' => $unitPrice,
            'commission_per_unit' => $commissionPerUnit,
            'subtotal' => $subtotal,
            'platform_commission' => $platformCommission,
            'seller_amount' => $sellerAmount,
            'status' => OrderStatus::Pending,
            'stock_reserved_at' => now(),
            'stock_released_at' => null,
            'confirmed_at' => null,
            'preparing_at' => null,
            'picked_up_at' => null,
            'delivering_at' => null,
            'delivered_at' => null,
            'cancelled_at' => null,
            'cancellation_reason' => null,
            'reservation_expires_at' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Confirmed,
            'confirmed_at' => now(),
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Delivered,
            'confirmed_at' => now()->subHours(3),
            'preparing_at' => now()->subHours(2),
            'picked_up_at' => now()->subHour(),
            'delivering_at' => now()->subMinutes(30),
            'delivered_at' => now(),
        ]);
    }

    public function cancelled(?string $reason = 'Annulation client'): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Cancelled,
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
            'stock_released_at' => now(),
        ]);
    }
}
