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
            'inventory' => [
                'data' => $inventory->items(), // Ensure it's an array
                'current_page' => $inventory->currentPage(),
                'last_page' => $inventory->lastPage(),
            ],
            'newestItems' => $newestItems,
        ]);
    }

    public function fetchInventory()
    {
        $inventory = Inventory::latest()->paginate(10);

        $newestItems = Cache::remember('newest_items', now()->addDays(7), function () {
            return Inventory::latest()->take(10)->get();
        });

        return response()->json([
            'inventory' => [
                'data' => $inventory->getCollection()->map(function ($item) {
                    return [
                        'inventory_id' => $item->inventory_id,
                        'inventory_name' => $item->inventory_name,
                        'inventory_qty' => $item->inventory_qty,
                        'inventory_price' => $item->inventory_price,
                        'inventory_image' => $item->inventory_image,
                        'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
                    ];
                }),
                'current_page' => $inventory->currentPage(),
                'last_page' => $inventory->lastPage(),
            ],
            'newestItems' => $newestItems,
        ]);
    }

    public function store(Request $request) {
        $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'item_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'price' => 'required|numeric|min:0',
        ]);

        $imagePath = null;
        if ($request->hasFile('item_image')) {
            $imagePath = $request->file('item_image')->store('inventory', 'public'); // Store in storage/app/public/inventory
        }

        $inventory = new Inventory();
        $inventory->inventory_name = $request->input('name');
        $inventory->inventory_qty = $request->input('quantity');
        $inventory->inventory_image = $imagePath;
        $inventory->inventory_price = $request->input('price');
        $inventory->save();

        // Clear the cache for newest items
        Cache::forget('newest_items');

        return response()->json(['inventory' => $inventory, 'message' => 'Inventory added successfully!']);
    }

    public function update(Request $request, $id)
    {
        // Validate incoming request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'item_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $inventory = Inventory::findOrFail($id);

        // Process image if provided; delete old image if exists
        if ($request->hasFile('item_image')) {
            if ($inventory->inventory_image) {
                Storage::disk('public')->delete($inventory->inventory_image);
            }
            $validated['item_image'] = $request->file('item_image')->store('inventory', 'public');
        } else {
            $validated['item_image'] = $inventory->inventory_image;
        }

        // Update the inventory fields
        $inventory->inventory_name = $validated['name'];
        $inventory->inventory_qty = $validated['quantity'];
        $inventory->inventory_price = $validated['price'];
        $inventory->inventory_image = $validated['item_image'];
        $inventory->save();

        // Clear cache for newest items
        Cache::forget('newest_items');

        return response()->json([
            'inventory' => $inventory,
            'message' => 'Inventory updated successfully!'
        ]);
    }

    public function destroy($id)
    {
        $inventory = Inventory::findOrFail($id);

        if ($inventory->inventory_image) {
            Storage::disk('public')->delete($inventory->inventory_image);
        }

        $inventory->delete();

        // Clear the cache for newest items
        Cache::forget('newest_items');

        return response()->json(['message' => 'Inventory item deleted successfully!']);
    }
}
