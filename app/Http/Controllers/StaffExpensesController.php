<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Expense;
use App\Models\Summary;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StaffExpensesController extends Controller
{
    public function index()
    {
        // Simplified to match the transactions controller pattern
        return Inertia::render('staff_expenses', [
            'today' => Carbon::today()->toDateString(),
            'current_user_id' => Auth::id(),
        ]);
    }

    /**
     * Get expenses with pagination for lazy loading
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function getExpenses(Request $request)
    {
        // Get pagination parameters
        $page = $request->input('page', 1);
        $limit = $request->input('limit', 25); // Changed from 15 to 25
        $offset = ($page - 1) * $limit;
        
        // Get date range parameters
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        
        // Base query for expenses - similar to transaction controller pattern
        $expenseQuery = DB::table('expenses')
            ->join('users', 'expenses.user_id', '=', 'users.id')
            ->select(
                'expenses.id',
                'expenses.title',
                'expenses.description',
                'expenses.amount',
                'expenses.date',
                'expenses.created_at',
                'expenses.user_id',
                'users.name as username'
            );
            
        // Apply date range filter if provided
        if ($startDate && $endDate) {
            $formattedEndDate = date('Y-m-d 23:59:59', strtotime($endDate));
            
            $expenseQuery->whereBetween('expenses.date', [
                date('Y-m-d', strtotime($startDate)),
                date('Y-m-d', strtotime($endDate))
            ]);
        }

        // Get total count with the same filters
        $totalCount = $expenseQuery->count();

        // Get paginated expenses - strict pagination
        $expenses = $expenseQuery
            ->orderBy('expenses.date', 'desc')
            ->orderBy('expenses.created_at', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get()
            ->map(function ($expense) {
                // Format expenses for frontend display
                return [
                    'id' => $expense->id,
                    'date' => $expense->date,
                    'formatted_date' => date('M d, Y', strtotime($expense->date)),
                    'user_id' => $expense->user_id,
                    'username' => $expense->username,
                    'title' => $expense->title,
                    'description' => $expense->description,
                    'amount' => number_format($expense->amount, 2),
                    'raw_amount' => (float)$expense->amount,
                    'created_at' => $expense->created_at
                ];
            });
        
        // Debug logging
        \Log::info("Expenses batch loaded", [
            'page' => $page,
            'limit' => $limit,
            'count' => count($expenses),
            'total' => $totalCount,
            'has_more' => ($offset + $limit) < $totalCount
        ]);
        
        // Return with pagination info matching the transaction controller format
        return response()->json([
            'data' => $expenses,
            'meta' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => $totalCount,
                'has_more' => ($offset + $limit) < $totalCount
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
        ]);

        try {
            // Begin transaction to ensure data consistency
            DB::beginTransaction();
            
            // Create the expense record
            $expense = Expense::create([
                'user_id' => auth()->id(),
                'title' => $validated['title'],
                'description' => $validated['description'],
                'amount' => $validated['amount'],
                'date' => $validated['date'],
            ]);

            // Update or create the summary record for this date
            $expenseDate = $validated['date'];
            $expenseAmount = (float)$validated['amount'];
            
            // Try to find summary record for this date
            $summary = Summary::firstOrNew(['date' => $expenseDate]);
            
            // If it's a new record, initialize with zeros
            if (!$summary->exists) {
                $summary->total_gross_sales = 0;
                $summary->total_net_sales = 0;
                $summary->total_walk_in = 0;
                $summary->total_gcash = 0;
                $summary->total_grabfood = 0;
                $summary->total_foodpanda = 0;
                $summary->total_register_cash = 0;
                $summary->total_deposited = 0;
                $summary->total_expenses = $expenseAmount;
            } else {
                // Add the new expense to existing total
                $summary->total_expenses += $expenseAmount;
                // Recalculate net sales
                $summary->total_net_sales = $summary->total_gross_sales - $summary->total_expenses;
            }
            
            // Save the summary record
            $summary->save();
            
            // Commit the transaction
            DB::commit();
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Expense saved successfully.',
                    'expense' => $expense
                ], 200);
            }

            return redirect()->back()->with('success', 'Expense saved successfully.');
        } catch (\Exception $e) {
            // Roll back the transaction in case of error
            DB::rollBack();
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Failed to save expense: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->back()->with('error', 'Failed to save expense: ' . $e->getMessage());
        }
    }
}
