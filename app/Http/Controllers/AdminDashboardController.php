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
        $today = now()->toDateString();
        
        // Get count data
        $totalProducts = Product::count();
        $totalInventory = Inventory::count();
        $staffUsers = User::where('usertype', 'staff')->get();
        
        // Get financial data for today
        $totalSales = Order::whereDate('created_at', $today)->sum('order_total');
        $totalExpense = DB::table('expenses')->whereDate('created_at', $today)->sum('amount');
        $totalCash = $totalSales - $totalExpense;
        $totalDeposited = DB::table('summaries')->whereDate('created_at', $today)->sum('total_deposited');
        
        // Get payment method breakdowns
        $cashSales = Order::where('order_payment_method', 'cash')->whereDate('created_at', $today)->sum('order_total');
        $gcashSales = Order::where('order_payment_method', 'gcash')->whereDate('created_at', $today)->sum('order_total');
        $grabfoodSales = Order::where('order_payment_method', 'grabfood')->whereDate('created_at', $today)->sum('order_total');
        $foodpandaSales = Order::where('order_payment_method', 'foodpanda')->whereDate('created_at', $today)->sum('order_total');

        return Inertia::render('dashboard', [
            'totalProducts' => $totalProducts,
            'totalInventory' => $totalInventory,
            'staffUsers' => $staffUsers,
            'todayFinancials' => [
                'totalSales' => $totalSales,
                'totalExpense' => $totalExpense,
                'totalCash' => $totalCash,
                'totalDeposited' => $totalDeposited,
                'cashSales' => $cashSales,
                'gcashSales' => $gcashSales,
                'grabfoodSales' => $grabfoodSales,
                'foodpandaSales' => $foodpandaSales,
            ],
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
                ->select('order_payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(order_total) as total'))
                ->when($month, function ($query, $month) {
                    $query->whereMonth('created_at', $month);
                })
                ->when($year, function ($query, $year) {
                    $query->whereYear('created_at', $year);
                })
                ->whereIn('order_payment_method', $paymentMethods)
                ->groupBy('order_payment_method')
                ->get();

            $totalCount = $results->sum('count');

            $data = [];
            foreach ($paymentMethods as $method) {
                $methodData = $results->firstWhere('order_payment_method', $method);
                $count = $methodData->count ?? 0;
                $total = $methodData->total ?? 0;
                $percentage = $totalCount > 0 ? ($count / $totalCount) * 100 : 0;

                $data[$method] = [
                    'count' => $count,
                    'total' => $total,
                    'percentage' => $percentage,
                ];
            }

            return response()->json($data);
        } catch (\Exception $e) {
            \Log::error('Error fetching payment percentages: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch payment percentages'], 500);
        }
    }
}
