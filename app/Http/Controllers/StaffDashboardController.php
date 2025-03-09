<?php

namespace App\Http\Controllers;
use Inertia\Inertia; // Add this line
use Illuminate\Http\Request;

class StaffDashboardController extends Controller
{
   public function index()
   {
       return Inertia::render('staff_pos');
   }
}
