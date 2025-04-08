<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Inventory;
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
    //     // Get all inventory IDs to ensure valid relationships
    //     $inventoryItems = Inventory::all();
        
    //     if ($inventoryItems->isEmpty()) {
    //         $this->command->info('No inventory items found. Please run the InventorySeeder first.');
    //         return;
    //     }
        
    //     // Clear existing records - ensure the table exists first
    //     try {
    //         DB::table('inventory_used')->truncate();
    //     } catch (\Exception $e) {
    //         $this->command->error('Error truncating inventory_used table: ' . $e->getMessage());
    //         return;
    //     }
        
    //     $today = Carbon::now();
        
    //     // Generate usage records for each inventory item
    //     foreach ($inventoryItems as $item) {
    //         // Generate a random usage amount (between 0 and 80% of current quantity)
    //         $inventoryUsed = rand(0, floor($item->inventory_qty * 0.8));
            
    //         // Insert the record for today
    //         DB::table('inventory_used')->insert([
    //             'inventory_id' => $item->inventory_id,
    //             'inventory_used' => $inventoryUsed,
    //             'date' => $today->format('Y-m-d'),
    //             'created_at' => $today,
    //             'updated_at' => $today,
    //         ]);
            
    //         // Add historical records for the past week
    //         for ($i = 1; $i <= 7; $i++) {
    //             $pastDate = Carbon::now()->subDays($i);
                
    //             // For historical data, vary the usage amount
    //             $pastInventoryUsed = rand(0, floor($item->inventory_qty * 0.9));
                
    //             // A small chance to have zero usage on some days
    //             if (rand(1, 10) < 3) { // ~30% chance of no usage
    //                 $pastInventoryUsed = 0;
    //             }
                
    //             DB::table('inventory_used')->insert([
    //                 'inventory_id' => $item->inventory_id,
    //                 'inventory_used' => $pastInventoryUsed,
    //                 'date' => $pastDate->format('Y-m-d'),
    //                 'created_at' => $pastDate,
    //                 'updated_at' => $pastDate,
                // ]);
            // }
        // }
    }
}
