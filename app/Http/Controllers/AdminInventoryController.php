<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Inventory;
use Illuminate\Support\Facades\Storage;

class AdminInventoryController extends Controller
{
    public function index()
    {
        $inventory = Inventory::latest()->paginate(10); // Paginate latest 10 entries
        return Inertia::render('admin_inventory', ['inventory' => $inventory]);
    }

    public function store(Request $request) {
        $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'item_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('item_image')) {
            $imagePath = $request->file('item_image')->store('inventory', 'public'); // Store in storage/app/public/inventory
        }
        

        Inventory::create([
            'name' => $request->name,
            'quantity' => $request->quantity,
            'item_image' => $imagePath,
        ]);

        return redirect()->route('admin.inventory')->with('success', 'Inventory added successfully!');
    }
}
