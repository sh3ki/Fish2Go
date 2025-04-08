<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Inventory;

class InventorySeeder extends Seeder
{
    public function run()
    {
        $inventoryItems = [
            ['name' => 'Kamatis', 'qty' => 14],
            ['name' => 'Sibuyas', 'qty' => 9.5],
            ['name' => 'Seasoning', 'qty' => 35],
            ['name' => 'Dahon', 'qty' => 25],
            ['name' => 'Sili', 'qty' => 0],
            ['name' => 'Cups', 'qty' => 119],
            ['name' => 'Uling', 'qty' => 9],
            ['name' => 'Cling Wrap', 'qty' => 1],
            ['name' => 'Paper Bag 25', 'qty' => 424],
            ['name' => 'Paper Bag 06', 'qty' => 191],
            ['name' => 'Sando Bag', 'qty' => 108],
            ['name' => 'Plastic Labo', 'qty' => 186],
            ['name' => 'Garbage Bag', 'qty' => 29],
            ['name' => 'Label Bangus (Relleno)', 'qty' => 12],
            ['name' => 'Label Bangus (Mega)', 'qty' => 0],
            ['name' => 'Label Bangus (Extra Jumbo)', 'qty' => 34],
            ['name' => 'Label Bangus (Jumbo)', 'qty' => 75],
            ['name' => 'Label Bangus (Biggie)', 'qty' => 0],
            ['name' => 'Label Bangus (Middie)', 'qty' => 9],
            ['name' => 'Label Belly (300g)', 'qty' => 3],
            ['name' => 'Label Belly (400g)', 'qty' => 7],
            ['name' => 'Label Belly (500g)', 'qty' => 0],
            ['name' => 'Label Panga (400g)', 'qty' => 0],
            ['name' => 'Label Panga (500g)', 'qty' => 5],
            ['name' => 'Label Tilapia (Jumbo)', 'qty' => 0],
            ['name' => 'Label Tilapia (Big)', 'qty' => 0],
            ['name' => 'Label Tilapia (Medium)', 'qty' => 0],
            ['name' => 'Label Pampano (Small)', 'qty' => 0],
            ['name' => 'Label Pampano (Big)', 'qty' => 10],
            ['name' => 'Label Bangus (Lemon)', 'qty' => 3],
            ['name' => 'Label Bangus (Ginger)', 'qty' => 6],
            ['name' => 'Micro. (Bangus Sisig)', 'qty' => 3],
            ['name' => 'Micro. (Tuna Sisig)', 'qty' => 2],
            ['name' => 'Micro. (Bicol Express)', 'qty' => 6],
            ['name' => 'Micro. (Santol)', 'qty' => 8],
            ['name' => 'Micro. (Laing)', 'qty' => 6],
            ['name' => 'Micro. (Potato Marbles)', 'qty' => 0],
            ['name' => 'Butter', 'qty' => 14],
            ['name' => 'White Onion', 'qty' => 1.5],
            ['name' => 'Sili Green', 'qty' => 0],
            ['name' => 'Mayo', 'qty' => 9],
            ['name' => 'Achara Labanos', 'qty' => 1],
            ['name' => 'Basting Sauce', 'qty' => 10],
        ];

        foreach ($inventoryItems as $item) {
            // Store just the filename (with the original case)
            $imageName = $item['name'] . '.png';
            
            Inventory::create([
                'inventory_name' => $item['name'],
                'inventory_qty' => $item['qty'],
                'inventory_image' => $imageName, // Just the filename, not the path
                'inventory_price' => 0, 
            ]);
        }
    }
}
