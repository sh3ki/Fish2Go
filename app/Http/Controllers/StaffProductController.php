<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;

class StaffProductController extends Controller
{
    public function index()
    {
        $products = Product::orderBy('product_id', 'asc')->get();
        return Inertia::render('staff_product', ['products' => $products]);
    }

    public function getProducts(Request $request)
    {
        if ($request->wantsJson()) {
            // Return JSON response for API requests
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
    
        // Return an Inertia response for Inertia requests
        return Inertia::render('staff_product', [
            'products' => Product::all()->map(function ($product) {
                return [
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'category_id' => $product->category_id,
                    'product_price' => $product->product_price,
                    'product_qty' => $product->product_qty,
                    'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                    'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : null,
                ];
            }),
        ]);
    }

}
