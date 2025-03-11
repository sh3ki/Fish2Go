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
        try {
            $validatedData = $request->validate([
                'items' => 'required|array',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'subtotal' => 'required|numeric|min:0',
                'tax' => 'required|numeric|min:0',
                'discount' => 'required|numeric|min:0',
                'total' => 'required|numeric|min:0',
                'payment' => 'required|numeric|min:0',
                'change' => 'required|numeric|min:0',
            ]);

            foreach ($validatedData['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->product_quantity < $item['quantity']) {
                    return back()->withErrors(['error' => 'Not enough stock available for product ID ' . $item['product_id']]);
                }

                // Deduct the quantity from the product
                $product->product_quantity -= $item['quantity'];
                $product->save();

                // Create the order
                Order::create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'], // Store the quantity in the order
                    'subtotal' => $validatedData['subtotal'],
                    'tax' => $validatedData['tax'],
                    'discount' => $validatedData['discount'],
                    'total' => $validatedData['total'],
                    'payment' => $validatedData['payment'],
                    'change' => $validatedData['change'],
                ]);
            }

            return back()->with(['success' => 'Order created successfully!']);
        } catch (\Exception $e) {
            Log::error('Order Store Error: ' . $e->getMessage(), ['exception' => $e]);
            return back()->withErrors(['error' => 'An unexpected error occurred.']);
        }
    }
}