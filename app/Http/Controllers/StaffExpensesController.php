<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class StaffExpensesController extends Controller
{
    public function index()
    {
        // Get today's date for default filter
        $today = Carbon::today()->toDateString();
        
        // Get all expenses with user information
        $expenses = Expense::with('user:id,name')
            ->select('expenses.*')
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($expense) {
                return [
                    'id' => $expense->id,
                    'date' => $expense->date->format('Y-m-d'),
                    'formatted_date' => $expense->date->format('M d, Y'),
                    'user_id' => $expense->user_id,
                    'username' => $expense->user->name,
                    'title' => $expense->title,
                    'description' => $expense->description,
                    'amount' => number_format($expense->amount, 2),
                    'raw_amount' => $expense->amount,
                    'created_at' => $expense->created_at
                ];
            });

        return Inertia::render('staff_expenses', [
            'expenses' => $expenses,
            'today' => $today,
            'current_user_id' => Auth::id(),
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
            $expense = Expense::create([
                'user_id' => auth()->id(),
                'title' => $validated['title'],
                'description' => $validated['description'],
                'amount' => $validated['amount'],
                'date' => $validated['date'],
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Expense saved successfully.',
                    'expense' => $expense
                ], 200);
            }

            return redirect()->back()->with('success', 'Expense saved successfully.');
        } catch (\Exception $e) {
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
