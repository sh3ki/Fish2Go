<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StaffProductController extends Controller
{
    public function index()
    {
        return Inertia::render('staff_product');
    }

    /**
     * Get products with their sold quantities and inventory status
     * filtered by date range from product_sold table
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getProducts(Request $request)
    {
        // Get date range from request
        $startDate = $request->input('startDate') ? Carbon::parse($request->input('startDate'))->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $endDate = $request->input('endDate') ? Carbon::parse($request->input('endDate'))->endOfDay() : Carbon::now()->endOfDay();

        // Query products from products table and join with categories
        $products = Product::leftJoin('categories', 'products.category_id', '=', 'categories.category_id')
            ->select(
                'products.product_id',
                'products.product_name',
                'products.product_price',
                'products.product_image',
                'products.category_id',
                'categories.category_name',
                'categories.category_color' // Add category color to the result
            )
            ->orderBy('products.product_id', 'asc')
            ->get();

        // Get aggregated data from product_sold for the selected date range
        $productSoldData = DB::table('product_sold')
            ->select(
                'product_id', 
                DB::raw('SUM(product_qty) as total_qty'), 
                DB::raw('SUM(product_sold) as total_sold')
            )
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        // Format product data with joined product_sold data and calculate status
        $formattedProducts = $products->map(function ($product) use ($productSoldData) {
            // Get the sold data for this product from the aggregated results
            $soldData = $productSoldData->get($product->product_id);
            
            // Use values from product_sold table if available, otherwise default to 0
            $qty = $soldData ? $soldData->total_qty : 0;
            $sold = $soldData ? $soldData->total_sold : 0;
            
            // Calculate status based on quantity from product_sold
            $status = $this->getProductStatusText($qty);
            
            return [
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'product_price' => $product->product_price,
                'product_qty' => $qty, // Use qty from product_sold table
                'product_image' => $product->product_image ? 'products/' . $product->product_image : null,
                'category_id' => $product->category_id,
                'category_name' => $product->category_name ?? 'Uncategorized',
                'category_color' => $product->category_color, // Add category color to the formatted data
                'sold' => (int)$sold, // Use sold from product_sold table
                'status' => $status,
                'status_code' => $this->getStatusCode($qty),
            ];
        });

        // Get all categories for filter options
        $categories = Category::select('category_id', 'category_name')->get();

        if ($request->wantsJson()) {
            // Return JSON response for API requests
            return response()->json([
                'products' => $formattedProducts,
                'categories' => $categories,
                'dateRange' => [
                    'startDate' => $startDate->format('Y-m-d'),
                    'endDate' => $endDate->format('Y-m-d')
                ]
            ]);
        }
    
        // Return an Inertia response for Inertia requests
        return Inertia::render('staff_product', [
            'products' => $formattedProducts,
            'categories' => $categories,
            'dateRange' => [
                'startDate' => $startDate->format('Y-m-d'),
                'endDate' => $endDate->format('Y-m-d')
            ]
        ]);
    }

    /**
     * Get user-friendly status text based on quantity (same as in staff_inventory)
     * @param int $qty
     * @return string
     */
    private function getProductStatusText($qty)
    {
        if ($qty >= 30) return "High Stock";
        if ($qty >= 10) return "In Stock";
        if ($qty >= 5) return "Low Stock";
        if ($qty === 0) return "Out of Stock";
        return "Backorder";
    }

    /**
     * Get status code for styling 
     * @param int $qty
     * @return string
     */
    private function getStatusCode($qty)
    {
        if ($qty >= 30) return "high"; 
        if ($qty >= 10) return "instock";
        if ($qty >= 5) return "low";
        if ($qty === 0) return "outofstock";
        return "backorder";
    }
}
