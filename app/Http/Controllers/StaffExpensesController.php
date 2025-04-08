<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Expense;

class StaffExpensesController extends Controller
{
    public function index()
    {
        $expenses = Expense::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc') // Use 'created_at' to ensure the most recent entries are at the top
            ->get();

        return Inertia::render('staff_expenses', [
            'expenses' => $expenses,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
        ]);

        try {
            Expense::create([
                'user_id' => auth()->id(),
                'title' => $validated['title'],
                'description' => $validated['description'],
                'amount' => $validated['amount'],
                'date' => now(),
            ]);

            if ($request->wantsJson()) {
                return response()->json(['message' => 'Expense saved successfully.'], 200);
            }

            return redirect()->back()->with('success', 'Expense saved successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Failed to save expense. Please try again.'], 500);
            }

            return redirect()->back()->with('error', 'Failed to save expense. Please try again.');
        }
    }
}
