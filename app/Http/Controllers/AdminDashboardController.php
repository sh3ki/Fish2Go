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
        $categoryData = DB::table('orders')
            ->join('products', 'orders.product_id', '=', 'products.id')
            ->select('products.product_category as name', DB::raw('SUM(orders.quantity) as value'))
            ->groupBy('products.product_category')
            ->get();

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
}
