<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder

{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Category::factory()->create([
            'category_name' => 'Grilled',
        ]);
        Category::factory()->create([
            'category_name' => 'Ready2Eat',
        ]);
        Category::factory()->create([
            'category_name' => 'Ready2Cook',
        ]);
        Category::factory()->create([
            'category_name' => 'Bottled',
        ]);
    }
}
