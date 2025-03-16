<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Cache; // Import Cache

class AdminProductController extends Controller
{
    public function index()
    {
        $products = Product::latest()->paginate(10);

        // Get newest products from cache or store them if not present
        $newestProducts = Cache::remember('newest_products', now()->addDays(7), function () {
            return Product::latest()->take(10)->get();
        });

        return Inertia::render('admin_product', [
            'products' => $products,
            'newestProducts' => $newestProducts,
        ]);
    }

    public function store(Request $request)
    {
        try {
            // Validate input
            $validatedData = $request->validate([
                'product_name' => 'required|string|max:255',
                'product_category' => 'required|string|max:255',
                'product_price' => 'required|numeric|min:0',
                'product_quantity' => 'required|integer|min:1',
                'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
    
            // Handle image upload
            $imagePath = null;
            if ($request->hasFile('product_image')) {
                $imagePath = $request->file('product_image')->store('products', 'public');
            }
    
            // Store product
            $product = Product::create([
                'product_name' => $validatedData['product_name'],
                'product_category' => $validatedData['product_category'],
                'product_price' => $validatedData['product_price'],
                'product_quantity' => $validatedData['product_quantity'],
                'product_image' => $imagePath,
            ]);

            // Update cache for newest products
            Cache::forget('newest_products');
            Cache::remember('newest_products', now()->addDays(7), function () {
                return Product::latest()->take(10)->get();
            });
    
            return response()->json(['success' => 'Product added successfully!', 'product' => $product]);
        } catch (\Exception $e) {
            Log::error('Product Store Error: ' . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred.'], 500);
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
                'product_quantity' => 'required|integer|min:1',
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