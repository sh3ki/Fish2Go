<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

//Admin Controllers
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminSalesController;
use App\Http\Controllers\AdminInventoryController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\AdminMessagesController;
use App\Http\Controllers\AdminExpensesController;
use App\Http\Controllers\AdminStaffManagementController;
use App\Http\Controllers\AdminPromotionsController;
use App\Http\Controllers\AdminInventoryUsedController;
use App\Http\Controllers\AdminSummaryController;

//Staff Controllers
use App\Http\Controllers\StaffInventoryController;
use App\Http\Controllers\StaffProductController;
use App\Http\Controllers\StaffOrderController;
use App\Http\Controllers\StaffDashboardController;
use App\Http\Controllers\StaffExpensesController;
use App\Http\Controllers\StaffCookController;
use App\Http\Controllers\StaffTransactionController;
use App\Http\Controllers\StaffDeliveryController;
use App\Http\Controllers\StaffMessagesController;
use App\Http\Controllers\StaffSummaryController;

//Another Controllers
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserlogController;


Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['admin'])->group(function () {
    //Dashboard
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/inventory', [AdminInventoryController::class, 'index'])->name('admin.inventory');
    Route::get('/admin/dashboard/payment-method-percentages', [AdminDashboardController::class, 'paymentMethodPercentages']);

    //Products
    Route::get('/admin/products', [AdminProductController::class, 'index'])->name('admin.products');
    Route::get('/admin/products/newest', [AdminProductController::class, 'fetchNewestProducts'])->name('admin.products.newest');
    Route::get('/admin/products/fetch', [AdminProductController::class, 'fetchProducts'])->name('admin.products.fetch');
    Route::post('/admin/products/store', [AdminProductController::class, 'store'])->name('admin.products.store');
    Route::match(['put', 'post'], '/admin/products/{id}', [AdminProductController::class, 'update'])->name('admin.products.update');
    
    Route::get('/admin/categories', [AdminProductController::class, 'getCategories']);
    Route::delete('/admin/products/{id}', [AdminProductController::class, 'destroy'])->name('admin.products.destroy');
    Route::get('/admin/products/realtime', [AdminProductController::class, 'getProducts'])->name('admin.products.realtime');
    Route::post('/admin/products/uploadTempImage', [AdminProductController::class, 'uploadTempImage'])->name('admin.products.uploadTempImage');
    Route::get('/api/products', [AdminProductController::class, 'getProducts']);

    //Json API for Admin Dashboard
    Route::get('/api/total-sales', [AdminDashboardController::class, 'getTotalSales'])->name('admin.total.sales');
    Route::get('/api/sales-data', [AdminDashboardController::class, 'getSalesData']); // New route for fetching sales data
    Route::get('/api/product-sales-data', [AdminDashboardController::class, 'getProductSalesData']); // New route for fetching product sales data

    Route::get('/api/orders', [AdminSalesController::class, 'getAllOrders']); // New route for fetching all orders
    Route::get('/api/total-sales', [AdminDashboardController::class, 'getTotalSales']); // New route for fetching total sales
    Route::get('/api/user-activity-logs', [AdminDashboardController::class, 'getUserActivityLogs']); // New route for fetching user activity logs
    
    //Inventory
    Route::get('/admin/inventory', [AdminInventoryController::class, 'index'])->name('admin.inventory');
    Route::get('/admin/inventory/fetch', [AdminInventoryController::class, 'fetch'])->name('admin.inventory.fetch');
    Route::post('/admin/inventory/store', [AdminInventoryController::class, 'store'])->name('admin.inventory.store');
    Route::put('/admin/inventory/{id}', [AdminInventoryController::class, 'update'])->name('admin.inventory.update');
    Route::delete('/admin/inventory/{id}', [AdminInventoryController::class, 'destroy'])->name('admin.inventory.destroy');

    //Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsRead']);

    Route::get('/admin/sales', [AdminSalesController::class, 'index'])->name('admin.sales');

    //Messages
    Route::get('/admin/messages', [AdminMessagesController::class, 'index'])->name('admin.messages');

    //Expenses
    Route::get('/admin/expenses', [AdminExpensesController::class, 'index'])->name('admin.expenses');

    //Staff Management  
    Route::get('/admin/staffmanagement', [AdminStaffManagementController::class, 'index'])->name('admin.staff');

    //Promotions
    Route::get('/admin/promotions', [AdminPromotionsController::class, 'index'])->name('admin.promotions');

    //Expenses
    Route::get('/api/expenses', [AdminExpensesController::class, 'getExpenses'])->name('expenses.get');
    Route::delete('/api/expenses/{id}', [AdminExpensesController::class, 'destroy'])->name('expenses.destroy');

    //Summary
    Route::get('/admin/summary', [AdminSummaryController::class, 'index'])->name('admin.summary');
   
});

Route::middleware(['staff'])->group(function () {
    //Pos
    Route::get('/staff/pos', [StaffDashboardController::class, 'index'])->name('staff.pos');
    Route::get('/staff/inventory', [StaffInventoryController::class, 'index'])->name('staff.inventory');
    Route::get('/staff/products', [StaffProductController::class, 'index'])->name('staff.products');
    Route::post('/staff/checkout', [StaffDashboardController::class, 'store'])->name('staff.checkout');

    //Orders
    Route::get('/staff/orders', [StaffOrderController::class, 'index'])->name('staff.orders.index');
    Route::post('/staff/orders/store', [StaffOrderController::class, 'store'])->name('staff.orders.store');

    //Expenses
    Route::get('/staff/expenses', [StaffExpensesController::class, 'index'])->name('staff.expenses'); // Ensure this route exists
    Route::post('/staff/expenses', [StaffExpensesController::class, 'store'])->name('staff.expenses.store');
    
    //Cook
    Route::get('/staff/cook', [StaffCookController::class, 'index'])->name('staff.cook');
    Route::post('/staff/cook/save', [StaffCookController::class, 'save'])->name('staff.cook.save');
    Route::get('/staff/cook/get-cooked', [StaffCookController::class, 'getCookedProducts'])->name('staff.cook.getCooked');

    //Transactions
    Route::get('/staff/transactions', [StaffTransactionController::class, 'index'])->name('staff.transactions');
    Route::get('/staff/transactions/data', [StaffTransactionController::class, 'getTransactions'])->name('staff.transactions.data');

    //Delievery
    Route::get('/staff/delivery', [StaffDeliveryController::class, 'index'])->name('staff.delivery');

    //Messages
    Route::get('/staff/messages', [StaffMessagesController::class, 'index'])->name('staff.messages');

    //Products
    Route::get('/staff/products', [StaffProductController::class, 'getProducts'])->name('staff.products');
    
    //Inventory
    Route::get('/staff/inventory', [StaffInventoryController::class, 'getInventory'])->name('staff.inventory');
    Route::post('/staff/inventory/update', [StaffInventoryController::class, 'updateInventoryUsed'])->name('staff.inventory.update');

     //Summary
     Route::get('/staff/summary', [StaffSummaryController::class, 'index'])->name('staff.summary');
});

// Route::post('/userlog/login', [UserlogController::class, 'logIn']);
// Route::post('/userlog/logout', [UserlogController::class, 'logOut']);
// Route::get('/userlogs', [UserlogController::class, 'index']);



require __DIR__.'/settings.php';
require __DIR__.'/auth.php';