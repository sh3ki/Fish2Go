<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AdminProductController extends Controller
{
    public function index() {
        $products = Product::latest()->paginate(10);
        return Inertia::render('admin_product', ['products' => $products]);
    }

    public function store(Request $request) {
        $request->validate([
            'product_name' => 'required|string|max:255',
            'product_category' => 'required|string|max:255',
            'product_price' => 'required|numeric|min:0',
            'product_quantity' => 'required|integer|min:1',
            'product_image' => 'nullable|string', // Expect a file path
        ]);

        // Handle Image Movement from Temp to Products
        $imagePath = $request->product_image;
        if ($imagePath && Storage::exists("public/temp/$imagePath")) {
            Storage::move("public/temp/$imagePath", "public/products/$imagePath");
            $imagePath = "products/$imagePath"; // Update file path
        } else {
            $imagePath = null; // If no image uploaded, store NULL
        }

        try {
            // Store Product in Database
            Product::create([
                'product_name' => $request->product_name,
                'product_category' => $request->product_category,
                'product_price' => $request->product_price,
                'product_quantity' => $request->product_quantity,
                'product_image' => $imagePath, // Save only file path
            ]);

            return redirect()->route('admin.products')->with('success', 'Product added successfully!');
        } catch (\Exception $e) {
            Log::error('Error saving product: ' . $e->getMessage());
            return redirect()->route('admin.products')->with('error', 'An error occurred while adding the product.');
        }
    }


    public function uploadTempImage(Request $request) {
        $request->validate([
            'product_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
    
        try {
            if ($request->file('product_image')) {
                $image = $request->file('product_image');
                $imagePath = $image->store('public/temp');
    
                return response()->json(['filePath' => basename($imagePath)]);
            }
    
            return response()->json(['error' => 'Image upload failed'], 400);
        } catch (\Exception $e) {
            Log::error('Error uploading image: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while uploading the image.'], 500);
        }
    }
}