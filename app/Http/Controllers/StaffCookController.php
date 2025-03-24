<?php

namespace App\Http\Controllers;
Use Inertia\Inertia;
use Illuminate\Http\Request;

class StaffCookController extends Controller
{
    public function index()
    {
        return Inertia::render('staff_cook');
    }
}
