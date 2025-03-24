<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AdminMessagesController extends Controller
{
    public function index()
    {
        return Inertia::render('admin_messages');
    }
}
