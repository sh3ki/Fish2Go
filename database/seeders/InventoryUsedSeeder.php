<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Inventory;
use App\Models\InventoryUsed;
use Carbon\Carbon;

class InventoryUsedSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Clear existing records
        try {
            DB::table('inventory_used')->truncate();
        } catch (\Exception $e) {
            $this->command->error('Error truncating inventory_used table: ' . $e->getMessage());
            return;
        }
        
        $today = Carbon::today();
        $timestamp = Carbon::now();
        
        // The inventory items with quantities
        $inventoryItems = [
            ['name' => 'Kamatis', 'inventory_beg' => 14],
            ['name' => 'Sibuyas', 'inventory_beg' => 9.5],
            ['name' => 'Seasoning', 'inventory_beg' => 35],
            ['name' => 'Dahon', 'inventory_beg' => 25],
            ['name' => 'Sili', 'inventory_beg' => 0],
            ['name' => 'Cups', 'inventory_beg' => 119],
            ['name' => 'Uling', 'inventory_beg' => 9],
            ['name' => 'Cling Wrap', 'inventory_beg' => 1],
            ['name' => 'Paper Bag 25', 'inventory_beg' => 424],
            ['name' => 'Paper Bag 06', 'inventory_beg' => 191],
            ['name' => 'Sando Bag', 'inventory_beg' => 108],
            ['name' => 'Plastic Labo', 'inventory_beg' => 186],
            ['name' => 'Garbage Bag', 'inventory_beg' => 29],
            ['name' => 'Label Bangus (Relleno)', 'inventory_beg' => 12],
            ['name' => 'Label Bangus (Mega)', 'inventory_beg' => 0],
            ['name' => 'Label Bangus (Extra Jumbo)', 'inventory_beg' => 34],
            ['name' => 'Label Bangus (Jumbo)', 'inventory_beg' => 75],
            ['name' => 'Label Bangus (Biggie)', 'inventory_beg' => 0],
            ['name' => 'Label Bangus (Middie)', 'inventory_beg' => 9],
            ['name' => 'Label Belly (300g)', 'inventory_beg' => 3],
            ['name' => 'Label Belly (400g)', 'inventory_beg' => 7],
            ['name' => 'Label Belly (500g)', 'inventory_beg' => 0],
            ['name' => 'Label Panga (400g)', 'inventory_beg' => 0],
            ['name' => 'Label Panga (500g)', 'inventory_beg' => 5],
            ['name' => 'Label Tilapia (Jumbo)', 'inventory_beg' => 0],
            ['name' => 'Label Tilapia (Big)', 'inventory_beg' => 0],
            ['name' => 'Label Tilapia (Medium)', 'inventory_beg' => 0],
            ['name' => 'Label Pampano (Small)', 'inventory_beg' => 0],
            ['name' => 'Label Pampano (Big)', 'inventory_beg' => 10],
            ['name' => 'Label Bangus (Lemon)', 'inventory_beg' => 3],
            ['name' => 'Label Bangus (Ginger)', 'inventory_beg' => 6],
            ['name' => 'Micro. (Bangus Sisig)', 'inventory_beg' => 3],
            ['name' => 'Micro. (Tuna Sisig)', 'inventory_beg' => 2],
            ['name' => 'Micro. (Bicol Express)', 'inventory_beg' => 6],
            ['name' => 'Micro. (Santol)', 'inventory_beg' => 8],
            ['name' => 'Micro. (Laing)', 'inventory_beg' => 6],
            ['name' => 'Micro. (Potato Marbles)', 'inventory_beg' => 0],
            ['name' => 'Butter', 'inventory_beg' => 14],
            ['name' => 'White Onion', 'inventory_beg' => 1.5],
            ['name' => 'Sili Green', 'inventory_beg' => 0],
            ['name' => 'Mayo', 'inventory_beg' => 9],
            ['name' => 'Achara Labanos', 'inventory_beg' => 1],
            ['name' => 'Basting Sauce', 'inventory_beg' => 10],
        ];
        
        // Get all inventory items from database
        $dbInventoryItems = Inventory::all()->keyBy('inventory_name');
        
        // For each inventory item with inventory_beg > 0, create a usage record
        foreach ($inventoryItems as $item) {
            // Skip items with zero quantity
            if ($item['inventory_beg'] <= 0) {
                continue;
            }
            
            // Find the inventory ID for this item
            $inventoryName = $item['name'];
            if (!isset($dbInventoryItems[$inventoryName])) {
                $this->command->info("Inventory item not found: {$inventoryName}");
                continue;
            }
            
            $inventoryId = $dbInventoryItems[$inventoryName]->inventory_id;
            $beginningQty = $item['inventory_beg'];
            $endQty = $beginningQty;
            
            // Create inventory_used record
            InventoryUsed::create([
                'inventory_id' => $inventoryId,
                'date' => $today->format('Y-m-d'),
                'inventory_beg' => $beginningQty,
                'inventory_used' => 0,
                'inventory_end' => $endQty,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }
        
    }
}
