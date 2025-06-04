<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductSold;
use App\Models\Inventory;
use App\Models\InventoryUsed;
use App\Models\Deliveries;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StaffDeliveryController extends Controller
{
    public function index()
    {
        return Inertia::render('staff_delivery');
    }

    /**
     * Get data for delivery page - products and inventory items
     * Route: staff.delivery.data
     */
    public function getData()
    {
        $today = Carbon::today()->format('Y-m-d');
        
        // Check if there are delivery records for today
        $hasDeliveryRecords = Deliveries::where('date', $today)->exists();
        
        // Initialize deliveries table if no records exist for today
        if (!$hasDeliveryRecords) {
            $this->initializeDeliveriesForToday($today);
        }
        
        // Get all products with their sold data
        $products = $this->getProductsWithSoldData($today);
        
        // Get inventory items with their usage data
        $inventoryData = $this->getInventoryForToday($today);
        
        // Return both datasets
        return response()->json([
            'products' => $products,
            'inventory' => $inventoryData
        ]);
    }
    
    /**
     * Initialize delivery records for today if they don't exist
     */
    private function initializeDeliveriesForToday($today)
    {
        $userId = Auth::id();
        
        // Get highest product_id to use later for inventory id offset
        $highestProductId = Product::max('product_id') ?? 0;
        
        // Begin transaction to ensure consistency
        DB::beginTransaction();
        
        try {
            // Initialize products with non-zero quantities
            $productsWithSoldData = DB::table('products')
                ->leftJoin('product_sold', function($join) use ($today) {
                    $join->on('products.product_id', '=', 'product_sold.product_id')
                         ->where('product_sold.date', '=', $today);
                })
                ->select(
                    'products.product_id',
                    'product_sold.product_qty'
                )
                ->get();
            
            foreach ($productsWithSoldData as $product) {
                // Get beginning quantity, either from product_sold or default product_qty
                $beginQty = $product->product_qty ?? 0;
                
                // Only create records for non-zero beginning quantities
                if ($beginQty > 0) {
                    Deliveries::create([
                        'date' => $today,
                        'user_id' => $userId,
                        'type' => 'product',
                        'product_id' => $product->product_id,
                        'inventory_id' => null,
                        'delivery_beg' => $beginQty,
                        'delivery_qty' => 0,
                        'delivery_end' => $beginQty
                    ]);
                }
            }
            
            // Initialize inventory items with non-zero quantities
            $inventoryWithUsage = DB::table('inventory')
                ->leftJoin('inventory_used', function($join) use ($today) {
                    $join->on('inventory.inventory_id', '=', 'inventory_used.inventory_id')
                         ->where('inventory_used.date', '=', $today);
                })
                ->select(
                    'inventory.inventory_id',
                    'inventory_used.inventory_beg'
                )
                ->get();
            
            foreach ($inventoryWithUsage as $inventory) {
                // Get beginning quantity from inventory_used
                $beginQty = $inventory->inventory_beg ?? 0;
                
                // Only create records for non-zero beginning quantities
                if ($beginQty > 0) {
                    Deliveries::create([
                        'date' => $today,
                        'user_id' => $userId,
                        'type' => 'inventory',
                        'product_id' => null,
                        'inventory_id' => $inventory->inventory_id,
                        'delivery_beg' => $beginQty,
                        'delivery_qty' => 0,
                        'delivery_end' => $beginQty
                    ]);
                }
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to initialize deliveries: ' . $e->getMessage());
        }
    }
    
    /**
     * Get products with their sold data for the day
     */
    private function getProductsWithSoldData($date)
    {
        // Get all products
        $products = Product::with('category')->get();
        
        // Create product array with proper format
        return $products->map(function($product) use ($date) {
            // First check for delivery record for today
            $deliveryData = Deliveries::where('product_id', $product->product_id)
                                  ->where('date', $date)
                                  ->where('type', 'product')
                                  ->first();
            
            // If delivery record exists, use its values
            if ($deliveryData) {
                $beginning_qty = $deliveryData->delivery_beg;
                $used_qty = $deliveryData->delivery_qty;
                $ending_qty = $deliveryData->delivery_end;
            } else {
                // Fallback to product_sold data
                $soldData = ProductSold::where('product_id', $product->product_id)
                                  ->where('date', $date)
                                  ->first();
                
                $beginning_qty = $soldData ? $soldData->product_qty : $product->product_qty;
                $used_qty = $soldData ? $soldData->product_sold : 0;
                $ending_qty = $beginning_qty + $used_qty; // For delivery, we add quantities
            }
            
            return [
                'id' => 'p_' . $product->product_id, 
                'type' => 'product',
                'product_id' => $product->product_id,
                'inventory_id' => null,
                'name' => $product->product_name,
                'image' => $product->product_image,
                'category_name' => $product->category ? $product->category->category_name : '',
                'beginning_qty' => $beginning_qty,
                'used_qty' => $used_qty,
                'original_used_qty' => $used_qty,
                'ending_qty' => $ending_qty,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        });
    }
    
    /**
     * Get inventory items with their usage data
     */
    private function getInventoryForToday($date)
    {
        // Get all inventory items with usage data
        $inventoryWithUsage = DB::table('inventory')
            ->leftJoin('inventory_used', function ($join) use ($date) {
                $join->on('inventory.inventory_id', '=', 'inventory_used.inventory_id')
                     ->where('inventory_used.date', '=', $date);
            })
            ->leftJoin('deliveries', function ($join) use ($date) {
                $join->on('inventory.inventory_id', '=', 'deliveries.inventory_id')
                     ->where('deliveries.date', '=', $date)
                     ->where('deliveries.type', '=', 'inventory');
            })
            ->select(
                'inventory.inventory_id',
                'inventory.inventory_name',
                'inventory.inventory_price',
                'inventory.inventory_image',
                'inventory.created_at',
                'inventory_used.inventory_beg',
                'inventory_used.inventory_used',
                'inventory_used.inventory_end',
                'deliveries.delivery_beg',
                'deliveries.delivery_qty',
                'deliveries.delivery_end'
            )
            ->get();
        
        // Get highest product_id for offset
        $highestProductId = Product::max('product_id') ?? 0;
        
        // Format the data for the response
        return $inventoryWithUsage->map(function ($item) use ($highestProductId) {
            // Prefer delivery data if available
            $beginning_qty = $item->delivery_beg ?? $item->inventory_beg ?? 0;
            $used_qty = $item->delivery_qty ?? 0;
            $ending_qty = $item->delivery_end ?? $item->inventory_end ?? 0;
            
            return [
                'id' => 'i_' . $item->inventory_id, 
                'type' => 'inventory',
                'product_id' => null,
                'inventory_id' => $item->inventory_id,
                'name' => $item->inventory_name,
                'image' => $item->inventory_image,
                'beginning_qty' => $beginning_qty,
                'used_qty' => $used_qty,
                'original_used_qty' => $used_qty,
                'ending_qty' => $ending_qty,
                'created_at' => $item->created_at ? date('Y-m-d H:i:s', strtotime($item->created_at)) : null,
            ];
        })->toArray();
    }
    
    /**
     * Update both products and inventory items based on delivery
     * Route: staff.delivery.update
     */
    public function updateDelivery(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        $items = $request->input('items', []);
        $updated = [];
        $userId = Auth::id(); // Get current authenticated user ID
        
        DB::beginTransaction();
        try {
            // Process each item based on type
            foreach ($items as $item) {
                if (empty($item['type']) || empty($item['id'])) {
                    continue;
                }
                
                if ($item['type'] === 'product' && !empty($item['product_id'])) {
                    // Handle product update
                    $productResult = $this->updateProductDelivery(
                        $item['product_id'], 
                        $item['ending_qty'] ?? 0, 
                        $item['beginning_qty'] ?? 0,
                        $item['used_qty'] ?? 0,
                        $today
                    );
                    
                    // Update or create delivery record
                    $this->createDeliveryRecord(
                        $today, 
                        $userId, 
                        'product', 
                        $item['product_id'], 
                        null, 
                        $item['beginning_qty'] ?? 0, 
                        $item['used_qty'] ?? 0, 
                        $item['ending_qty'] ?? 0
                    );
                    
                    $updated[] = $productResult;
                } 
                else if ($item['type'] === 'inventory' && !empty($item['inventory_id'])) {
                    // Handle inventory update
                    $inventoryResult = $this->updateInventoryDelivery(
                        $item['inventory_id'], 
                        $item['ending_qty'] ?? 0, 
                        $item['beginning_qty'] ?? 0,
                        $item['used_qty'] ?? 0,
                        $today
                    );
                    
                    // Update or create delivery record
                    $this->createDeliveryRecord(
                        $today, 
                        $userId, 
                        'inventory', 
                        null, 
                        $item['inventory_id'], 
                        $item['beginning_qty'] ?? 0, 
                        $item['used_qty'] ?? 0, 
                        $item['ending_qty'] ?? 0
                    );
                    
                    $updated[] = $inventoryResult;
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Delivery data updated successfully',
                'updated_items' => $updated
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update delivery data: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update product delivery data and product_sold record
     */
    private function updateProductDelivery($productId, $endingQty, $beginningQty, $deliveredQty, $date)
    {
        // Find or create a product_sold record for today
        $productSold = ProductSold::updateOrCreate(
            ['product_id' => $productId, 'date' => $date],
            ['product_qty' => $endingQty, 'product_sold' => 0]
        );
        
        return [
            'type' => 'product',
            'id' => $productId,
            'ending_qty' => $endingQty
        ];
    }
    
    /**
     * Update inventory delivery data and inventory_used record
     */
    private function updateInventoryDelivery($inventoryId, $endingQty, $beginningQty, $deliveredQty, $date)
    {
        // Find or create an inventory_used record for today
        $inventoryUsed = InventoryUsed::updateOrCreate(
            ['inventory_id' => $inventoryId, 'date' => $date],
            [
                'inventory_beg' => 0,
                'inventory_used' => 0,
                'inventory_end' => $endingQty
            ]
        );
        
        return [
            'type' => 'inventory',
            'id' => $inventoryId,
            'ending_qty' => $endingQty
        ];
    }
    
    /**
     * Create or update a record in the deliveries table
     */
    private function createDeliveryRecord($date, $userId, $type, $productId = null, $inventoryId = null, $beginQty, $deliveredQty, $endQty)
    {
        // Check if a record already exists for this item on this date
        $existingRecord = null;
        
        if ($type === 'product' && $productId) {
            $existingRecord = Deliveries::where('date', $date)
                ->where('type', $type)
                ->where('product_id', $productId)
                ->first();
        } elseif ($type === 'inventory' && $inventoryId) {
            $existingRecord = Deliveries::where('date', $date)
                ->where('type', $type)
                ->where('inventory_id', $inventoryId)
                ->first();
        }
        
        if ($existingRecord) {
            // Update existing record
            $existingRecord->update([
                'delivery_qty' => $deliveredQty,
                'delivery_end' => $endQty
            ]);
        } else {
            // Create new record
            Deliveries::create([
                'date' => $date,
                'user_id' => $userId,
                'type' => $type,
                'product_id' => $productId,
                'inventory_id' => $inventoryId,
                'delivery_beg' => $beginQty,
                'delivery_qty' => $deliveredQty,
                'delivery_end' => $endQty
            ]);
        }
    }
    
    /**
     * Confirm the delivery and update stock levels
     * Route: staff.delivery.confirm
     */
    public function confirm(Request $request, $id)
    {
        try {
            $delivery = Deliveries::findOrFail($id);
            $today = \Carbon\Carbon::now()->toDateString();

            $delivery->status = 'confirmed';
            $delivery->save();

            if ($delivery->type === 'inventory') {
                // Update inventory_used column for today's record
                $inventoryUsed = \App\Models\InventoryUsed::where('inventory_id', $delivery->inventory_id)
                    ->where('date', $today)
                    ->first();
                if ($inventoryUsed) {
                    $inventoryUsed->inventory_used += $delivery->delivery_qty;
                    // Recompute end
                    $inventoryUsed->inventory_end = $inventoryUsed->inventory_beg - $inventoryUsed->inventory_used;
                    $inventoryUsed->save();
                }
            } else if ($delivery->type === 'product') {
                // Update product_sold column for today's record
                $productSold = \App\Models\ProductSold::where('product_id', $delivery->product_id)
                    ->where('date', $today)
                    ->first();
                if ($productSold) {
                    $productSold->product_sold += $delivery->delivery_qty;
                    $productSold->save();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Delivery confirmed and stock updated successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to confirm delivery: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm delivery: ' . $e->getMessage()
            ], 500);
        }
    }
}
