<?php

use App\Http\Controllers\AdminDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia; // Correct the import
use App\Http\Controllers\StaffDashboardController; // Add this line

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['admin'])->group(function () {
    Route::get('admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard'); 
});

    Route::middleware(['staff'])->group(function () {
        Route::get('staff/dashboard', [StaffDashboardController::class, 'index'])->name('staff.dashboard'); 
    });


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';