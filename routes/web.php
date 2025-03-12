<?php

use App\Http\Controllers\AdminDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia; // Correct the import
use App\Http\Controllers\StaffDashboardController; 
use App\Http\Controllers\AdminInventoryController; 
use App\Http\Controllers\AdminProductController; 
use App\Http\Controllers\StaffInventoryController; 
use App\Http\Controllers\StaffProductController; 
use App\Http\Controllers\StaffOrderController; 
use App\Http\Controllers\NotificationController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['admin'])->group(function () {
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard'); 
    Route::get('/admin/inventory', [AdminInventoryController::class, 'index'])->name('admin.inventory'); 

   //products
    Route::get('/admin/products', [AdminProductController::class, 'index'])->name('admin.products');
    Route::post('/admin/products/store', [AdminProductController::class, 'store'])->name('admin.products.store');
    Route::post('/admin/products/uploadTempImage', [AdminProductController::class, 'uploadTempImage'])->name('admin.products.uploadTempImage');
    Route::get('/api/products', [AdminProductController::class, 'getProducts']); // Real-time to be followed
    //api for category distribution
    Route::get('/api/category-data', [AdminDashboardController::class, 'getCategoryData']);
    //api for sales data
    Route::get('/api/sales-data', [AdminDashboardController::class, 'getSalesData']);
    
    Route::get('/admin/inventory', [AdminInventoryController::class, 'index'])->name('admin.inventory');
    Route::post('/admin/inventory/store', [AdminInventoryController::class, 'store'])->name('admin.inventory.store');

    //notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsRead']);
});

Route::middleware(['staff'])->group(function () {
    Route::get('/staff/pos', [StaffDashboardController::class, 'index'])->name('staff.pos'); 
    Route::get('/staff/inventory', [StaffInventoryController::class, 'index'])->name('staff.inventory'); 
    Route::get('/staff/products', [StaffProductController::class, 'index'])->name('staff.products'); 
    Route::post('/staff/checkout', [StaffDashboardController::class, 'store'])->name('staff.checkout');

    //orders
    Route::post('/staff/orders', [StaffOrderController::class, 'store'])->name('staff.orders.store');
    Route::post('/staff/orders/store', [StaffOrderController::class, 'store'])->name('staff.orders.store');
    Route::get('/staff/orders', [StaffOrderController::class, 'index'])->name('staff.orders.index');
    
 
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';