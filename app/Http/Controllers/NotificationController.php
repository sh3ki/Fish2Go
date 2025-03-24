<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Product;

class NotificationController extends Controller {
    public function index() {
        try {
            $notifications = Product::where('product_notification', 'unread')
                ->where('product_qty', '<', 10)  // ✅ Filter products with low stock
                ->select('product_id', 'product_name', 'product_image', 'product_price', 'product_qty', 'product_notification', 'created_at')
                ->get();
            return response()->json($notifications);
        } catch (\Exception $e) {
            \Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch notifications'], 500);
        }
    }

    public function markAsRead() {
        // Update all unread notifications to read
        $updatedRows = Product::where('product_notification', 'unread')
            ->where('product_qty', '<', 10)  // ✅ Filter products with low stock
            ->update(['product_notification' => 'read']);
    
        // Fetch updated notifications from the database
        $updatedNotifications = Product::where('product_qty', '<', 10)
            ->select('product_id', 'product_name', 'product_image', 'product_price', 'product_qty', 'product_notification')
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
