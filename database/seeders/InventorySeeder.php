<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Inventory;

class InventorySeeder extends Seeder
{
    public function run()
    {
        $inventoryItems = [
            ['name' => 'Kamatis'],
            ['name' => 'Sibuyas'],
            ['name' => 'Seasoning'],
            ['name' => 'Dahon'],
            ['name' => 'Sili'],
            ['name' => 'Cups'],
            ['name' => 'Uling'],
            ['name' => 'Cling Wrap'],
            ['name' => 'Paper Bag 25'],
            ['name' => 'Paper Bag 06'],
            ['name' => 'Sando Bag'],
            ['name' => 'Plastic Labo'],
            ['name' => 'Garbage Bag'],
            ['name' => 'Label Bangus (Relleno)'],
            ['name' => 'Label Bangus (Mega)'],
            ['name' => 'Label Bangus (Extra Jumbo)'],
            ['name' => 'Label Bangus (Jumbo)'],
            ['name' => 'Label Bangus (Biggie)'],
            ['name' => 'Label Bangus (Middie)'],
            ['name' => 'Label Belly (300g)'],
            ['name' => 'Label Belly (400g)'],
            ['name' => 'Label Belly (500g)'],
            ['name' => 'Label Panga (400g)'],
            ['name' => 'Label Panga (500g)'],
            ['name' => 'Label Tilapia (Jumbo)'],
            ['name' => 'Label Tilapia (Big)'],
            ['name' => 'Label Tilapia (Medium)'],
            ['name' => 'Label Pampano (Small)'],
            ['name' => 'Label Pampano (Big)'],
            ['name' => 'Label Bangus (Lemon)'],
            ['name' => 'Label Bangus (Ginger)'],
            ['name' => 'Micro. (Bangus Sisig)'],
            ['name' => 'Micro. (Tuna Sisig)'],
            ['name' => 'Micro. (Bicol Express)'],
            ['name' => 'Micro. (Santol)'],
            ['name' => 'Micro. (Laing)'],
            ['name' => 'Micro. (Potato Marbles)'],
            ['name' => 'Butter'],
            ['name' => 'White Onion'],
            ['name' => 'Sili Green'],
            ['name' => 'Mayo'],
            ['name' => 'Achara Labanos'],
            ['name' => 'Basting Sauce'],
        ];

        foreach ($inventoryItems as $item) {
            // Store just the filename (with the origwwinal case)
            $imageName = $item['name'] . '.png';
            
            Inventory::create([
                'inventory_name' => $item['name'],
                'inventory_image' => $imageName, // Just the filename, not the path
                'inventory_price' => 0, 
            ]);
        }
    }
}
