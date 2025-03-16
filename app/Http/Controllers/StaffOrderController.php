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
            Log::info('Store Order Request:', $request->all()); // Log the incoming request data

            $validatedData = $request->validate([
                'items' => 'required|array',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.category' => 'required|string',
                'subtotal' => 'required|numeric',
                'tax' => 'required|numeric',
                'discount' => 'required|numeric',
                'total' => 'required|numeric',
                'payment' => 'required|numeric',
                'change' => 'required|numeric',
                'status' => 'required|string',
            ]);

            Log::info('Validated Data:', $validatedData); // Log the validated data

            foreach ($validatedData['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->product_quantity < $item['quantity']) {
                    Log::warning('Not enough stock for product ID ' . $item['product_id']); // Log stock issue
                    return back()->withErrors(['error' => 'Not enough stock available for product ID ' . $item['product_id']]);
                }

                // Deduct the quantity from the product
                $product->product_quantity -= $item['quantity'];
                $product->save();
            }

            // Create the order
            Order::create([
                'items' => json_encode($validatedData['items']),
                'subtotal' => $validatedData['subtotal'],
                'tax' => $validatedData['tax'],
                'discount' => $validatedData['discount'],
                'total' => $validatedData['total'],
                'payment' => $validatedData['payment'],
                'change' => $validatedData['change'],
                'status' => $validatedData['status'],
            ]);

            Log::info('Order created successfully'); // Log successful order creation

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Order Store Error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'An unexpected error occurred.'], 500);
        }
    }
}