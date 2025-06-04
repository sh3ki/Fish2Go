<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\Summary;
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
        
        // Get today's summary from summary table
        $todaySummary = Summary::where('date', $today)->first();
        
        if ($todaySummary) {
            // Use summary data if available
            $todayFinancials = [
                'totalSales' => $todaySummary->total_gross_sales,
                'totalExpense' => $todaySummary->total_expenses,
                'totalCash' => $todaySummary->total_net_sales,
                'totalDeposited' => $todaySummary->total_deposited,
                'cashSales' => $todaySummary->total_walk_in,
                'gcashSales' => $todaySummary->total_gcash,
                'grabfoodSales' => $todaySummary->total_grabfood,
                'foodpandaSales' => $todaySummary->total_foodpanda,
            ];
        } else {
            // Fallback to calculating directly from orders/expenses if no summary exists
            $totalSales = Order::whereDate('created_at', $today)->sum('order_total');
            $totalExpense = DB::table('expenses')->whereDate('created_at', $today)->sum('amount');
            $totalCash = $totalSales - $totalExpense;
            $totalDeposited = DB::table('summaries')->whereDate('created_at', $today)->sum('total_deposited');
            
            $cashSales = Order::where('order_payment_method', 'cash')->whereDate('created_at', $today)->sum('order_total');
            $gcashSales = Order::where('order_payment_method', 'gcash')->whereDate('created_at', $today)->sum('order_total');
            $grabfoodSales = Order::where('order_payment_method', 'grabfood')->whereDate('created_at', $today)->sum('order_total');
            $foodpandaSales = Order::where('order_payment_method', 'foodpanda')->whereDate('created_at', $today)->sum('order_total');
            
            $todayFinancials = [
                'totalSales' => $totalSales,
                'totalExpense' => $totalExpense,
                'totalCash' => $totalCash,
                'totalDeposited' => $totalDeposited,
                'cashSales' => $cashSales,
                'gcashSales' => $gcashSales,
                'grabfoodSales' => $grabfoodSales,
                'foodpandaSales' => $foodpandaSales,
            ];
        }

        return Inertia::render('dashboard', [
            'totalProducts' => $totalProducts,
            'totalInventory' => $totalInventory,
            'staffUsers' => $staffUsers,
            'todayFinancials' => $todayFinancials,
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

    // Add a new endpoint for fetching today's data separately (like in StaffSummaryController)
    public function getTodayStats(Request $request)
    {
        $date = $request->input('date', now()->toDateString());
        
        // Try to get data from summary table first
        $summary = Summary::where('date', $date)->first();
        
        if ($summary) {
            // Return data from summary record if it exists
            return response()->json([
                'totalSales' => $summary->total_gross_sales,
                'totalExpense' => $summary->total_expenses,
                'totalCash' => $summary->total_net_sales,
                'totalDeposited' => $summary->total_deposited,
                'cashSales' => $summary->total_walk_in,
                'gcashSales' => $summary->total_gcash,
                'grabfoodSales' => $summary->total_grabfood,
                'foodpandaSales' => $summary->total_foodpanda,
            ]);
        }
        
        // Fallback to calculating directly if no summary record exists
        $totalSales = Order::whereDate('created_at', $date)->sum('order_total');
        $totalExpense = DB::table('expenses')->whereDate('created_at', $date)->sum('amount');
        $totalCash = $totalSales - $totalExpense;
        $totalDeposited = DB::table('summaries')->whereDate('created_at', $date)->sum('total_deposited');
        
        // Get payment method breakdowns
        $cashSales = Order::where('order_payment_method', 'cash')->whereDate('created_at', $date)->sum('order_total');
        $gcashSales = Order::where('order_payment_method', 'gcash')->whereDate('created_at', $date)->sum('order_total');
        $grabfoodSales = Order::where('order_payment_method', 'grabfood')->whereDate('created_at', $date)->sum('order_total');
        $foodpandaSales = Order::where('order_payment_method', 'foodpanda')->whereDate('created_at', $date)->sum('order_total');

        return response()->json([
            'totalSales' => $totalSales,
            'totalExpense' => $totalExpense,
            'totalCash' => $totalCash,
            'totalDeposited' => $totalDeposited,
            'cashSales' => $cashSales,
            'gcashSales' => $gcashSales,
            'grabfoodSales' => $grabfoodSales,
            'foodpandaSales' => $foodpandaSales,
        ]);
    }

    /**
     * Get just the card data for AJAX refreshing - optimized for frequent calls
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function getCardData(Request $request)
    {
        $date = $request->input('date', now()->toDateString());
        
        // Try to get data from summary table first - lightweight query
        $summary = Summary::where('date', $date)
            ->first(['total_gross_sales', 'total_expenses', 'total_net_sales', 'total_deposited', 
                    'total_walk_in', 'total_gcash', 'total_grabfood', 'total_foodpanda']);
        
        if ($summary) {
            // Return only fields needed for cards
            return response()->json([
                'totalSales' => $summary->total_gross_sales,
                'totalExpense' => $summary->total_expenses,
                'totalCash' => $summary->total_net_sales,
                'totalDeposited' => $summary->total_deposited,
                'cashSales' => $summary->total_walk_in, 
                'gcashSales' => $summary->total_gcash,
                'grabfoodSales' => $summary->total_grabfood,
                'foodpandaSales' => $summary->total_foodpanda,
            ]);
        }
        
        // Fallback to direct calculation if no summary exists
        return response()->json([
            'totalSales' => 0,
            'totalExpense' => 0,
            'totalCash' => 0,
            'totalDeposited' => 0,
            'cashSales' => 0,
            'gcashSales' => 0,
            'grabfoodSales' => 0,
            'foodpandaSales' => 0,
        ]);
    }

    /**
     * Get sales chart data from the summary table based on date range
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function getSalesChartData(Request $request)
    {
        try {
            $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
            $endDate = $request->input('end_date', now()->toDateString());

            // Get summary data within the date range including expense data
            $summaries = Summary::whereBetween('date', [$startDate, $endDate])
                ->orderBy('date')
                ->select([
                    'date',
                    'total_gross_sales',
                    'total_net_sales',
                    'total_expenses',
                    'total_walk_in',
                    'total_gcash',
                    'total_grabfood',
                    'total_foodpanda'
                ])
                ->get();

            // If no summaries found, return empty array
            if ($summaries->isEmpty()) {
                return response()->json([]);
            }

            return response()->json($summaries);
        } catch (\Exception $e) {
            \Log::error('Error fetching sales chart data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch sales chart data'], 500);
        }
    }

    /**
     * Get top products by quantity ordered within a date range
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function getTopProducts(Request $request)
    {
        try {
            $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
            $endDate = $request->input('end_date', now()->toDateString());
            $limit = $request->input('limit', 10);

            // Query to get top products by quantity ordered instead of sales amount
            $topProducts = DB::table('orders')
                ->join('products', 'orders.product_id', '=', 'products.product_id')
                ->select(
                    'products.product_id',
                    'products.product_name',
                    DB::raw('SUM(orders.order_quantity) as total_quantity'), // Changed to quantity
                    DB::raw('COUNT(*) as order_count')
                )
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->groupBy('products.product_id', 'products.product_name')
                ->orderByDesc('total_quantity') // Order by quantity
                ->limit($limit)
                ->get();

            return response()->json($topProducts);
        } catch (\Exception $e) {
            \Log::error('Error fetching top products: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch top products data'], 500);
        }
    }
}
