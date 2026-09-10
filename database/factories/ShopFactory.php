<?php

namespace Database\Factories;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Shop>
 */
class ShopFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company().' Poulet';

        return [
            'seller_id' => User::factory()->seller(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->randomNumber(4),
            'zone' => fake()->randomElement(['Almadies', 'Plateau', 'Yoff', 'Mermoz', 'Grand Yoff', 'Ouakam', 'Parcelles Assainies']),
            'description' => fake()->sentence(),
            'image_path' => null,
            'stock_quantity' => fake()->numberBetween(10, 100),
            'average_weight' => fake()->numberBetween(1800, 2400), // grams (1.80 kg - 2.40 kg)
            'active' => true,
        ];
    }

    /**
     * Indicate that the shop is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => false,
        ]);
    }

    /**
     * Indicate that the shop is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
        ]);
    }
}
