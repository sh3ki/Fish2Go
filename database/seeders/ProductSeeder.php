<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('cooks')->truncate();
        // GRILLED products (category_id = 1)
        $grilledProducts = [
            ['name' => 'Boneless Bangus (Mega)', 'price' => 0, 'qty' => 0],
            ['name' => 'Boneless Bangus (Extra Jumbo)', 'price' => 495, 'qty' => 34],
            ['name' => 'Boneless Bangus (Jumbo)', 'price' => 425, 'qty' => 70],
            ['name' => 'Boneless Bangus (Biggie)', 'price' => 385, 'qty' => 0],
            ['name' => 'Boneless Bangus (Middie)', 'price' => 249, 'qty' => 9],
            ['name' => 'Tuna Belly (300g)', 'price' => 369, 'qty' => 3],
            ['name' => 'Tuna Belly (400g)', 'price' => 455, 'qty' => 7],
            ['name' => 'Tuna Belly (500g)', 'price' => 569, 'qty' => 0],
            ['name' => 'Tuna Panga (400g)', 'price' => 329, 'qty' => 0],
            ['name' => 'Tuna Panga (500g)', 'price' => 399, 'qty' => 5],
            ['name' => 'Tilapia (Jumbo)', 'price' => 359, 'qty' => 0],
            ['name' => 'Tilapia (Big)', 'price' => 329, 'qty' => 0],
            ['name' => 'Tilapia (Medium)', 'price' => 255, 'qty' => 0],
            ['name' => 'Pampano (Small)', 'price' => 399, 'qty' => 0],
            ['name' => 'Pampano (Small)', 'price' => 545, 'qty' => 10],
            ['name' => 'Flavored Bangus (Lemon Grass)', 'price' => 420, 'qty' => 3],
            ['name' => 'Flavored Bangus (Ginger Garlic)', 'price' => 420, 'qty' => 6],
        ];

        foreach ($grilledProducts as $product) {
            Product::create([
                'product_name' => $product['name'],
                'product_image' => $product['name'] . '.png',
                'product_price' => $product['price'],
                'product_qty' => $product['qty'],
                'category_id' => 1,
                'product_notification' => 'unread',
            ]);
        }

        // READY2EAT products (category_id = 2)
        $ready2eatProducts = [
            ['name' => 'Bangus Relleno (500g)', 'price' => 599, 'qty' => 12],
            ['name' => 'Bangus Sisig', 'price' => 235, 'qty' => 3],
            ['name' => 'Tuna Bicol Express', 'price' => 279, 'qty' => 4],
            ['name' => 'Tuna Sisig', 'price' => 0, 'qty' => 0],
            ['name' => 'Laing', 'price' => 185, 'qty' => 3],
            ['name' => 'Ginataang Santol', 'price' => 175, 'qty' => 8],
        ];

        foreach ($ready2eatProducts as $product) {
            Product::create([
                'product_name' => $product['name'],
                'product_image' => $product['name'] . '.png',
                'product_price' => $product['price'],
                'product_qty' => $product['qty'],
                'category_id' => 2,
                'product_notification' => 'unread',
            ]);
        }

        // READY2COOK products (category_id = 3)
        $ready2cookProducts = [
            ['name' => 'Bangus Lumpiang Shanghai', 'price' => 195, 'qty' => 2],
            ['name' => 'Fish Longganisa', 'price' => 209, 'qty' => 3],
            ['name' => 'Fish Embutido', 'price' => 265, 'qty' => 3],
            ['name' => 'Bangus Tinapa (300g)', 'price' => 169, 'qty' => 2],
            ['name' => 'Bangus Daing (300g - 1pc)', 'price' => 255, 'qty' => 0],
            ['name' => 'Bangus Daing (300g - 2pc)', 'price' => 255, 'qty' => 3],
        ];

        foreach ($ready2cookProducts as $product) {
            Product::create([
                'product_name' => $product['name'],
                'product_image' => $product['name'] . '.png',
                'product_price' => $product['price'],
                'product_qty' => $product['qty'],
                'category_id' => 3,
                'product_notification' => 'unread',
            ]);
        }

        // BOTTLED products (category_id = 4)
        $bottledProducts = [
            ['name' => 'Achara Papaya', 'price' => 129, 'qty' => 18],
            ['name' => 'Chili Sauce', 'price' => 119, 'qty' => 6],
            ['name' => 'Burong Isda', 'price' => 109, 'qty' => 0],
            ['name' => 'Burong Hipon', 'price' => 0, 'qty' => 0],
            ['name' => 'Bagoong Isda', 'price' => 109, 'qty' => 5],
            ['name' => 'Bagoong Alamang (Regular)', 'price' => 139, 'qty' => 0],
            ['name' => 'Bagoong Alamang (Spicy)', 'price' => 149, 'qty' => 0],
            ['name' => 'Bangus Sauce', 'price' => 0, 'qty' => 136],
            ['name' => 'Bangus Sauce (Extra)', 'price' => 6, 'qty' => 136],
            ['name' => 'Tuna Sauce', 'price' => 0, 'qty' => 18],
            ['name' => 'Tuna Sauce (Extra)', 'price' => 6, 'qty' => 18],
            ['name' => 'Lemon Grass Mixture', 'price' => 0, 'qty' => 3],
            ['name' => 'Ginger Garlic Mixture', 'price' => 0, 'qty' => 6],
            ['name' => 'Ketchup Dip', 'price' => 0, 'qty' => 20],
        ];

        foreach ($bottledProducts as $product) {
            Product::create([
                'product_name' => $product['name'],
                'product_image' => $product['name'] . '.png',
                'product_price' => $product['price'],
                'product_qty' => $product['qty'],
                'category_id' => 4,
                'product_notification' => 'unread',
            ]);
        }
    }
}
