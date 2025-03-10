<?php

namespace App\Http\Controllers;
use Inertia\Inertia; 
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;

class StaffDashboardController extends Controller
{
    public function index()
    {
        $products = Product::all();
        return Inertia::render('staff_pos', ['products' => $products]);
    }

    public function store(Request $request)
    {
        $order = Order::create($request->all());
        return response()->json(['message' => 'Order placed successfully', 'order' => $order]);
    }
}

