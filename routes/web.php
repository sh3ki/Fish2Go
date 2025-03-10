<?php

use App\Http\Controllers\AdminDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia; // Correct the import
use App\Http\Controllers\StaffDashboardController; // Add this line
use App\Http\Controllers\AdminInventoryController; // Add this line
use App\Http\Controllers\AdminProductController; // Add this line
use App\Http\Controllers\StaffInventoryController; // Add this line
use App\Http\Controllers\StaffProductController; // Add this line
use App\Http\Controllers\OrderController; // Add this line

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['admin'])->group(function () {
    Route::get('admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard'); 
    Route::get('admin/inventory', [AdminInventoryController::class, 'index'])->name('admin.inventory'); 
    Route::get('admin/products', [AdminProductController::class, 'index'])->name('admin.products'); 

   //products
    Route::get('/admin/products', [AdminProductController::class, 'index'])->name('admin.products');
    Route::post('/admin/products/store', [AdminProductController::class, 'store'])->name('admin.products.store');
    Route::post('/admin/products/uploadTempImage', [AdminProductController::class, 'uploadTempImage'])->name('admin.products.uploadTempImage');
    
    Route::get('/admin/inventory', [AdminInventoryController::class, 'index'])->name('admin.inventory');
    Route::post('/admin/inventory/store', [AdminInventoryController::class, 'store'])->name('admin.inventory.store');
});

Route::middleware(['staff'])->group(function () {
    Route::get('staff/pos', [StaffDashboardController::class, 'index'])->name('staff.pos'); 
    Route::get('staff/inventory', [StaffInventoryController::class, 'index'])->name('staff.inventory'); 
    Route::get('staff/products', [StaffProductController::class, 'index'])->name('staff.products'); 
    Route::post('/staff/checkout', [StaffDashboardController::class, 'store'])->name('staff.checkout');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';