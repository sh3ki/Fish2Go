<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryFactory extends Factory
{
    protected $model = \App\Models\Inventory::class;

    public function definition()
    {
        return [
            'inventory_name' => $this->faker->word,
            'inventory_qty' => $this->faker->numberBetween(1, 100),
            'inventory_price' => $this->faker->randomFloat(2, 1, 1000),
            'inventory_image' => null, // Optional: Add logic for image paths if needed
        ];
    }
}
