<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use App\Models\Cook;
use App\Models\ProductSold;
use App\Models\Order;
use App\Models\Summary;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class StaffDashboardController extends Controller
{
    // Define the product pairs that should share stock calculations
    protected $sharedStockPairs = [
        [37, 38], // First pair
        [39, 40]  // Second pair
    ];
    
    // Helper method to determine if a product is part of a shared stock pair
    private function getSharedStockPair($productId)
    {
        foreach ($this->sharedStockPairs as $pair) {
            if (in_array($productId, $pair)) {
                return $pair;
            }
        }
        return null;
    }
    
    // Helper method to calculate the shared stock display value
    private function calculateSharedStock($productId, $allProducts, $today)
    {
        $sharedPair = $this->getSharedStockPair($productId);
        
        if (!$sharedPair) {
            return null; // Not a shared stock product
        }
        
        // Get all product_sold records for today for all products in the pair
        $pairProductSold = ProductSold::whereIn('product_id', $sharedPair)
                                      ->where('date', $today)
                                      ->get();
        
        if ($pairProductSold->isEmpty()) {
            return 0; // No records found
        }
        
        // Find this product's record
        $thisProductSold = $pairProductSold->firstWhere('product_id', $productId);
        
        if (!$thisProductSold) {
            return 0;
        }
        
        // Get the base stock from this product's record
        $baseStock = $thisProductSold->product_qty;
        
        // Calculate total sold from all products in the pair
        $totalSold = $pairProductSold->sum('product_sold');
        
        // Return stock after subtracting total sold
        return max(0, $baseStock - $totalSold);
    }

    public function index()
    {
        // Get today's date for cook data
        $today = Carbon::now()->toDateString();
        
        // Check if there are product_sold records for today, initialize if needed
        $this->initializeProductSoldForToday($today);

        // First fetch all products with their relationships
        $allProducts = Product::with([
            'category', 
            'cooks' => function($query) use ($today) {
                $query->where('date', $today);
            },
            'productSold' => function($query) use ($today) {
                $query->where('date', $today);
            }
        ])->get();

        // Then map through them to calculate stock
        $products = $allProducts->map(function ($product) use ($today, $allProducts) {
            // Check if product is in the grilled category
            $isGrilled = $product->category && $product->category->category_name === 'Grilled';
            
            // Check if this is a special product that shares stock calculation
            $productId = $product->product_id;
            $sharedStock = $this->calculateSharedStock($productId, $allProducts, $today);
            
            if ($sharedStock !== null) {
                $productStock = $sharedStock;
            } else {
                // For grilled products, stock is always based on cook_available
                if ($isGrilled) {
                    // Get today's cook data if it exists for grilled products
                    $cookData = $product->cooks->first();
                    
                    // If no cook data or cook_available is 0, stock is 0
                    $productStock = $cookData && $cookData->cook_available > 0 ? $cookData->cook_available : 0;
                } else {
                    // For non-grilled products, use product_qty from product_sold
                    $productSoldData = $product->productSold->first();
                    // If no product_sold data, stock is 0
                    $productStock = $productSoldData ? $productSoldData->product_qty - $productSoldData->product_sold : 0;
                }
            }
            
            // Add debug logging for products 37, 38, 39, 40
            if (in_array($productId, [37, 38, 39, 40])) {
                \Log::info("Product #{$productId} ({$product->product_name}) stock: {$productStock}");
                
                // If it's a shared stock product, log additional details
                if ($sharedStock !== null) {
                    \Log::info("  - Using shared stock calculation");
                    
                    // Log the product_sold data for this pair
                    $sharedPair = $this->getSharedStockPair($productId);
                    $pairData = ProductSold::whereIn('product_id', $sharedPair)
                                          ->where('date', $today)
                                          ->get();
                    
                    foreach ($pairData as $record) {
                        \Log::info("  - Product #{$record->product_id} has qty:{$record->product_qty} sold:{$record->product_sold}");
                    }
                }
            }
            
            return [
                'product_id' => $productId,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->category_name ?? 'Unknown',
                'category_color' => $product->category->category_color ?? '#000000',
                'product_price' => $product->product_price,
                'product_qty' => $productStock,
                'is_grilled' => $isGrilled,
                'cook_id' => $isGrilled && isset($cookData) ? $cookData->cook_id : null,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        });

        // Fetch all categories with color
        $categories = Category::select('category_id', 'category_name', 'category_color')->get();

        return Inertia::render('staff_pos', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }
    
    /**
     * Initialize product_sold records for today if they don't exist
     *
     * @param string $today The current date
     * @return void
     */
    private function initializeProductSoldForToday($today)
    {
        // Check if any records exist for today
        $todayRecordsCount = ProductSold::where('date', $today)->count();
        
        if ($todayRecordsCount === 0) {
            \Log::info("Initializing product_sold records for {$today}");
            $recordsCreated = 0;
            
            // Get yesterday's date for fetching cook records
            $yesterday = Carbon::parse($today)->subDay()->toDateString();
            
            // Get all products
            $products = Product::with(['category'])->get();
            
            foreach ($products as $product) {
                // Find the most recent product_sold record for this product
                $latestRecord = ProductSold::where('product_id', $product->product_id)
                    ->orderBy('date', 'desc')
                    ->first();
                
                // Get previous product_qty (from yesterday or default to 0)
                $previousQty = 0;
                
                if ($latestRecord) {
                    // Start with remaining quantity from previous record
                    $previousQty = $latestRecord->product_qty - $latestRecord->product_sold;
                    
                    // Check if this is a grilled product
                    $isGrilled = $product->category && $product->category->category_name === 'Grilled';
                    
                    if ($isGrilled) {
                        // For grilled products, check for yesterday's cook records
                        $yesterdayCookRecords = Cook::where('date', $yesterday)
                            ->where('product_id', $product->product_id)
                            ->first();
                        
                        // If there were cook records for this grilled product, subtract cook_available
                        if ($yesterdayCookRecords && $yesterdayCookRecords->cook_available > 0) {
                            $previousQty -= $yesterdayCookRecords->cook_available;
                            \Log::info("Adjusted grilled product #{$product->product_id} ({$product->product_name}) quantity by -" . 
                                    $yesterdayCookRecords->cook_available . " from cook record #{$yesterdayCookRecords->cook_id}");
                        }
                    } else {
                        // For non-grilled products, check if used as ingredients in yesterday's cooking
                        $yesterdayCookRecords = Cook::where('date', $yesterday)
                            ->get();
                        
                        // If there were cook records for yesterday, look for this product's usage
                        foreach ($yesterdayCookRecords as $cookRecord) {
                            // If this product was used as an ingredient for a grilled product
                            if ($cookRecord->ingredient_product_id == $product->product_id && $cookRecord->cook_available > 0) {
                                $previousQty -= $cookRecord->cook_available;
                                \Log::info("Adjusted product #{$product->product_id} ({$product->product_name}) quantity by -" . 
                                        $cookRecord->cook_available . " from cook record #{$cookRecord->cook_id}");
                            }
                        }
                    }
                    
                    // Ensure we don't go below zero
                    $previousQty = max(0, $previousQty);
                    
                    // Skip if previous quantity was 0
                    if ($previousQty <= 0) {
                        \Log::info("Skipping product #{$product->product_id} ({$product->product_name}) - no remaining quantity");
                        continue;
                    }
                }
                
                // Create new record for today
                ProductSold::create([
                    'product_id' => $product->product_id,
                    'date' => $today,
                    'product_qty' => $previousQty,
                    'product_sold' => 0 // Start with 0 sold
                ]);
                
                $recordsCreated++;
                \Log::info("Created product_sold record for product #{$product->product_id} ({$product->product_name}) with qty: {$previousQty}");
            }
            
            \Log::info("Initialized {$recordsCreated} product_sold records for {$today}");
        }
    }
    
    public function fetchProducts(Request $request)
    {
        // Get search and category filter parameters
        $search = $request->query('search');
        $category = $request->query('category');
        
        // Get today's date for data
        $today = Carbon::now()->toDateString();
        
        // Make sure today's records are initialized
        $this->initializeProductSoldForToday($today);
        
        // Start query building with eager loading of category
        $query = Product::with([
            'category', 
            'cooks' => function($query) use ($today) {
                $query->where('date', $today);
            },
            'productSold' => function($query) use ($today) {
                $query->where('date', $today);
            }
        ]);
        
        // Apply search filter if provided
        if ($search) {
            $query->where('product_name', 'LIKE', "%{$search}%");
        }
        
        // Apply category filter if provided
        if ($category && $category !== 'all') {
            $query->where('category_id', $category);
        }
        
        // Execute query
        $allProducts = $query->get();
        
        // Map products with calculated stock values
        $products = $allProducts->map(function ($product) use ($today, $allProducts) {
            // Check if product is in the grilled category
            $isGrilled = $product->category && $product->category->category_name === 'Grilled';
            
            // Check if this is a special product that shares stock calculation
            $productId = $product->product_id;
            $sharedStock = $this->calculateSharedStock($productId, $allProducts, $today);
            
            if ($sharedStock !== null) {
                $productStock = $sharedStock;
            } else {
                // For grilled products, stock is always based on cook_available
                if ($isGrilled) {
                    // Get today's cook data if it exists for grilled products
                    $cookData = $product->cooks->first();
                    
                    // If no cook data or cook_available is 0, stock is 0
                    $productStock = $cookData && $cookData->cook_available > 0 ? $cookData->cook_available : 0;
                } else {
                    // For non-grilled products, use product_qty from product_sold
                    $productSoldData = $product->productSold->first();
                    // If no product_sold data, stock is 0
                    $productStock = $productSoldData ? $productSoldData->product_qty - $productSoldData->product_sold : 0;
                }
            }
            
            // Add debug logging for products 37, 38, 39, 40 during fetch
            if (in_array($productId, [37, 38, 39, 40])) {
                \Log::info("FETCH: Product #{$productId} ({$product->product_name}) stock: {$productStock}");
            }
            
            return [
                'product_id' => $productId,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->category_name ?? 'Unknown',
                'category_color' => $product->category->category_color ?? '#000000',
                'product_price' => $product->product_price,
                'product_qty' => $productStock,
                'is_grilled' => $isGrilled,
                'cook_id' => $isGrilled && isset($cookData) ? $cookData->cook_id : null,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        });
    
        return response()->json(['products' => $products]);
    }

    public function store(Request $request)
    {
        try {
            // Validate required fields
            $request->validate([
                'total' => 'required|numeric',
                'payment_method' => 'required|string'
            ]);
            
            // This method is deprecated. Checkout processing has moved to StaffOrderController
            // This is just kept for backward compatibility
            Log::info('Deprecated StaffDashboardController.store() called. This should be updated to use StaffOrderController.');
            
            return response()->json([
                'success' => false,
                'message' => 'This endpoint is deprecated. Please use staff.orders.store route instead.'
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to process order: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to process order: ' . $e->getMessage()
            ], 500);
        }
    }
}
