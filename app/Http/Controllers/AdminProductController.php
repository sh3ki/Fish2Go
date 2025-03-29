<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Category;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Cache; // Import Cache

class AdminProductController extends Controller
{
    public function index()
    {
        // ✅ Ensure category is eager loaded
        $products = Product::with('category')->latest()->paginate(10);
        $newestProducts = Product::with('category')->latest()->take(10)->get();
    
        return Inertia::render('admin_product', [
            'products' => [
                'data' => $products->map(function ($product) {
                    return [
                        'product_id' => $product->product_id,
                        'product_name' => $product->product_name,
                        'category_id' => $product->category_id,
                        'category_name' => $product->category->category_name ?? 'Unknown', // ✅ Prevent undefined error
                        'product_price' => $product->product_price,
                        'product_qty' => $product->product_qty,
                        'product_image' => $product->product_image,
                        'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
                    ];
                }),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
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
            'product_image' => $product->product_image,
            'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
        ];
    });

    return response()->json(['newestProducts' => $newestProducts]);
}

    
    public function fetchProducts()
    {
        // ✅ Ensure category is eager loaded
        $products = Product::with('category')->latest()->paginate(10);
    
        $newestProducts = Cache::remember('newest_products', now()->addDays(7), function () {
            return Product::with('category')->latest()->take(10)->get();
        });
    
        // Transform product data
        $productsData = $products->getCollection()->map(function ($product) {
            return [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->category_name ?? 'Unknown',
                'product_price' => $product->product_price,
                'product_qty' => $product->product_qty,
                'product_image' => $product->product_image,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
            ];
        });
    
        return response()->json([
            'products' => [
                'data' => $productsData,
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
            ],
            'newestProducts' => $newestProducts,
        ]);
    }
    
    


    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'product_name' => 'required|string|max:255',
                'category_id' => 'required|integer|exists:categories,category_id', // ✅ Ensures category exists
                'product_price' => 'required|numeric|min:0',
                'product_qty' => 'required|integer|min:1',
                'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
    
            $imagePath = null;
            if ($request->hasFile('product_image')) {
                $imagePath = $request->file('product_image')->store('products', 'public');
            }
    
            $product = Product::create([
                'product_name' => $validatedData['product_name'],
                'category_id' => $validatedData['category_id'],
                'product_price' => $validatedData['product_price'],
                'product_qty' => $validatedData['product_qty'],
                'product_image' => $imagePath,
                'product_notification' => 'unread',
            ]);
    
            // ✅ Fetch category name after saving
            $product->load('category');
    
            // ✅ Return the formatted product including category name and created_at
            return response()->json([
                'success' => 'Product added successfully!',
                'product' => [
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'category_id' => $product->category_id,
                    'category_name' => $product->category->category_name ?? 'Unknown',
                    'product_price' => $product->product_price,
                    'product_qty' => $product->product_qty,
                    'product_image' => $product->product_image,
                    'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Product Store Error: ' . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred.'], 500);
        }
    }
    
    

    public function getCategories()
    {
        try {
            $categories = Category::all(); // ✅ Fetch all categories from PostgreSQL
            return response()->json($categories, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch categories'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            // Validate input
            $validatedData = $request->validate([
                'product_name' => 'required|string|max:255',
                'product_category' => 'required|string|max:255',
                'product_price' => 'required|numeric|min:0',
                'product_qty' => 'required|integer|min:1',
                'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            // Find product
            $product = Product::findOrFail($id);

            // Handle image upload
            if ($request->hasFile('product_image')) {
                // Delete old image if exists
                if ($product->product_image) {
                    Storage::disk('public')->delete($product->product_image);
                }
                $product->product_image = $request->file('product_image')->store('products', 'public');
            }

            // Update product
            $product->update($validatedData);

            // Update cache for newest products
            Cache::forget('newest_products');
            Cache::remember('newest_products', now()->addDays(7), function () {
                return Product::latest()->take(10)->get();
            });

            return back()->with(['success' => 'Product updated successfully!']);
        } catch (\Exception $e) {
            Log::error('Product Update Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'An unexpected error occurred.']);
        }
    }

    public function destroy($id)
    {
        try {
            // Find product
            $product = Product::findOrFail($id);
    
            // Delete image if exists
            if ($product->product_image) {
                Storage::disk('public')->delete($product->product_image);
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
        return response()->json(Product::all());
    }


    
}