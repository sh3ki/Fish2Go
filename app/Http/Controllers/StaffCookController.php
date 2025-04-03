<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use App\Models\Cook;
use Carbon\Carbon;

class StaffCookController extends Controller
{
    public function index()
    {
        // Fetch products with eager loading of categories
        $products = Product::with('category')->get()->map(function ($product) {
            return [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->category_name ?? 'Unknown',
                'category_color' => $product->category->category_color ?? '#000000',
                'product_price' => $product->product_price,
                'product_qty' => $product->product_qty,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        });

        // Fetch all categories with color
        $categories = Category::select('category_id', 'category_name', 'category_color')->get();

        return Inertia::render('staff_cook', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }
    
    public function fetchProducts(Request $request)
    {
        // Get search and category filter parameters
        $search = $request->query('search');
        $category = $request->query('category');
        
        // Start query building with eager loading of category
        $query = Product::with('category');
        
        // Apply search filter if provided
        if ($search) {
            $query->where('product_name', 'LIKE', "%{$search}%");
        }
        
        // Apply category filter if provided
        if ($category && $category !== 'all') {
            $query->where('category_id', $category);
        }
        
        // Execute query
        $products = $query->get()->map(function ($product) {
            return [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->category_name ?? 'Unknown',
                'category_color' => $product->category->category_color ?? '#000000',
                'product_price' => $product->product_price,
                'product_qty' => $product->product_qty,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        });
    
        return response()->json(['products' => $products]);
    }
    
    public function save(Request $request)
    {
        try {
            // Validate incoming request
            $request->validate([
                'items' => 'required|array',
                'items.*.product_id' => 'required|exists:products,product_id',
                'items.*.qty' => 'required|integer|min:1',
            ]);
            
            // Start database transaction
            \DB::beginTransaction();
            
            $today = Carbon::now()->format('Y-m-d');
            $savedItems = [];
            
            // Process each item in the cooking queue
            foreach ($request->items as $item) {
                // Check if there's already a record for this product today
                $existingRecord = Cook::where('product_id', $item['product_id'])
                                ->where('date', $today)
                                ->first();
                
                if ($existingRecord) {
                    // Update existing record by adding to available and leftover
                    $existingRecord->cook_available += $item['qty'];
                    $existingRecord->cook_leftover += $item['qty'];
                    $existingRecord->save();
                    $savedItems[] = $existingRecord;
                } else {
                    // Create a new record
                    $cook = new Cook();
                    $cook->product_id = $item['product_id'];
                    $cook->cook_available = $item['qty'];
                    $cook->cook_leftover = $item['qty'];
                    $cook->date = $today;
                    $cook->save();
                    $savedItems[] = $cook;
                }
                
                // Update product quantity in the products table
                $product = Product::find($item['product_id']);
                if ($product) {
                    $product->product_qty = max(0, $product->product_qty - $item['qty']);
                    $product->save();
                }
            }
            
            // Commit the transaction
            \DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Cooked items saved successfully',
                'items' => $savedItems
            ]);
        } catch (\Exception $e) {
            // Roll back the transaction if an error occurs
            \DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save items: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Get cooked products for today
     */
    public function getCookedProducts()
    {
        try {
            $today = Carbon::now()->format('Y-m-d');
            
            // Get all cook records for today with their related products
            $cookedItems = Cook::where('date', $today)
                            ->where('cook_available', '>', 0)
                            ->with(['product' => function($query) {
                                $query->with('category');
                            }])
                            ->get();
            
            return response()->json([
                'success' => true,
                'cookedItems' => $cookedItems
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cooked items: ' . $e->getMessage()
            ], 500);
        }
    }
}
