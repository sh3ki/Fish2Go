<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Expense;
use App\Models\Summary;
use Illuminate\Support\Facades\DB;

class AdminExpensesController extends Controller
{
    public function index()
    {
        return Inertia::render('admin_expenses');
    }

    /**
     * Get expenses with pagination, date range, and user filter for admin
     */
    public function getExpenses(Request $request)
    {
        $page = $request->input('page', 1);
        $limit = $request->input('limit', 25);
        $offset = ($page - 1) * $limit;

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $userId = $request->input('user_id');

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

        if ($startDate && $endDate) {
            $expenseQuery->whereBetween('expenses.date', [
                date('Y-m-d', strtotime($startDate)),
                date('Y-m-d', strtotime($endDate))
            ]);
        }

        if ($userId && $userId !== "all") {
            $expenseQuery->where('expenses.user_id', $userId);
        }

        $totalCount = $expenseQuery->count();

        $expenses = $expenseQuery
            ->orderBy('expenses.date', 'desc')
            ->orderBy('expenses.created_at', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get()
            ->map(function ($expense) {
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

    /**
     * Get all users for filter dropdown
     */
    public function getExpenseUsers()
    {
        $users = DB::table('users')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => (string)$user->id,
                    'name' => $user->name
                ];
            });
        return response()->json($users);
    }

    public function destroy($id)
    {
        try {
            $expense = Expense::findOrFail($id);
            $expenseDate = $expense->date;
            $amount = $expense->amount;
            $expense->delete();

            // Update summary table: subtract the deleted expense amount
            $summary = Summary::firstOrNew(['date' => $expenseDate]);
            $summary->total_expenses = max(0, ($summary->total_expenses ?? 0) - $amount);
            // Optionally update net sales if you want to keep it in sync
            $summary->total_net_sales = ($summary->total_gross_sales ?? 0) - ($summary->total_expenses ?? 0);
            $summary->save();

            return response()->json([
                'message' => 'Expense deleted successfully!'
            ], 200);
        } catch (\Exception $e) {
            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json([
                    'message' => 'Expense not found!'
                ], 404);
            }

            return response()->json([
                'message' => 'Failed to delete expense. Please try again.'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:0',
                'description' => 'required|string|max:255',
                'title' => 'required|string|max:255',
                // Add other required fields here
            ]);

            $expense = new \App\Models\Expense();
            $expense->amount = $validated['amount'];
            $expense->description = $validated['description'];
            $expense->title = $validated['title'];
            // Set user_id to the currently authenticated admin
            $expense->user_id = $request->user()->id;
            // Optionally set date if provided, else use today
            if ($request->has('date')) {
                $expense->date = $request->input('date');
            } else {
                $expense->date = now()->toDateString();
            }
            // Set other fields as needed

            $expense->save();

            // Update summary table: add the new expense amount
            $summary = Summary::firstOrNew(['date' => $expense->date]);
            $summary->total_expenses = ($summary->total_expenses ?? 0) + $expense->amount;
            // Optionally update net sales if you want to keep it in sync
            $summary->total_net_sales = ($summary->total_gross_sales ?? 0) - ($summary->total_expenses ?? 0);
            $summary->save();

            return response()->json(['success' => true, 'expense' => $expense], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Expense store error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Server error'], 500);
        }
    }
}
