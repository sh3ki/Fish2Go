<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use App\Models\Cook;
use Carbon\Carbon;

class StaffDashboardController extends Controller
{
    public function index()
    {
        // Get today's date for cook data
        $today = Carbon::now()->toDateString();

        // Fetch products with eager loading of categories
        $products = Product::with(['category', 'cooks' => function($query) use ($today) {
            $query->where('date', $today);
        }])->get()->map(function ($product) use ($today) {
            // Check if product is in the grilled category
            $isGrilled = $product->category && $product->category->category_name === 'Grilled';
            
            // For grilled products, stock is always based on cook_available
            if ($isGrilled) {
                // Get today's cook data if it exists for grilled products
                $cookData = $product->cooks->first();
                
                // If no cook data or cook_available is 0, stock is 0
                $productStock = $cookData && $cookData->cook_available > 0 ? $cookData->cook_available : 0;
            } else {
                // For non-grilled products, use product_qty as before
                $productStock = $product->product_qty;
            }
            
            return [
                'product_id' => $product->product_id,
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
    
    public function fetchProducts(Request $request)
    {
        // Get search and category filter parameters
        $search = $request->query('search');
        $category = $request->query('category');
        
        // Get today's date for cook data
        $today = Carbon::now()->toDateString();
        
        // Start query building with eager loading of category
        $query = Product::with(['category', 'cooks' => function($query) use ($today) {
            $query->where('date', $today);
        }]);
        
        // Apply search filter if provided
        if ($search) {
            $query->where('product_name', 'LIKE', "%{$search}%");
        }
        
        // Apply category filter if provided
        if ($category && $category !== 'all') {
            $query->where('category_id', $category);
        }
        
        // Execute query
        $products = $query->get()->map(function ($product) use ($today) {
            // Check if product is in the grilled category
            $isGrilled = $product->category && $product->category->category_name === 'Grilled';
            
            // For grilled products, stock is always based on cook_available
            if ($isGrilled) {
                // Get today's cook data if it exists for grilled products
                $cookData = $product->cooks->first();
                
                // If no cook data or cook_available is 0, stock is 0
                $productStock = $cookData && $cookData->cook_available > 0 ? $cookData->cook_available : 0;
            } else {
                // For non-grilled products, use product_qty as before
                $productStock = $product->product_qty;
            }
            
            return [
                'product_id' => $product->product_id,
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
}
