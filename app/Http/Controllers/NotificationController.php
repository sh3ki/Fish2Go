<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductNotification;

class NotificationController extends Controller {
    public function index() {
        $lowStockProducts = Product::where('product_quantity', '<', 9)
            ->select('id', 'product_name', 'product_quantity')
            ->get();

        return response()->json($lowStockProducts);
    }

    public function markAsRead($id) {
        $notification = ProductNotification::where('product_id', $id)->first();
        if ($notification) {
            $notification->status = 'read';
            $notification->save();
        }

        return response()->json(['message' => 'Notification marked as read']);
    }
}
