<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Product;

class NotificationController extends Controller {
    public function index() {
        try {
            $notifications = Product::where('product_qty', '<', 10)  // Now get all products below 10
                ->select('product_id', 'product_name', 'product_image', 'product_price', 'product_qty', 'product_notification', 'created_at')
                ->get();
            // Compute notification_count based on base stock of 8.
            $baseStock = 8;
            $notifications->transform(function($notification) use ($baseStock) {
                $notification->notification_count = max(1, $baseStock - $notification->product_qty);
                return $notification;
            });
            return response()->json($notifications);
        } catch (\Exception $e) {
            \Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch notifications'], 500);
        }
    }

    public function markAsRead() {
        // Update product_notification for all products below 10
        $updatedRows = Product::where('product_qty', '<', 10)  // Removed product_notification filter
            ->update(['product_notification' => 'read']);
    
        // Fetch updated notifications from the database
        $updatedNotifications = Product::where('product_qty', '<', 10)
            ->select('product_id', 'product_name', 'product_image', 'product_price', 'product_qty', 'product_notification', 'created_at')
            ->get();
    
        // Compute the notification_count similarly for updated notifications.
        $baseStock = 8;
        $updatedNotifications->transform(function($notification) use ($baseStock) {
            $notification->notification_count = max(1, $baseStock - $notification->product_qty);
            return $notification;
        });
    
        // Debug: Check if notifications actually got updated
        \Log::info("Updated notifications: ", $updatedNotifications->toArray());
    
        return response()->json([
            'message' => "$updatedRows notifications marked as read",
            'status' => 'success',
            'notifications' => $updatedNotifications,
        ]);
    }      
}
