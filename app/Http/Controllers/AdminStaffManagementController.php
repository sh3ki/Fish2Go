<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AdminStaffManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('admin_staffmanagement');
    }
}
