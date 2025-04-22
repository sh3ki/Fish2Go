<?php
namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Inventory;
use App\Models\InventoryUsed;
use Carbon\Carbon; // Add Carbon for date handling
use Illuminate\Support\Facades\DB;

class StaffInventoryController extends Controller
{
    public function index()
    {
        // Render the Inertia page
        return Inertia::render('staff_inventory');
    }

    /**
     * Get the inventory with used quantities for the current day.
     * Automatically creates new inventory records for the day if none exist.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getInventory(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        
        // Check if any inventory records exist for today
        $todayRecordsCount = InventoryUsed::where('date', $today)->count();
        
        // If no records exist for today, create them based on previous days
        if ($todayRecordsCount === 0) {
            $this->initializeInventoryForToday();
        }
        
        // Get inventory items with their usage data for today using a JOIN for optimization
        $inventoryData = $this->getInventoryForToday($today);
        
        if ($request->wantsJson()) {
            // Return JSON response for API requests
            return response()->json($inventoryData);
        }

        // Return an Inertia response for Inertia requests
        return Inertia::render('staff_inventory', ['inventory' => $inventoryData]);
    }
    
    /**
     * Get inventory items with their usage data for today using an optimized JOIN query.
     * 
     * @param string $date The date to fetch inventory for (format: Y-m-d)
     * @return array The inventory data with usage information
     */
    private function getInventoryForToday(string $date): array
    {
        // Use a JOIN query to efficiently get inventory items with their usage data
        $inventoryWithUsage = DB::table('inventory')
            ->leftJoin('inventory_used', function ($join) use ($date) {
                $join->on('inventory.inventory_id', '=', 'inventory_used.inventory_id')
                     ->where('inventory_used.date', '=', $date);
            })
            ->select(
                'inventory.inventory_id',
                'inventory.inventory_name',
                'inventory.inventory_price',
                'inventory.inventory_image',
                'inventory.created_at',
                'inventory_used.inventory_beg',
                'inventory_used.inventory_used',
                'inventory_used.inventory_end'
            )
            ->get();
        
        // Format the data for the response
        return $inventoryWithUsage->map(function ($item) {
            return [
                'inventory_id' => $item->inventory_id,
                'inventory_name' => $item->inventory_name,
                'inventory_price' => $item->inventory_price,
                'inventory_image' => $item->inventory_image,
                'inventory_beg' => $item->inventory_beg ?? 0,
                'inventory_used' => $item->inventory_used ?? 0,
                'inventory_end' => $item->inventory_end ?? 0,
                'created_at' => $item->created_at ? date('Y-m-d H:i:s', strtotime($item->created_at)) : null,
            ];
        })->toArray();
    }

    /**
     * Initialize inventory records for today based on previous day's ending values.
     */
    private function initializeInventoryForToday()
    {
        $today = Carbon::today()->format('Y-m-d');
        \Log::info("Initializing inventory records for {$today}");
        
        // Get all inventory items (without filtering by quantity)
        $inventoryItems = Inventory::all();
        $recordsCreated = 0;
        
        foreach ($inventoryItems as $item) {
            // Find the most recent inventory record for this item
            $latestRecord = InventoryUsed::where('inventory_id', $item->inventory_id)
                ->orderBy('date', 'desc')
                ->first();
            
            // Only create records for items that have previous records with end value > 0
            // or for items that have no records yet (fresh inventory)
            if (($latestRecord && $latestRecord->inventory_end > 0) || !$latestRecord) {
                // Determine beginning quantity (use the previous day's ending or 0 for new items)
                $beginningQty = $latestRecord ? $latestRecord->inventory_end : 0;
                
                // Create new record for today
                InventoryUsed::create([
                    'inventory_id' => $item->inventory_id,
                    'date' => $today,
                    'inventory_beg' => $beginningQty,
                    'inventory_used' => 0, // Start with 0 used
                    'inventory_end' => $beginningQty // Initially end = beginning
                ]);
                
                $recordsCreated++;
                \Log::info("Created inventory record for item #{$item->inventory_id} ({$item->inventory_name}) with beginning qty: {$beginningQty}");
            }
        }
        
        \Log::info("Initialized {$recordsCreated} inventory records for {$today}");
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
                    $inventoryUsed->inventory_end = $inventoryUsed->inventory_beg - $item['used_qty'];
                    $inventoryUsed->save();
                } else {
                    // Get the current inventory item
                    $inventory = Inventory::find($item['inventory_id']);
                    if (!$inventory) continue;
                    
                    // Find the most recent inventory record for this item
                    $latestRecord = InventoryUsed::where('inventory_id', $item['inventory_id'])
                        ->orderBy('date', 'desc')
                        ->first();
                    
                    // Determine beginning quantity
                    $beginningQty = $latestRecord ? $latestRecord->inventory_end : $inventory->inventory_qty;
                    
                    // Create new record
                    $inventoryUsed = InventoryUsed::create([
                        'date' => $today,
                        'inventory_id' => $item['inventory_id'],
                        'inventory_beg' => $beginningQty,
                        'inventory_used' => $item['used_qty'],
                        'inventory_end' => $beginningQty - $item['used_qty']
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