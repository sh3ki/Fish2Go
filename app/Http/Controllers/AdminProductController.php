<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Category;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use App\Models\ProductSold;
use Carbon\Carbon;

class AdminProductController extends Controller
{
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
            
            // Get yesterday's date for fetching previous records
            $yesterday = Carbon::parse($today)->subDay()->toDateString();
            
            // Get all products
            $products = Product::with(['category'])->get();
            
            foreach ($products as $product) {
                // Find the most recent product_sold record for this product
                $latestRecord = ProductSold::where('product_id', $product->product_id)
                    ->orderBy('date', 'desc')
                    ->first();
                
                // Get previous product_qty (from yesterday or default to product's qty)
                $previousQty = $product->product_qty;
                
                if ($latestRecord) {
                    // Start with remaining quantity from previous record
                    $previousQty = $latestRecord->product_qty - $latestRecord->product_sold;
                    
                    // Ensure we don't go below zero
                    $previousQty = max(0, $previousQty);
                }
                
                // Create new record for today
                ProductSold::create([
                    'product_id' => $product->product_id,
                    'date' => $today,
                    'product_qty' => $previousQty,
                    'product_sold' => 0 // Start with 0 sold
                ]);
                
                $recordsCreated++;
            }
            
            \Log::info("Initialized {$recordsCreated} product_sold records for {$today}");
        }
    }

    public function index()
    {
        // Get today's date
        $today = Carbon::now()->toDateString();
        
        // Initialize product_sold records for today if needed
        $this->initializeProductSoldForToday($today);
        
        // Get all products with their today's product_sold records
        $products = Product::with(['category', 'productSold' => function($query) use ($today) {
            $query->where('date', $today);
        }])->latest()->get();
        
        $newestProducts = Product::with(['category', 'productSold' => function($query) use ($today) {
            $query->where('date', $today);
        }])->latest()->take(10)->get();
    
        return Inertia::render('admin_product', [
            'products' => [
                'data' => $products->map(function ($product) use ($today) {
                    // Get product_sold data for today
                    $productSoldToday = $product->productSold->first();
                    $soldQty = $productSoldToday ? $productSoldToday->product_qty : 0;
                    
                    return [
                        'product_id' => $product->product_id,
                        'product_name' => $product->product_name,
                        'category_id' => $product->category_id,
                        'category_name' => $product->category->category_name ?? 'Unknown', 
                        'product_price' => $product->product_price,
                        'product_qty' => $soldQty, // Use today's product_sold.product_qty
                        'product_sold' => $productSoldToday ? $productSoldToday->product_sold : 0,
                        'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                        'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
                        'today' => $today,
                    ];
                }),
                'current_page' => 1,
                'last_page' => 1,
                'total' => $products->count(),
            ],
            'newestProducts' => $newestProducts,
        ]);
    }

    public function fetchNewestProducts()
    {
        // Get today's date
        $today = Carbon::now()->toDateString();
        
        $newestProducts = Product::with(['category', 'productSold' => function($query) use ($today) {
            $query->where('date', $today);
        }])->latest()->take(10)->get()->map(function ($product) use ($today) {
            // Get product_sold data for today
            $productSoldToday = $product->productSold->first();
            $soldQty = $productSoldToday ? $productSoldToday->product_qty : 0;
            
            return [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->category_name ?? 'Unknown',
                'product_price' => $product->product_price,
                'product_qty' => $soldQty, // Use today's product_sold.product_qty
                'product_sold' => $productSoldToday ? $productSoldToday->product_sold : 0,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        });

        return response()->json(['newestProducts' => $newestProducts]);
    }

    public function fetchProducts(Request $request)
    {
        // Get today's date
        $today = Carbon::now()->toDateString();
        
        // Initialize product_sold records for today if needed
        $this->initializeProductSoldForToday($today);
        
        // Get search and category filter parameters
        $search = $request->query('search');
        $category = $request->query('category');
        
        // Start query building with eager loading of category and product_sold
        $query = Product::with(['category', 'productSold' => function($query) use ($today) {
            $query->where('date', $today);
        }])->latest();
        
        // Apply search filter if provided
        if ($search) {
            $query->where('product_name', 'LIKE', "%{$search}%");
        }
        
        // Apply category filter if provided
        if ($category && $category !== 'all') {
            $query->where('category_id', $category);
        }
        
        // Get all products without pagination
        $products = $query->get();
    
        // Transform product data
        $productsData = $products->map(function ($product) use ($today) {
            // Get product_sold data for today
            $productSoldToday = $product->productSold->first();
            $soldQty = $productSoldToday ? $productSoldToday->product_qty : 0;
            
            return [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->category_name ?? 'Unknown',
                'product_price' => $product->product_price,
                'product_qty' => $soldQty, // Use today's product_sold.product_qty
                'product_sold' => $productSoldToday ? $productSoldToday->product_sold : 0,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        });
    
        return response()->json([
            'products' => [
                'data' => $productsData,
                'current_page' => 1,
                'last_page' => 1,
                'total' => $products->count(),
            ]
        ]);
    }

    /**
     * Create a clean filename from product name
     */
    private function createProductFilename($productName, $extension)
    {
        // Remove any characters that aren't alphanumeric, underscores, dashes, or dots
        $sanitized = preg_replace('/[^\w\-\.]/', '_', $productName);
        
        // Replace multiple underscores with a single one
        $sanitized = preg_replace('/_+/', '_', $sanitized);
        
        // Convert to lowercase
        $sanitized = strtolower($sanitized);
        
        // Add the extension
        return $sanitized . '.' . $extension;
    }

    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'product_name' => 'required|string|max:255',
                'category_id' => 'required|integer|exists:categories,category_id',
                'product_price' => 'required|numeric|min:0',
                'product_qty' => 'required|integer|min:0',
                'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
    
            $filename = null;
            
            if ($request->hasFile('product_image')) {
                $file = $request->file('product_image');
                $extension = $file->getClientOriginalExtension();
                
                // Create simple filename based on product name
                $filename = $this->createProductFilename($validatedData['product_name'], $extension);
                
                // Store file with simple product name in products directory
                Storage::disk('public')->putFileAs(
                    'products', 
                    $file, 
                    $filename
                );
            }
    
            $product = Product::create([
                'product_name' => $validatedData['product_name'],
                'category_id' => $validatedData['category_id'],
                'product_price' => $validatedData['product_price'],
                'product_qty' => $validatedData['product_qty'],
                'product_image' => $filename, // Store simple filename
                'product_notification' => 'unread',
            ]);
    
            // Fetch category name after saving
            $product->load('category');
    
            return response()->json([
                'success' => 'Product added successfully!',
                'product' => [
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'category_id' => $product->category_id,
                    'category_name' => $product->category->category_name ?? 'Unknown',
                    'product_price' => $product->product_price,
                    'product_qty' => $product->product_qty,
                    'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                    'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Product Store Error: ' . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred: ' . $e->getMessage()], 500);
        }
    }

    public function getCategories()
    {
        try {
            $categories = Category::all();
            return response()->json($categories, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch categories'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        // Validate the incoming request
        $validated = $request->validate([
            'product_name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,category_id',
            'product_price' => 'required|numeric|min:0',
            'product_qty' => 'required|integer|min:0',
            'product_image' => 'nullable|image|max:2048',
            'existing_image_path' => 'nullable|string',
        ]);

        // Find the product
        $product = Product::findOrFail($id);
        
        // Handle image upload if a new image is provided
        if ($request->hasFile('product_image')) {
            $file = $request->file('product_image');
            $extension = $file->getClientOriginalExtension();
            
            // If there's an existing image, delete it
            if ($product->product_image) {
                Storage::disk('public')->delete('products/' . $product->product_image);
            }
            
            // Create simple filename based on product name
            $filename = $this->createProductFilename($validated['product_name'], $extension);
            
            // Store the new image with simple product name as filename
            Storage::disk('public')->putFileAs(
                'products', 
                $file, 
                $filename
            );
            
            // Update the product with the new filename
            $product->product_image = $filename;
        }
        // If product name changed but image remains the same, rename the image
        else if ($product->product_name !== $validated['product_name'] && $product->product_image) {
            try {
                $extension = pathinfo($product->product_image, PATHINFO_EXTENSION);
                $newFilename = $this->createProductFilename($validated['product_name'], $extension);
                
                // Rename the file in storage
                if (Storage::disk('public')->exists('products/' . $product->product_image)) {
                    Storage::disk('public')->move(
                        'products/' . $product->product_image,
                        'products/' . $newFilename
                    );
                    
                    // Update the DB record with the new filename
                    $product->product_image = $newFilename;
                }
            } catch (\Exception $e) {
                // Log the error but don't halt the update
                Log::error('Error renaming product image: ' . $e->getMessage());
            }
        }

        // Update other product fields
        $product->product_name = $validated['product_name'];
        $product->category_id = $validated['category_id'];
        $product->product_price = $validated['product_price'];
        $product->product_qty = $validated['product_qty'];
        
        // Update today's product_sold record if it exists
        $today = Carbon::now()->toDateString();
        $productSoldToday = ProductSold::where('product_id', $id)
            ->where('date', $today)
            ->first();
            
        if ($productSoldToday) {
            // Update the product_qty in product_sold record
            $productSoldToday->product_qty = $validated['product_qty'];
            $productSoldToday->save();
        } else {
            // Create a new record for today
            ProductSold::create([
                'product_id' => $id,
                'date' => $today,
                'product_qty' => $validated['product_qty'],
                'product_sold' => 0
            ]);
        }
        
        // Save the product
        $product->save();

        // Get today's product_sold data for the response
        $productSoldData = ProductSold::where('product_id', $id)
            ->where('date', $today)
            ->first();

        // Return success response with updated product including proper image path
        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'product' => [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->category_name ?? 'Unknown',
                'product_price' => $product->product_price,
                'product_qty' => $productSoldData ? $productSoldData->product_qty : $product->product_qty,
                'product_sold' => $productSoldData ? $productSoldData->product_sold : 0,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ]
        ]);
    }

    public function destroy($id)
    {
        try {
            // Find product
            $product = Product::findOrFail($id);
    
            // Delete image if exists
            if ($product->product_image) {
                Storage::disk('public')->delete('products/' . $product->product_image);
            }
    
            // Delete product
            $product->delete();

            // Update cache for newest products
            Cache::forget('newest_products');
            Cache::remember('newest_products', now()->addDays(7), function () {
                return Product::latest()->take(10)->get();
            });
    
            return response()->json(['success' => 'Product deleted successfully!']);
        } catch (\Exception $e) {
            Log::error('Product Delete Error: ' . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred.'], 500);
        }
    }

    public function getProducts()
    {
        // Get today's date
        $today = Carbon::now()->toDateString();
        
        // Initialize product_sold records for today if needed
        $this->initializeProductSoldForToday($today);
        
        return response()->json(Product::with(['productSold' => function($query) use ($today) {
            $query->where('date', $today);
        }])->get()->map(function ($product) {
            // Get product_sold data for today
            $productSoldToday = $product->productSold->first();
            $soldQty = $productSoldToday ? $productSoldToday->product_qty : 0;
            
            return [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'product_price' => $product->product_price,
                'product_qty' => $soldQty, // Use today's product_sold.product_qty
                'product_sold' => $productSoldToday ? $productSoldToday->product_sold : 0,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        }));
    }
}