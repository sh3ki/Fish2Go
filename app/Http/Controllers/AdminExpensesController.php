<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Expense;

class AdminExpensesController extends Controller
{
    public function index()
    {
        return Inertia::render('admin_expenses');
    }

    public function getExpenses()
    {
        $expenses = Expense::with('user')->orderBy('date', 'desc')->get();
        return response()->json($expenses);
    }

    public function destroy($id)
    {
        try {
            $expense = Expense::findOrFail($id);
            $expense->delete();
            
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

    
}
