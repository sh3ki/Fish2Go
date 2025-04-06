<?php
namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use App\Models\Product;
use App\Models\Cook;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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
        // Validate incoming request data
        $validatedData = $request->validate([
            '*.product_id' => 'required|integer|exists:products,product_id',
            '*.order_quantity' => 'required|integer|min:1',
            '*.order_subtotal' => 'required|numeric|min:0',
            '*.order_tax' => 'required|numeric|min:0',
            '*.order_discount' => 'required|numeric|min:0',
            '*.order_total' => 'required|numeric|min:0',
            '*.order_payment' => 'required|numeric|min:0',
            '*.order_change' => 'required|numeric|min:0',
            '*.order_status' => 'required|string',
            '*.order_payment_method' => 'required|string|in:cash,gcash,grabf,foodp',
            '*.is_grilled' => 'sometimes|boolean',
            '*.cook_id' => 'sometimes|integer|nullable',
        ]);

        try {
            // Start transaction
            DB::beginTransaction();
            
            // Get next order ID
            $lastOrder = Order::max('order_id');
            $nextOrderId = $lastOrder ? $lastOrder + 1 : 1;
            
            // Get today's date for cook data
            $today = Carbon::now()->toDateString();
            
            // Process each order item
            foreach ($request->all() as $orderItem) {
                // Check if this is a grilled product
                $isGrilled = isset($orderItem['is_grilled']) && $orderItem['is_grilled'] === true && isset($orderItem['cook_id']);
                
                if ($isGrilled) {
                    // Check cook availability for grilled products
                    $cook = Cook::where('cook_id', $orderItem['cook_id'])
                        ->where('date', $today)
                        ->first();
                    
                    if (!$cook || $cook->cook_available < $orderItem['order_quantity']) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Not enough grilled stock for product ID: {$orderItem['product_id']}",
                            'available' => $cook ? $cook->cook_available : 0,
                            'requested' => $orderItem['order_quantity']
                        ], 422);
                    }
                } else {
                    // Check product availability for non-grilled products
                    $product = Product::findOrFail($orderItem['product_id']);
                    if ($product->product_qty < $orderItem['order_quantity']) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Not enough stock for product: {$product->product_name}",
                            'available' => $product->product_qty,
                            'requested' => $orderItem['order_quantity']
                        ], 422);
                    }
                }
                
                // Normalize payment method name
                if ($orderItem['order_payment_method'] === 'grabf') {
                    $orderItem['order_payment_method'] = 'grabfood';
                } elseif ($orderItem['order_payment_method'] === 'foodp') {
                    $orderItem['order_payment_method'] = 'foodpanda';
                }
                
                // Create order
                Order::create([
                    'order_id' => $nextOrderId,
                    'product_id' => $orderItem['product_id'],
                    'order_quantity' => $orderItem['order_quantity'],
                    'order_subtotal' => $orderItem['order_subtotal'],
                    'order_tax' => $orderItem['order_tax'],
                    'order_discount' => $orderItem['order_discount'],
                    'order_total' => $orderItem['order_total'],
                    'order_payment' => $orderItem['order_payment'],
                    'order_change' => $orderItem['order_change'],
                    'order_status' => $orderItem['order_status'],
                    'order_payment_method' => $orderItem['order_payment_method'],
                ]);
                
                // Update inventory based on product type
                if ($isGrilled) {
                    // Update cook available and leftover for grilled products
                    $cook = Cook::where('cook_id', $orderItem['cook_id'])
                        ->where('date', $today)
                        ->first();
                    
                    if ($cook) {
                        // Decrement both cook_available and cook_leftover
                        $cook->cook_available = max(0, $cook->cook_available - $orderItem['order_quantity']);
                        $cook->cook_leftover = max(0, $cook->cook_leftover - $orderItem['order_quantity']);
                        $cook->save();
                    }
                } else {
                    // Update regular product inventory
                    $product = Product::findOrFail($orderItem['product_id']);
                    $product->decrement('product_qty', $orderItem['order_quantity']);
                }
            }
            
            // Commit transaction
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'order_id' => $nextOrderId
            ], 200);
            
        } catch (\Exception $e) {
            // Rollback transaction on error
            DB::rollBack();
            Log::error('Order creation failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order: ' . $e->getMessage()
            ], 500);
        }
    }
}