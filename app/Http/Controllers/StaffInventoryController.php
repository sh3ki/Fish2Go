<?php
namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Inventory; // Ensure the Inventory model is imported

class StaffInventoryController extends Controller
{
    public function index()
    {
        // Render the Inertia page
        return Inertia::render('staff_inventory');
    }

    public function getInventory(Request $request)
    {
        if ($request->wantsJson()) {
            // Return JSON response for API requests
            return response()->json(Inventory::all()->map(function ($item) {
                return [
                    'inventory_id' => $item->inventory_id,
                    'inventory_name' => $item->inventory_name,
                    'inventory_qty' => $item->inventory_qty,
                    'inventory_price' => $item->inventory_price,
                    'inventory_image' => $item->inventory_image ? 'inventory/' . $item->inventory_image : null,
                    'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
                ];
            }));
        }

        // Return an Inertia response for Inertia requests
        return Inertia::render('staff_inventory', [
            'inventory' => Inventory::all()->map(function ($item) {
                return [
                    'inventory_id' => $item->inventory_id,
                    'inventory_name' => $item->inventory_name,
                    'inventory_qty' => $item->inventory_qty,
                    'inventory_price' => $item->inventory_price,
                    'inventory_image' => $item->inventory_image ? 'inventory/' . $item->inventory_image : null,
                    'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
                ];
            }),
        ]);
    }
}