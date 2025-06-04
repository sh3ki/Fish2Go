<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminSalesController extends Controller
{
    public function index()
    {
        return Inertia::render('admin_sales');
    }

    public function getAllOrders(Request $request)
    {
        // Pagination parameters
        $page = $request->input('page', 1);
        $limit = $request->input('limit', 25); // Default to 25 per batch
        $offset = ($page - 1) * $limit;

        // Date range parameters
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Subquery for order_id and latest created_at
        $orderSubquery = DB::table('orders')
            ->select('order_id', DB::raw('MAX(created_at) as latest_date'))
            ->groupBy('order_id');

        if ($startDate && $endDate) {
            $formattedEndDate = date('Y-m-d 23:59:59', strtotime($endDate));
            $orderSubquery->whereBetween('created_at', [
                date('Y-m-d 00:00:00', strtotime($startDate)),
                $formattedEndDate
            ]);
        }

        // Total count for pagination
        $totalCountQuery = DB::table('orders')->distinct();
        if ($startDate && $endDate) {
            $formattedEndDate = date('Y-m-d 23:59:59', strtotime($endDate));
            $totalCountQuery->whereBetween('created_at', [
                date('Y-m-d 00:00:00', strtotime($startDate)),
                $formattedEndDate
            ]);
        }
        $totalCount = $totalCountQuery->count('order_id');

        // Paginated order IDs
        $orderIds = DB::table(DB::raw("({$orderSubquery->toSql()}) as subquery"))
            ->mergeBindings($orderSubquery)
            ->orderBy('latest_date', 'desc')
            ->skip($offset)
            ->take($limit)
            ->pluck('order_id');

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
            $groupedOrders[$orderKey]['products'][] = [
                'product_id' => $order->product_id,
                'product_name' => $order->product_name,
                'product_price' => $order->product_price,
                'product_image' => $order->product_image,
                'order_quantity' => $order->order_quantity,
                'amount' => $order->product_price * $order->order_quantity
            ];
        }

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
