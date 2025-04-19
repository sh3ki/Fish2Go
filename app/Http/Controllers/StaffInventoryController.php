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

    /**
     * Webhook endpoint for automated inventory updates
     * Called by external cron service at 11:59 PM daily
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updateInventoryWebhook(Request $request)
    {
        // Log all incoming webhook requests for debugging
        \Log::info('Inventory webhook called', [
            'ip' => $request->ip(),
            'headers' => $request->headers->all(),
            'payload' => $request->all()
        ]);
        
        // Validate the webhook token for security - allow both header and query parameter
        $token = $request->header('X-Webhook-Token') ?? $request->query('token');
        $validToken = env('INVENTORY_WEBHOOK_TOKEN');
        
        if (!$token || !$validToken || $token !== $validToken) {
            \Log::warning('Unauthorized webhook access attempt', ['ip' => $request->ip()]);
            return response()->json(['error' => 'Unauthorized access'], 401);
        }
        
        try {
            $today = Carbon::today()->format('Y-m-d');
            \Log::info('Starting inventory update for ' . $today);
            
            // Get all inventory items with their used quantities for today
            $inventoryUsedItems = InventoryUsed::where('date', $today)->get();
            $updatedCount = 0;
            
            foreach ($inventoryUsedItems as $item) {
                // Get the inventory item
                $inventory = Inventory::find($item->inventory_id);
                
                if ($inventory) {
                    \Log::info("Processing inventory item: {$inventory->inventory_name}, Current qty: {$inventory->inventory_qty}, Used: {$item->inventory_used}");
                    
                    // Subtract used quantity from inventory
                    $inventory->inventory_qty -= $item->inventory_used;
                    
                    // Ensure inventory doesn't go below zero
                    if ($inventory->inventory_qty < 0) {
                        $inventory->inventory_qty = 0;
                    }
                    
                    // Save the updated inventory
                    $inventory->save();
                    
                    // Reset the used quantity for tomorrow
                    $item->inventory_used = 0;
                    $item->save();
                    
                    $updatedCount++;
                }
            }
            
            \Log::info("Inventory update completed: {$updatedCount} items updated");
            
            return response()->json([
                'success' => true,
                'message' => 'Inventory daily update completed successfully',
                'items_updated' => $updatedCount,
                'date' => $today
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in webhook inventory update: ' . $e->getMessage());
            return response()->json([
                'error' => 'Inventory update failed: ' . $e->getMessage()
            ], 500);
        }
    }
}