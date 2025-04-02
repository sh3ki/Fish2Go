<?php

namespace Database\Seeders;

use App\Models\User;
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

        $this->call(CategorySeeder::class);

        // $this->call(ProductSeeder::class);

        // $this->call(OrderSeeder::class);

        // $this->call(OrderItemSeeder::class);

        // $this->call(ReviewSeeder::class);

        // $this->call(DeliverySeeder::class);

        // $this->call(DeliveryItemSeeder::class);
        
    }
}
