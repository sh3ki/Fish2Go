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
        $date = $request->input('date', now()->toDateString()); // Default to today's date if not provided
        $orders = DB::table('orders')
            ->whereRaw('created_at::date = ?', [$date]) // Use PostgreSQL-specific date casting
            ->paginate(10);

        // Debug log to verify query results
        if ($orders->isEmpty()) {
            \Log::info("No orders found for date: $date");
        }

        return response()->json($orders);
    }
}
