<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Inventory;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class AdminInventoryController extends Controller
{
    public function index()
    {
        $inventory = Inventory::latest()->paginate(10); // Paginate latest 10 entries

        // Cache the 10 newest items for 7 days
        $newestItems = Cache::remember('newest_items', now()->addDays(7), function () {
            return Inventory::latest()->take(10)->get();
        });

        return Inertia::render('admin_inventory', [
            'inventory' => $inventory,
            'newestItems' => $newestItems,
        ]);
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

        $inventory = Inventory::create([
            'name' => $request->name,
            'quantity' => $request->quantity,
            'item_image' => $imagePath,
        ]);

        // Clear the cache for newest items
        Cache::forget('newest_items');

        return response()->json(['inventory' => $inventory, 'message' => 'Inventory added successfully!']);
    }

    public function destroy($id)
    {
        $inventory = Inventory::findOrFail($id);

        if ($inventory->item_image) {
            Storage::disk('public')->delete($inventory->item_image);
        }

        $inventory->delete();

        // Clear the cache for newest items
        Cache::forget('newest_items');

        return response()->json(['message' => 'Inventory item deleted successfully!']);
    }
}
