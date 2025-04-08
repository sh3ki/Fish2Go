<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Inventory;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AdminInventoryController extends Controller
{
    public function index()
    {
        try {
            // Get all inventory items instead of paginating
            $inventory = Inventory::latest()->get()->map(function ($item) {
                return [
                    'inventory_id' => $item->inventory_id,
                    'inventory_name' => $item->inventory_name,
                    'inventory_qty' => $item->inventory_qty,
                    'inventory_price' => $item->inventory_price,
                    'inventory_image' => $item->inventory_image, // Don't add prefix here
                    'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
                ];
            });
        
            // Cache the 10 newest items for 7 days
            $newestItems = Cache::remember('newest_items', now()->addDays(7), function () {
                return Inventory::latest()->take(10)->get()->map(function ($item) {
                    return [
                        'inventory_id' => $item->inventory_id,
                        'inventory_name' => $item->inventory_name,
                        'inventory_qty' => $item->inventory_qty,
                        'inventory_price' => $item->inventory_price,
                        'inventory_image' => $item->inventory_image, // Don't add prefix here
                        'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
                    ];
                });
            });
        
            return Inertia::render('admin_inventory', [
                'inventory' => [
                    'data' => $inventory, // Return all inventory items
                    'total' => $inventory->count(),
                ],
                'newestItems' => $newestItems,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in inventory index: ' . $e->getMessage());
            return Inertia::render('admin_inventory', [
                'inventory' => [
                    'data' => [],
                    'total' => 0,
                ],
                'newestItems' => [],
                'flash' => [
                    'error' => 'Failed to load inventory data.'
                ]
            ]);
        }
    }

    public function fetch(Request $request)
    {
        try {
            // Get search term if provided
            $search = $request->query('search');
            
            // Start building the query
            $query = Inventory::latest();
            
            // Apply search filter if provided
            if ($search) {
                $query->where('inventory_name', 'LIKE', "%{$search}%");
            }
            
            // Execute query and get all inventory items
            $inventory = $query->get();
            
            // Transform inventory data similar to how products are transformed
            $inventoryData = $inventory->map(function ($item) {
                return [
                    'inventory_id' => $item->inventory_id,
                    'inventory_name' => $item->inventory_name,
                    'inventory_qty' => $item->inventory_qty,
                    'inventory_price' => $item->inventory_price,
                    'inventory_image' => $item->inventory_image, // Don't add prefix here
                    'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
                ];
            });
            
            // Get newest items
            $newestItems = Cache::remember('newest_items', now()->addDays(7), function () {
                return Inventory::latest()->take(10)->get()->map(function ($item) {
                    return [
                        'inventory_id' => $item->inventory_id,
                        'inventory_name' => $item->inventory_name,
                        'inventory_qty' => $item->inventory_qty,
                        'inventory_price' => $item->inventory_price,
                        'inventory_image' => $item->inventory_image, // Don't add prefix here
                        'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
                    ];
                });
            });

            return response()->json([
                'inventory' => [
                    'data' => $inventoryData,
                    'total' => $inventory->count(),
                ],
                'newestItems' => $newestItems,
                'status' => 'success'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in fetchInventory: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch inventory data',
                'error' => $e->getMessage(),
                'status' => 'error'
            ], 500);
        }
    }

    public function store(Request $request) {
        $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0',
            'item_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'price' => 'required|numeric|min:0',
        ]);

        $filename = null;
        
        if ($request->hasFile('item_image')) {
            $file = $request->file('item_image');
            $extension = $file->getClientOriginalExtension();
            
            // Use inventory name directly as filename (preserving case)
            $filename = $request->input('name') . '.' . $extension;
            
            // Store in inventory folder with exact name
            Storage::disk('public')->putFileAs(
                'inventory', 
                $file, 
                $filename
            );
            
            // Save just the filename without the path
            $imagePath = $filename;
        } else {
            // Default image path is just the name with .png extension
            $imagePath = $request->input('name') . '.png';
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
            'quantity' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'item_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $inventory = Inventory::findOrFail($id);

        // Handle image upload if a new image is provided
        if ($request->hasFile('item_image')) {
            $file = $request->file('item_image');
            $extension = $file->getClientOriginalExtension();
            
            // If there's an existing image, delete it from storage
            if ($inventory->inventory_image) {
                Storage::disk('public')->delete('inventory/' . $inventory->inventory_image);
            }
            
            // Use inventory name directly as filename (preserving case)
            $filename = $validated['name'] . '.' . $extension;
            
            // Store the new image
            Storage::disk('public')->putFileAs(
                'inventory', 
                $file, 
                $filename
            );
            
            // Save just the filename without the path
            $inventory->inventory_image = $filename;
        } 
        // If name changed but image remains the same, rename the image file
        else if ($inventory->inventory_name !== $validated['name'] && $inventory->inventory_image) {
            try {
                $oldPath = 'inventory/' . $inventory->inventory_image;
                $extension = pathinfo($inventory->inventory_image, PATHINFO_EXTENSION);
                $newFilename = $validated['name'] . '.' . $extension;
                $newPath = 'inventory/' . $newFilename;
                
                // Check if the old file exists and rename it
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->move($oldPath, $newPath);
                }
                
                // Update the database with just the filename
                $inventory->inventory_image = $newFilename;
            } catch (\Exception $e) {
                // Log the error but don't halt the update
                Log::error('Error renaming inventory image: ' . $e->getMessage());
            }
        }

        // Update the inventory fields
        $inventory->inventory_name = $validated['name'];
        $inventory->inventory_qty = $validated['quantity'];
        $inventory->inventory_price = $validated['price'];
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
            Storage::disk('public')->delete('inventory/' . $inventory->inventory_image);
        }

        $inventory->delete();

        // Clear the cache for newest items
        Cache::forget('newest_items');

        return response()->json(['message' => 'Inventory item deleted successfully!']);
    }

}
