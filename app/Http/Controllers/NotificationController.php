<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use App\Models\Product;

class NotificationController extends Controller {
    public function index() {
        $lowStockProducts = Product::where('product_quantity', '<', 10)
        ->select('id', 'product_name', 'product_quantity', 'notification_status')
        ->orderBy('id', 'desc')
        ->get()
        ->map(function ($product) {
            // Check if a timestamp already exists in the cache
            $cacheKey = "low_stock_timestamp_{$product->id}";
            if (!Cache::has($cacheKey)) {
                // Store the current timestamp in the cache (first time it drops below 10)
                Cache::put($cacheKey, now(), 86400*7); // Store for 1 day (adjust as needed)
            }
            return [
                'id' => $product->id,
                'product_name' => $product->product_name,
                'product_quantity' => $product->product_quantity,
                'notification_status' => $product->notification_status,
                'created_at' => Cache::get($cacheKey), // Retrieve stored timestamp
            ];
        });

        
    return response()->json($lowStockProducts);
    }

    public function markAsRead() {
        // Update all unread notifications to read
        $updatedRows = Product::where('notification_status', 'unread')->update(['notification_status' => 'read']);
    
        // Fetch updated notifications from the database
        $updatedNotifications = Product::where('product_quantity', '<', 9)
            ->select('id', 'product_name', 'product_quantity', 'notification_status')
            ->get();
    
        // Debug: Check if notifications actually got updated
        \Log::info("Updated notifications: ", $updatedNotifications->toArray());
    
        return response()->json([
            'message' => "$updatedRows notifications marked as read",
            'status' => 'success',
            'notifications' => $updatedNotifications,
        ]);
    }      
}
