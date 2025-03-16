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
        $date = $request->input('date');
        $orders = DB::table('orders')
            ->whereDate('created_at', $date)
            ->paginate(10);

        foreach ($orders as $order) {
            $order->items = json_decode($order->items, true);
           
        }

        return response()->json($orders);
    }
}
