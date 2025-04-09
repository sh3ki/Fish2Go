<?php

namespace App\Http\Controllers;

use inertia\inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSummaryController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->input('date', now()->toDateString()); // Default to today's date

        // Compute total_sales
        $total_sales = DB::table('orders')->whereDate('created_at', $date)->sum('order_total');

        // Compute total_expense
        $total_expense = DB::table('expenses')->whereDate('created_at', $date)->sum('amount');

        // Compute total_income
        $total_income = $total_sales - $total_expense;

        // Compute payment method totals
        $total_cash = DB::table('orders')->where('order_payment_method', 'cash')->whereDate('created_at', $date)->sum('order_total');
        $total_gcash = DB::table('orders')->where('order_payment_method', 'gcash')->whereDate('created_at', $date)->sum('order_total');
        $total_grabfood = DB::table('orders')->where('order_payment_method', 'grabfood')->whereDate('created_at', $date)->sum('order_total');
        $total_foodpanda = DB::table('orders')->where('order_payment_method', 'foodpanda')->whereDate('created_at', $date)->sum('order_total');

        // Pass data to the view
        return inertia('admin_summary', [
            'total_sales' => $total_sales,
            'total_income' => $total_income,
            'total_expense' => $total_expense,
            'total_cash' => $total_cash,
            'total_gcash' => $total_gcash,
            'total_grabfood' => $total_grabfood,
            'total_foodpanda' => $total_foodpanda,
            'date' => $date, // Include the date in the response
        ]);
    }
}
