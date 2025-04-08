<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::table('users')->truncate();
        DB::table('categories')->truncate();
        DB::table('products')->truncate();
        DB::table('orders')->truncate();
        DB::table('cooks')->truncate();
        DB::table('inventory')->truncate();
        DB::table('inventory_used')->truncate();

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

        $this->call(ProductSeeder::class);

        $this->call(OrderSeeder::class);

        $this->call(CookSeeder::class);

        $this->call(InventorySeeder::class);

        $this->call(InventoryUsedSeeder::class);


        // $this->call(DeliverySeeder::class);

        // $this->call(DeliveryItemSeeder::class);
        
    }
}
