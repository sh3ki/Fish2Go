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
            ['name' => 'Boneless Bangus (Mega)', 'price' => 0],
            ['name' => 'Boneless Bangus (Extra Jumbo)', 'price' => 495],
            ['name' => 'Boneless Bangus (Jumbo)', 'price' => 425],
            ['name' => 'Boneless Bangus (Biggie)', 'price' => 385],
            ['name' => 'Boneless Bangus (Middie)', 'price' => 249],
            ['name' => 'Tuna Belly (300g)', 'price' => 369],
            ['name' => 'Tuna Belly (400g)', 'price' => 455],
            ['name' => 'Tuna Belly (500g)', 'price' => 569],
            ['name' => 'Tuna Panga (400g)', 'price' => 329],
            ['name' => 'Tuna Panga (500g)', 'price' => 399],
            ['name' => 'Tilapia (Jumbo)', 'price' => 359],
            ['name' => 'Tilapia (Big)', 'price' => 329],
            ['name' => 'Tilapia (Medium)', 'price' => 255],
            ['name' => 'Pampano (Small)', 'price' => 399],
            ['name' => 'Pampano (Small)', 'price' => 545],
            ['name' => 'Flavored Bangus (Lemon Grass)', 'price' => 420],
            ['name' => 'Flavored Bangus (Ginger Garlic)', 'price' => 420],
        ];

        foreach ($grilledProducts as $product) {
            Product::create([
                'product_name' => $product['name'],
                'product_image' => $product['name'] . '.png',
                'product_price' => $product['price'],
                'category_id' => 1,
                'product_notification' => 'unread',
            ]);
        }

        // READY2EAT products (category_id = 2)
        $ready2eatProducts = [
            ['name' => 'Bangus Relleno (500g)', 'price' => 599],
            ['name' => 'Bangus Sisig', 'price' => 235],
            ['name' => 'Tuna Bicol Express', 'price' => 279],
            ['name' => 'Tuna Sisig', 'price' => 0],
            ['name' => 'Laing', 'price' => 185],
            ['name' => 'Ginataang Santol', 'price' => 175],
        ];

        foreach ($ready2eatProducts as $product) {
            Product::create([
                'product_name' => $product['name'],
                'product_image' => $product['name'] . '.png',
                'product_price' => $product['price'],
                'category_id' => 2,
                'product_notification' => 'unread',
            ]);
        }

        // READY2COOK products (category_id = 3)
        $ready2cookProducts = [
            ['name' => 'Bangus Lumpiang Shanghai', 'price' => 195],
            ['name' => 'Fish Longganisa', 'price' => 209],
            ['name' => 'Fish Embutido', 'price' => 265],
            ['name' => 'Bangus Tinapa (300g)', 'price' => 169],
            ['name' => 'Bangus Daing (300g - 1pc)', 'price' => 255],
            ['name' => 'Bangus Daing (300g - 2pc)', 'price' => 255],
        ];

        foreach ($ready2cookProducts as $product) {
            Product::create([
                'product_name' => $product['name'],
                'product_image' => $product['name'] . '.png',
                'product_price' => $product['price'],
                'category_id' => 3,
                'product_notification' => 'unread',
            ]);
        }

        // BOTTLED products (category_id = 4)
        $bottledProducts = [
            ['name' => 'Achara Papaya', 'price' => 129],
            ['name' => 'Chili Sauce', 'price' => 119],
            ['name' => 'Burong Isda', 'price' => 109],
            ['name' => 'Burong Hipon', 'price' => 0],
            ['name' => 'Bagoong Isda', 'price' => 109],
            ['name' => 'Bagoong Alamang (Regular)', 'price' => 139],
            ['name' => 'Bagoong Alamang (Spicy)', 'price' => 149],
            ['name' => 'Bangus Sauce', 'price' => 0],
            ['name' => 'Bangus Sauce (Extra)', 'price' => 6],
            ['name' => 'Tuna Sauce', 'price' => 0],
            ['name' => 'Tuna Sauce (Extra)', 'price' => 6],
            ['name' => 'Lemon Grass Mixture', 'price' => 0],
            ['name' => 'Ginger Garlic Mixture', 'price' => 0],
            ['name' => 'Ketchup Dip', 'price' => 0],
        ];

        foreach ($bottledProducts as $product) {
            Product::create([
                'product_name' => $product['name'],
                'product_image' => $product['name'] . '.png',
                'product_price' => $product['price'],
                'category_id' => 4,
                'product_notification' => 'unread',
            ]);
        }
    }
}
