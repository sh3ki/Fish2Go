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

    public function getSalesData(Request $request)
    {
        try {
            $month = $request->query('month');
            $year = $request->query('year');

            $salesData = Order::selectRaw('DATE(created_at) as date, SUM(order_total) as sales')
                ->when($month, function ($query, $month) {
                    $query->whereMonth('created_at', $month);
                })
                ->when($year, function ($query, $year) {
                    $query->whereYear('created_at', $year);
                })
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json($salesData);
        } catch (\Exception $e) {
            \Log::error('Error fetching sales data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch sales data'], 500);
        }
    }

    public function getProductSalesData(Request $request)
    {
        try {
            $month = $request->query('month');
            $year = $request->query('year');

            $data = DB::table('products')
                ->join('orders', 'products.product_id', '=', 'orders.product_id')
                ->select('products.product_name', DB::raw('SUM(orders.order_total) as total_sales'))
                ->when($month, function ($query, $month) {
                    $query->whereMonth('orders.created_at', $month);
                })
                ->when($year, function ($query, $year) {
                    $query->whereYear('orders.created_at', $year);
                })
                ->groupBy('products.product_id', 'products.product_name')
                ->orderBy('total_sales', 'desc')
                ->get();

            return response()->json($data);
        } catch (\Exception $e) {
            \Log::error('Error fetching product sales data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch product sales data'], 500);
        }
    }

    public function paymentMethodPercentages(Request $request)
    {
        try {
            $month = $request->query('month');
            $year = $request->query('year');

            $paymentMethods = ['cash', 'gcash', 'foodpanda', 'grabfood'];
            $results = DB::table('orders')
                ->select('order_payment_method', DB::raw('COUNT(*) as count'))
                ->when($month, function ($query, $month) {
                    $query->whereMonth('created_at', $month);
                })
                ->when($year, function ($query, $year) {
                    $query->whereYear('created_at', $year);
                })
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
        } catch (\Exception $e) {
            \Log::error('Error fetching payment percentages: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch payment percentages'], 500);
        }
    }
}
