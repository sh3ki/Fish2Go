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
     * Get transactions with product details for lazy loading
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function getTransactions(Request $request)
    {
        // Get pagination parameters
        $page = $request->input('page', 1);
        $limit = $request->input('limit', 20); // Default to 20 if not specified
        $offset = ($page - 1) * $limit;

        // Get date range parameters
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        
        // Get the order subquery with date filtering if provided
        $orderSubquery = DB::table('orders')
            ->select('order_id', DB::raw('MAX(created_at) as latest_date'))
            ->groupBy('order_id');
            
        // Apply date range filter if provided
        if ($startDate && $endDate) {
            // Format the end date to include the entire day
            $formattedEndDate = date('Y-m-d 23:59:59', strtotime($endDate));
            
            $orderSubquery->whereBetween('created_at', [
                date('Y-m-d 00:00:00', strtotime($startDate)),
                $formattedEndDate
            ]);
        }

        // Get the total count with the same date filters
        $totalCountQuery = DB::table('orders')
            ->distinct();
            
        if ($startDate && $endDate) {
            $formattedEndDate = date('Y-m-d 23:59:59', strtotime($endDate));
            
            $totalCountQuery->whereBetween('created_at', [
                date('Y-m-d 00:00:00', strtotime($startDate)),
                $formattedEndDate
            ]);
        }
            
        $totalCount = $totalCountQuery->count('order_id');

        // Get paginated order IDs
        $orderIds = DB::table(DB::raw("({$orderSubquery->toSql()}) as subquery"))
            ->mergeBindings($orderSubquery)
            ->orderBy('latest_date', 'desc')
            ->skip($offset)
            ->take($limit)
            ->pluck('order_id');
        
        // If no orders found, return empty result with pagination metadata
        if ($orderIds->isEmpty()) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'current_page' => (int)$page,
                    'per_page' => (int)$limit,
                    'total' => $totalCount,
                    'has_more' => ($offset + $limit) < $totalCount
                ]
            ]);
        }
        
        // Get orders with their related products for these IDs
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
            ->whereIn('orders.order_id', $orderIds)
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
        
        // Convert to array
        $ordersArray = array_values($groupedOrders);
        
        return response()->json([
            'data' => $ordersArray,
            'meta' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => $totalCount,
                'has_more' => ($offset + $limit) < $totalCount
            ]
        ]);
    }
}
