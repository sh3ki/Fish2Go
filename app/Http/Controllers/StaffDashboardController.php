<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;

class StaffDashboardController extends Controller
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

        return Inertia::render('staff_pos', [
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
}
