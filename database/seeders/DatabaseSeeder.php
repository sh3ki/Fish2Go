<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password'  => bcrypt('123'),
            'usertype' => 'admin',
        ]);
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password'  => bcrypt('123'),
            'usertype' => 'staff',
        ]);
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
