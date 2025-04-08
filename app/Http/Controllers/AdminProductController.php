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

class AdminProductController extends Controller
{
    public function index()
    {
        // Changed from paginate(10) to paginate(30) to show more products initially 
        $products = Product::with('category')->latest()->paginate(30);
        $newestProducts = Product::with('category')->latest()->take(10)->get();
    
        return Inertia::render('admin_product', [
            'products' => [
                'data' => $products->map(function ($product) {
                    return [
                        'product_id' => $product->product_id,
                        'product_name' => $product->product_name,
                        'category_id' => $product->category_id,
                        'category_name' => $product->category->category_name ?? 'Unknown', 
                        'product_price' => $product->product_price,
                        'product_qty' => $product->product_qty,
                        'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                        'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
                    ];
                }),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ],
            'newestProducts' => $newestProducts,
        ]);
    }

    public function fetchNewestProducts()
    {
        $newestProducts = Product::with('category')->latest()->take(10)->get()->map(function ($product) {
            return [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->category_name ?? 'Unknown',
                'product_price' => $product->product_price,
                'product_qty' => $product->product_qty,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        });

        return response()->json(['newestProducts' => $newestProducts]);
    }

    public function fetchProducts(Request $request)
    {
        // Get page, search, and category filter parameters
        $page = $request->query('page', 1);
        $search = $request->query('search');
        $category = $request->query('category');
        
        // Start query building with eager loading of category
        $query = Product::with('category')->latest();
        
        // Apply search filter if provided
        if ($search) {
            $query->where('product_name', 'LIKE', "%{$search}%");
        }
        
        // Apply category filter if provided
        if ($category && $category !== 'all') {
            $query->where('category_id', $category);
        }
        
        // Execute query with pagination (20 items per page for better lazy loading)
        $products = $query->paginate(20);
    
        // Transform product data
        $productsData = $products->getCollection()->map(function ($product) {
            return [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->category_name ?? 'Unknown',
                'product_price' => $product->product_price,
                'product_qty' => $product->product_qty,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        });
    
        return response()->json([
            'products' => [
                'data' => $productsData,
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
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
        
        // Save the product
        $product->save();

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
                'product_qty' => $product->product_qty,
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
        return response()->json(Product::all()->map(function ($product) {
            return [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'product_price' => $product->product_price,
                'product_qty' => $product->product_qty,
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        }));
    }
}