<?php

namespace App\Http\Controllers;
use inertia\inertia;
use Illuminate\Http\Request;

class StaffExpensesController extends Controller
{
    public function index ()
    {
        return Inertia::render('staff_expenses');
    }
}
