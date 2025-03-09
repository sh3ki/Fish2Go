<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Inventory;

class AdminInventoryController extends Controller
{
    public function index()
    {
        return Inertia::render('admin_inventory');
    }

 
    public function store(Request $request) {
        $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
        ]);
    
        Inventory::create($request->all());
    
        return redirect()->route('admin.inventory')->with('success', 'Inventory added successfully!');
    }
}