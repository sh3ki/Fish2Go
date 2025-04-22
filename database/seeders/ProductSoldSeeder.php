<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\ProductSold;
use Carbon\Carbon;

class ProductSoldSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get current date for all records
        $today = Carbon::now()->format('Y-m-d');
        
        // GRILLED products (category_id = 1)
        $grilledProducts = [
            ['name' => 'Boneless Bangus (Mega)', 'qty' => 0],
            ['name' => 'Boneless Bangus (Extra Jumbo)', 'qty' => 34],
            ['name' => 'Boneless Bangus (Jumbo)', 'qty' => 70],
            ['name' => 'Boneless Bangus (Biggie)', 'qty' => 0],
            ['name' => 'Boneless Bangus (Middie)', 'qty' => 9],
            ['name' => 'Tuna Belly (300g)', 'qty' => 3],
            ['name' => 'Tuna Belly (400g)', 'qty' => 7],
            ['name' => 'Tuna Belly (500g)', 'qty' => 0],
            ['name' => 'Tuna Panga (400g)', 'qty' => 0],
            ['name' => 'Tuna Panga (500g)', 'qty' => 5],
            ['name' => 'Tilapia (Jumbo)', 'qty' => 0],
            ['name' => 'Tilapia (Big)', 'qty' => 0],
            ['name' => 'Tilapia (Medium)', 'qty' => 0],
            ['name' => 'Pampano (Small)', 'qty' => 0],
            ['name' => 'Pampano (Small)', 'qty' => 10],
            ['name' => 'Flavored Bangus (Lemon Grass)', 'qty' => 3],
            ['name' => 'Flavored Bangus (Ginger Garlic)', 'qty' => 6],
        ];

        $this->createProductSoldRecords($grilledProducts, $today);

        // READY2EAT products (category_id = 2)
        $ready2eatProducts = [
            ['name' => 'Bangus Relleno (500g)', 'qty' => 12],
            ['name' => 'Bangus Sisig', 'qty' => 3],
            ['name' => 'Tuna Bicol Express', 'qty' => 4],
            ['name' => 'Tuna Sisig', 'qty' => 0],
            ['name' => 'Laing', 'qty' => 3],
            ['name' => 'Ginataang Santol', 'qty' => 8],
        ];

        $this->createProductSoldRecords($ready2eatProducts, $today);

        // READY2COOK products (category_id = 3)
        $ready2cookProducts = [
            ['name' => 'Bangus Lumpiang Shanghai', 'qty' => 2],
            ['name' => 'Fish Longganisa', 'qty' => 3],
            ['name' => 'Fish Embutido', 'qty' => 3],
            ['name' => 'Bangus Tinapa (300g)', 'qty' => 2],
            ['name' => 'Bangus Daing (300g - 1pc)', 'qty' => 0],
            ['name' => 'Bangus Daing (300g - 2pc)', 'qty' => 3],
        ];

        $this->createProductSoldRecords($ready2cookProducts, $today);

        // BOTTLED products (category_id = 4)
        $bottledProducts = [
            ['name' => 'Achara Papaya', 'qty' => 18],
            ['name' => 'Chili Sauce', 'qty' => 6],
            ['name' => 'Burong Isda', 'qty' => 0],
            ['name' => 'Burong Hipon', 'qty' => 0],
            ['name' => 'Bagoong Isda', 'qty' => 5],
            ['name' => 'Bagoong Alamang (Regular)', 'qty' => 0],
            ['name' => 'Bagoong Alamang (Spicy)', 'qty' => 0],
            ['name' => 'Bangus Sauce', 'qty' => 136],
            ['name' => 'Bangus Sauce (Extra)', 'qty' => 136],
            ['name' => 'Tuna Sauce', 'qty' => 18],
            ['name' => 'Tuna Sauce (Extra)', 'qty' => 18],
            ['name' => 'Lemon Grass Mixture', 'qty' => 3],
            ['name' => 'Ginger Garlic Mixture', 'qty' => 6],
            ['name' => 'Ketchup Dip', 'qty' => 20],
        ];

        $this->createProductSoldRecords($bottledProducts, $today);
    }

    /**
     * Helper method to create product_sold records
     */
    private function createProductSoldRecords($productData, $date)
    {
        foreach ($productData as $item) {
            $product = Product::where('product_name', $item['name'])->first();
            
            if ($product) {
                ProductSold::create([
                    'date' => $date,
                    'product_id' => $product->product_id,
                    'product_qty' => $item['qty'],
                    'product_sold' => 0
                ]);
            }
        }
    }
}
