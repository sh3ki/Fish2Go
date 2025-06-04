<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Summary;

class AdminSummaryController extends Controller
{
    public function index(Request $request)
    {
        // Date range for table and cards
        $start_date = $request->input('start_date', now()->subDays(6)->toDateString());
        $end_date = $request->input('end_date', now()->toDateString());

        // For cards: get the most recent summary in range (today if available)
        $summary = Summary::whereBetween('date', [$start_date, $end_date])
            ->orderBy('date', 'desc')
            ->first();

        $summaryData = $summary ? $summary->toArray() : [
            'total_gross_sales' => 0,
            'total_expenses' => 0,
            'total_net_sales' => 0,
            'total_walk_in' => 0,
            'total_gcash' => 0,
            'total_grabfood' => 0,
            'total_foodpanda' => 0,
            'total_deposited' => 0,
        ];

        // For table: all summaries in range
        $summaries = Summary::whereBetween('date', [$start_date, $end_date])
            ->orderBy('date', 'desc')
            ->get();

        return inertia('admin_summary', [
            'initialStats' => [
                'total_gross_sales' => $summaryData['total_gross_sales'] ?? 0,
                'total_expenses' => $summaryData['total_expenses'] ?? 0,
                'total_net_sales' => $summaryData['total_net_sales'] ?? 0,
                'total_deposited' => $summaryData['total_deposited'] ?? 0,
                'total_walk_in' => $summaryData['total_walk_in'] ?? 0,
                'total_gcash' => $summaryData['total_gcash'] ?? 0,
                'total_grabfood' => $summaryData['total_grabfood'] ?? 0,
                'total_foodpanda' => $summaryData['total_foodpanda'] ?? 0,
                'start_date' => $start_date,
                'end_date' => $end_date,
            ],
            'summaries' => $summaries
        ]);
    }

    // AJAX endpoint for cards and table (like staff_summary)
    public function getStats(Request $request)
    {
        $start_date = $request->input('start_date', now()->subDays(6)->toDateString());
        $end_date = $request->input('end_date', now()->toDateString());

        $summaries = Summary::whereBetween('date', [$start_date, $end_date])
            ->orderBy('date', 'desc')
            ->get();

        $totals = [
            'total_gross_sales' => $summaries->sum('total_gross_sales'),
            'total_expenses' => $summaries->sum('total_expenses'),
            'total_net_sales' => $summaries->sum('total_net_sales'),
            'total_deposited' => $summaries->sum('total_deposited'),
            'total_walk_in' => $summaries->sum('total_walk_in'),
            'total_gcash' => $summaries->sum('total_gcash'),
            'total_grabfood' => $summaries->sum('total_grabfood'),
            'total_foodpanda' => $summaries->sum('total_foodpanda'),
        ];

        return response()->json([
            ...$totals,
            'summaries' => $summaries
        ]);
    }
}
