<?php
namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use App\Models\Product;
use App\Models\Cook;
use App\Models\ProductSold; // Add this import
use App\Models\Summary; // Add this import
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
            '*.update_product_sold' => 'sometimes|boolean', 
        ]);

        try {
            // Start transaction
            DB::beginTransaction();
            
            // Get next order ID
            $lastOrder = Order::max('order_id');
            $nextOrderId = $lastOrder ? $lastOrder + 1 : 1;
            
            // Get today's date
            $today = Carbon::now()->toDateString();
            
            // Get the first order item to extract payment method and total
            // We'll use these for the summary update
            $firstOrderItem = $request->all()[0] ?? null;
            $orderTotal = $firstOrderItem ? $firstOrderItem['order_total'] : 0;
            $paymentMethod = $firstOrderItem ? $firstOrderItem['order_payment_method'] : 'cash';
            
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
                    // For non-grilled products, check ProductSold table for available stock
                    $productSold = ProductSold::where('product_id', $orderItem['product_id'])
                        ->where('date', $today)
                        ->first();
                    
                    if (!$productSold) {
                        // This should not happen as records should be initialized, but handle just in case
                        DB::rollBack();
                        return response()->json([
                            'message' => "Product inventory record not found for today: {$orderItem['product_id']}",
                        ], 422);
                    }
                    
                    // Calculate available stock (product_qty - product_sold)
                    $availableStock = $productSold->product_qty - $productSold->product_sold;
                    
                    if ($availableStock < $orderItem['order_quantity']) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Not enough stock for product ID: {$orderItem['product_id']}",
                            'available' => $availableStock,
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
                        
                        // ADDED: Also update ProductSold to track all sales including grilled items
                        $productSold = ProductSold::where('product_id', $orderItem['product_id'])
                            ->where('date', $today)
                            ->first();
                        
                        if ($productSold) {
                            // Increment the product_sold count for reporting purposes
                            $productSold->product_sold += $orderItem['order_quantity'];
                            $productSold->save();
                        }
                    }
                } else {
                    // Update ProductSold table instead of Product table
                    $productSold = ProductSold::where('product_id', $orderItem['product_id'])
                        ->where('date', $today)
                        ->first();
                    
                    if ($productSold) {
                        // Increment the product_sold count
                        $productSold->product_sold += $orderItem['order_quantity'];
                        $productSold->save();
                        
                        Log::info("Updated product_sold record: Product ID {$productSold->product_id}, Sold: {$productSold->product_sold}");
                    } else {
                        // This should not happen, but handle it by finding the product and creating a new record
                        $product = Product::find($orderItem['product_id']);
                        
                        if ($product) {
                            $newProductSold = ProductSold::create([
                                'product_id' => $orderItem['product_id'],
                                'date' => $today,
                                'product_qty' => $orderItem['order_quantity'], // Set initial quantity to what's being sold
                                'product_sold' => $orderItem['order_quantity'] // Start with all being sold
                            ]);
                            
                            Log::info("Created new product_sold record: Product ID {$newProductSold->product_id}, Qty: {$newProductSold->product_qty}, Sold: {$newProductSold->product_sold}");
                        }
                    }
                }
            }
            
            // Commit transaction
            DB::commit();
            
            // After successful order creation, update the summary
            $this->updateDailySummary($orderTotal, $paymentMethod);
            
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
    
    /**
     * Update or create daily summary record
     * 
     * @param float $orderTotal The total amount of the order
     * @param string $paymentMethod The payment method used
     */
    private function updateDailySummary($orderTotal, $paymentMethod)
    {
        try {
            $today = Carbon::today()->toDateString();
            
            // Find or create a summary record for today
            $summary = Summary::where('date', $today)->first();
            
            // If no summary exists, create a new one
            if (!$summary) {
                $summary = new Summary();
                $summary->date = $today;
                $summary->total_gross_sales = 0;
                $summary->total_net_sales = 0;
                $summary->total_walk_in = 0;
                $summary->total_gcash = 0;
                $summary->total_grabfood = 0;
                $summary->total_foodpanda = 0;
                $summary->total_expenses = 0;
                $summary->total_register_cash = 0;
                $summary->total_deposited = 0;
            }
            
            // Add the order total to the appropriate fields
            $summary->total_gross_sales += $orderTotal;
            $summary->total_net_sales += $orderTotal; // Assuming net sales is the same as gross
            $summary->total_register_cash += $orderTotal;
            
            // Normalize payment method from 'grabf' and 'foodp' to full names
            if ($paymentMethod === 'grabf') {
                $paymentMethod = 'grabfood';
            } elseif ($paymentMethod === 'foodp') {
                $paymentMethod = 'foodpanda';
            }
            
            // Update the specific payment method field
            switch (strtolower($paymentMethod)) {
                case 'cash':
                    $summary->total_walk_in += $orderTotal;
                    break;
                case 'gcash':
                    $summary->total_gcash += $orderTotal;
                    break;
                case 'grabfood':
                    $summary->total_grabfood += $orderTotal;
                    break;
                case 'foodpanda':
                    $summary->total_foodpanda += $orderTotal;
                    break;
                default:
                    $summary->total_walk_in += $orderTotal;
            }
            
            // Save the updated summary
            $summary->save();
        } catch (\Exception $e) {
            Log::error('Failed to update summary: ' . $e->getMessage());
        }
    }
}