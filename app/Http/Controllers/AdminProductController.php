<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;

class AdminProductController extends Controller
{
    public function index()
    {
        $products = Product::latest()->paginate(10);
        return Inertia::render('admin_product', ['products' => $products]);
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
            Product::create([
                'product_name' => $validatedData['product_name'],
                'product_category' => $validatedData['product_category'],
                'product_price' => $validatedData['product_price'],
                'product_quantity' => $validatedData['product_quantity'],
                'product_image' => $imagePath,
            ]);

            // ✅ Check if it's an Inertia request
            if ($request->inertia()) {
                return back()->with(['success' => 'Product added successfully!']);
            }

            // ✅ Fallback for non-Inertia requests
            return Redirect::route('admin.products.index')->with('success', 'Product added successfully!');
        } catch (\Exception $e) {
            \Log::error('Product Store Error: ' . $e->getMessage());

            // ✅ Handle errors properly
            return back()->withErrors(['error' => 'An unexpected error occurred.']);
        }
    }
        //realtime quantite
            public function getProducts()
        {
            return response()->json(Product::all());
        }
}