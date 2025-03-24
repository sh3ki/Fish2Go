<?php
namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use App\Models\Product;

class StaffOrderController extends Controller
{
    public function index()
    {
        $orders = Order::all();
        return Inertia::render('staff_pos', [
            'orders' => $orders,
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            '*.customer_id' => 'required|integer',
            '*.product_id' => 'required|integer',
            '*.product_quantity' => 'required|integer|min:1',
            '*.order_subtotal' => 'required|numeric',
            '*.order_tax' => 'required|numeric',
            '*.order_discount' => 'required|numeric',
            '*.order_total' => 'required|numeric',
            '*.order_payment' => 'required|numeric',
            '*.order_change' => 'required|numeric',
            '*.order_status' => 'required|string',
        ]);

        foreach ($validatedData as $order) {
            // Deduct product quantity from the products table
            $product = Product::findOrFail($order['product_id']);
            if ($product->product_qty < $order['product_quantity']) {
                return response()->json(['error' => 'Not enough stock available for product ID: ' . $order['product_id']], 422);
            }

            $product->decrement('product_qty', $order['product_quantity']);

            // Create the order
            Order::create($order);
        }

        return response()->json(['message' => 'Orders successfully created.'], 201);
    }
}