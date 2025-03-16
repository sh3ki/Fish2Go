<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

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

    public function getCategoryData()
    {
        $orders = DB::table('orders')->select('items')->get();
        $categoryData = [];

        foreach ($orders as $order) {
            $items = json_decode($order->items, true);
            foreach ($items as $item) {
                $category = $item['category'];
                $quantity = $item['quantity'];
                if (!isset($categoryData[$category])) {
                    $categoryData[$category] = 0;
                }
                $categoryData[$category] += $quantity;
            }
        }

        $categoryData = array_map(function ($name, $value) {
            return ['name' => $name, 'value' => $value];
        }, array_keys($categoryData), $categoryData);

        return response()->json($categoryData);
    }

    public function getSalesData()
    {
        $salesData = DB::table('orders')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as sales'))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy(DB::raw('DATE(created_at)'))
            ->get();

        return response()->json($salesData);
    }

    public function getTotalSales()
    {
        $totalSales = DB::table('orders')->sum('total');
        return response()->json(['total' => $totalSales]);
    }
}
