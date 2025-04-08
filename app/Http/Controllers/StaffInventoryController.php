<?php
namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Inventory;
use App\Models\InventoryUsed;
use Carbon\Carbon; // Add Carbon for date handling

class StaffInventoryController extends Controller
{
    public function index()
    {
        // Render the Inertia page
        return Inertia::render('staff_inventory');
    }

    /**
     * Get the inventory with used quantities for the current day.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getInventory(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        
        if ($request->wantsJson()) {
            // Return JSON response for API requests
            $inventoryItems = Inventory::all();
            $inventoryData = $inventoryItems->map(function ($item) use ($today) {
                // Get the used quantity for today
                $inventoryUsed = InventoryUsed::where('inventory_id', $item->inventory_id)
                    ->where('date', $today)
                    ->first();
                
                // Use the inventory_used value if it exists, otherwise default to 0
                $used_qty = $inventoryUsed ? $inventoryUsed->inventory_used : 0;
                
                return [
                    'inventory_id' => $item->inventory_id,
                    'inventory_name' => $item->inventory_name,
                    'inventory_qty' => $item->inventory_qty,
                    'inventory_price' => $item->inventory_price,
                    'inventory_image' => $item->inventory_image,
                    'inventory_used' => $used_qty,
                    'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
                ];
            });
            
            return response()->json($inventoryData);
        }

        // Return an Inertia response for Inertia requests
        $inventoryItems = Inventory::all();
        $inventoryData = $inventoryItems->map(function ($item) use ($today) {
            // Get the used quantity for today
            $inventoryUsed = InventoryUsed::where('inventory_id', $item->inventory_id)
                ->where('date', $today)
                ->first();
            
            // Use the inventory_used value if it exists, otherwise default to 0
            $used_qty = $inventoryUsed ? $inventoryUsed->inventory_used : 0;
            
            return [
                'inventory_id' => $item->inventory_id,
                'inventory_name' => $item->inventory_name,
                'inventory_qty' => $item->inventory_qty,
                'inventory_price' => $item->inventory_price,
                'inventory_image' => $item->inventory_image,
                'inventory_used' => $used_qty,
                'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
            ];
        });
        
        return Inertia::render('staff_inventory', ['inventory' => $inventoryData,]);
    }

    /**
     * Update inventory used quantities.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updateInventoryUsed(Request $request)
    {
        $inventoryItems = $request->input('inventory');
        $today = Carbon::today()->format('Y-m-d');
        $updatedItems = [];
        
        foreach ($inventoryItems as $item) {
            if (isset($item['inventory_id']) && isset($item['used_qty'])) {
                // Check if a record already exists for this inventory item today
                $inventoryUsed = InventoryUsed::where('inventory_id', $item['inventory_id'])
                    ->where('date', $today)
                    ->first();
                
                if ($inventoryUsed) {
                    // Update existing record
                    $inventoryUsed->inventory_used = $item['used_qty'];
                    $inventoryUsed->save();
                } else {
                    // Create new record
                    $inventoryUsed = InventoryUsed::create([
                        'date' => $today,
                        'inventory_id' => $item['inventory_id'],
                        'inventory_used' => $item['used_qty']
                    ]);
                }
                
                $updatedItems[] = $inventoryUsed;
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Inventory used data updated successfully',
            'updated_items' => $updatedItems
        ]);
    }
}