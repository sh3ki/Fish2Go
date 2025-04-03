<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder


{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Category::factory()->create([
            'category_name' => 'Grilled',
            'category_color' => '#DAA06D',
        ]);
        Category::factory()->create([
            'category_name' => 'Ready2Eat',
            'category_color' => '#0BDA51',
        ]);
        Category::factory()->create([
            'category_name' => 'Ready2Cook',
            'category_color' => '#7DF9FF',
        ]);
        Category::factory()->create([
            'category_name' => 'Bottled',
            'category_color' => '#CF9FFF',
        ]);
    }
}
