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
        // Fetch products with categories
        $products = Product::join('categories', 'products.category_id', '=', 'categories.category_id')
            ->select(
                'products.product_id',
                'products.product_name',
                'products.category_id',
                'categories.category_name',
                'products.product_price',
                'products.product_qty',
                'products.product_image',
                'products.created_at'
            )
            ->get();

        // Fetch all categories
        $categories = Category::select('category_id', 'category_name')->get();

        return Inertia::render('staff_pos', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }
}
