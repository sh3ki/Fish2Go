<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class StaffTransactionController extends Controller
{
    public function index()
    {
        return Inertia::render('staff_transaction');
    }

    /**
     * Get all transactions with product details
     * 
     * @return \Illuminate\Http\Response
     */
    public function getTransactions()
    {
        // Get orders with their related products
        $orders = DB::table('orders')
            ->select(
                'orders.order_id',
                'orders.order_subtotal',
                'orders.order_tax',
                'orders.order_discount',
                'orders.order_total',
                'orders.order_payment',
                'orders.order_change',
                'orders.order_payment_method',
                'orders.created_at',
                'products.product_id',
                'products.product_name',
                'products.product_price',
                'products.product_image',
                'orders.order_quantity'
            )
            ->join('products', 'orders.product_id', '=', 'products.product_id')
            ->orderBy('orders.created_at', 'desc')
            ->get();
        
        // Group by order_id
        $groupedOrders = [];
        foreach ($orders as $order) {
            $orderKey = $order->order_id;
            
            if (!isset($groupedOrders[$orderKey])) {
                $groupedOrders[$orderKey] = [
                    'order_id' => $order->order_id,
                    'order_subtotal' => $order->order_subtotal,
                    'order_tax' => $order->order_tax,
                    'order_discount' => $order->order_discount,
                    'order_total' => $order->order_total,
                    'order_payment' => $order->order_payment,
                    'order_change' => $order->order_change,
                    'order_payment_method' => $order->order_payment_method,
                    'created_at' => $order->created_at,
                    'products' => []
                ];
            }
            
            // Add product information
            $groupedOrders[$orderKey]['products'][] = [
                'product_id' => $order->product_id,
                'product_name' => $order->product_name,
                'product_price' => $order->product_price,
                'product_image' => $order->product_image,
                'order_quantity' => $order->order_quantity,
                'amount' => $order->product_price * $order->order_quantity
            ];
        }
        
        return response()->json(array_values($groupedOrders));
    }
}
