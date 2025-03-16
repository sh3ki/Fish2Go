<?php

use App\Http\Controllers\AdminDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\StaffDashboardController;
use App\Http\Controllers\AdminInventoryController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\StaffInventoryController;
use App\Http\Controllers\StaffProductController;
use App\Http\Controllers\StaffOrderController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminSalesController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// ...existing code...

Route::middleware(['admin'])->group(function () {
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/inventory', [AdminInventoryController::class, 'index'])->name('admin.inventory');

    // products
    Route::get('/admin/products', [AdminProductController::class, 'index'])->name('admin.products');
    Route::post('/admin/products/store', [AdminProductController::class, 'store'])->name('admin.products.store');
    Route::put('/admin/products/{id}', [AdminProductController::class, 'update'])->name('admin.products.update');
    Route::delete('/admin/products/{id}', [AdminProductController::class, 'destroy'])->name('admin.products.destroy');
    Route::get('/admin/products/realtime', [AdminProductController::class, 'getProducts'])->name('admin.products.realtime');
    Route::post('/admin/products/uploadTempImage', [AdminProductController::class, 'uploadTempImage'])->name('admin.products.uploadTempImage');
    Route::get('/api/products', [AdminProductController::class, 'getProducts']);
    Route::get('/api/category-data', [AdminDashboardController::class, 'getCategoryData']);
    Route::get('/api/sales-data', [AdminDashboardController::class, 'getSalesData']);
    Route::get('/api/orders', [AdminSalesController::class, 'getAllOrders']); // New route for fetching all orders
    Route::get('/api/total-sales', [AdminDashboardController::class, 'getTotalSales']); // New route for fetching total sales

    Route::get('/admin/inventory', [AdminInventoryController::class, 'index'])->name('admin.inventory');
    Route::post('/admin/inventory/store', [AdminInventoryController::class, 'store'])->name('admin.inventory.store');
    Route::delete('/admin/inventory/{id}', [AdminInventoryController::class, 'destroy'])->name('admin.inventory.destroy');

    // notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsRead']);

    Route::get('/admin/sales', [AdminSalesController::class, 'index'])->name('admin.sales');
});

// ...existing code...

Route::middleware(['staff'])->group(function () {
    Route::get('/staff/pos', [StaffDashboardController::class, 'index'])->name('staff.pos');
    Route::get('/staff/inventory', [StaffInventoryController::class, 'index'])->name('staff.inventory');
    Route::get('/staff/products', [StaffProductController::class, 'index'])->name('staff.products');
    Route::post('/staff/checkout', [StaffDashboardController::class, 'store'])->name('staff.checkout');

    // orders

    Route::get('/staff/orders', [StaffOrderController::class, 'index'])->name('staff.orders.index');
    Route::post('/staff/orders/store', [StaffOrderController::class, 'store'])->name('staff.orders.store');
    
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';