<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;
use App\Models\Order;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $totalProducts = Product::count();
        $totalInventory = Inventory::count();
        $staffUsers = User::where('usertype', 'staff')->get();

        return Inertia::render('dashboard', [
            'totalProducts' => $totalProducts,
            'totalInventory' => $totalInventory,
            'staffUsers' => $staffUsers,
        ]);
    }

    public function getTotalSales()
    {
        try {
            $totalSales = Order::sum('order_total');
            return response()->json(['total' => $totalSales]);
        } catch (\Exception $e) {
            \Log::error('Error fetching total sales: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch total sales'], 500);
        }
    }

    public function getSalesData()
    {
        try {
            $salesData = Order::selectRaw('DATE(created_at) as date, SUM(order_total) as sales')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Format the date to ensure it's in a valid format (Y-m-d)
            $salesData = $salesData->map(function ($item) {
                $item->date = date('Y-m-d', strtotime($item->date));
                return $item;
            });

            return response()->json($salesData);
        } catch (\Exception $e) {
            \Log::error('Error fetching sales data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch sales data'], 500);
        }
    }

    public function getProductSalesData()
    {
        try {
            $data = DB::table('products')
                ->join('orders', 'products.product_id', '=', 'orders.product_id')
                ->select('products.product_name', DB::raw('SUM(orders.order_total) as total_sales'))
                ->groupBy('products.product_id', 'products.product_name')
                ->orderBy('total_sales', 'desc')
                ->get();

            return response()->json($data);
        } catch (\Exception $e) {
            \Log::error('Error fetching product sales data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch product sales data'], 500);
        }
    }

    public function paymentMethodPercentages()
    {
        $paymentMethods = ['cash', 'gcash', 'foodpanda', 'grabfood'];
        $results = \DB::table('orders')
            ->select('order_payment_method', \DB::raw('COUNT(*) as count'))
            ->whereIn('order_payment_method', $paymentMethods)
            ->groupBy('order_payment_method')
            ->pluck('count', 'order_payment_method');
            
        $total = array_sum($results->toArray());
        
        $data = [];
        foreach ($paymentMethods as $method) {
             $count = isset($results[$method]) ? $results[$method] : 0;
             $percentage = $total > 0 ? ($count / $total) * 100 : 0;
             $data[$method] = ['count' => $count, 'percentage' => $percentage];
        }
        
        return response()->json($data);
    }
}
