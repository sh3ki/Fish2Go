<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;

class StaffSummaryController extends Controller
{
    public function index()
    {
        return Inertia::render('staff_summary');
    }
}
