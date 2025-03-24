<?php

namespace App\Http\Controllers;
use inertia\Inertia;
use Illuminate\Http\Request;

class StaffMessagesController extends Controller
{
    public function index()
    {
        return Inertia::render('staff_messages');
    }
}
