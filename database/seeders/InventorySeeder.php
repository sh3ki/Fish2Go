<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Inventory;

class InventorySeeder extends Seeder
{
    public function run()
    {
        // Create 10 sample inventory items
        Inventory::factory()->count(10)->create();
    }
}
