<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class NotificationController extends Controller {
    public function index() {
        $lowStockProducts = Product::where('product_quantity', '<', 9)
            ->select('id', 'product_name', 'product_quantity', 'notification_status')
            ->get();

        return response()->json($lowStockProducts);
    }

    public function markAsRead() {
        // Update ALL unread notifications to read
        $updatedRows = Product::where('notification_status', 'unread')->update(['notification_status' => 'read']);
    
        if ($updatedRows > 0) {
            return response()->json(['message' => "$updatedRows notifications marked as read", 'status' => 'success']);
        } else {
            return response()->json(['message' => 'No unread notifications found', 'status' => 'error']);
        }
    }
}