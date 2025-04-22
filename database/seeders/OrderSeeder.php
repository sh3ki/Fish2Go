<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $paymentMethods = ['cash', 'gcash', 'grabfood', 'foodpanda'];
        $products = DB::table('products')->pluck('product_id');
        
        $orderEntries = [];
        
        // Start with most recent date for highest order_id
        $baseDate = Carbon::now();
        
        // Create 200 unique orders (in reverse order to ensure chronology)
        for ($orderId = 200; $orderId >= 1; $orderId--) {
            // Each order is 3-8 hours older than the previous one
            // This ensures unique timestamps that maintain chronology
            $hoursOffset = rand(3, 8);
            $baseDate = (clone $baseDate)->subHours($hoursOffset);
            
            // Add minutes/seconds variation for uniqueness
            $createdAt = (clone $baseDate)->addMinutes(rand(0, 59))->addSeconds(rand(0, 59));
            
            // Updated time is 5-30 minutes after creation
            $updatedAt = (clone $createdAt)->addMinutes(rand(5, 30));
            
            // Generate between 1 and 5 product entries per order
            $numProducts = rand(1, 5);
            $orderSubtotal = 0;
            $selectedProducts = $products->random($numProducts);
            
            foreach ($selectedProducts as $productId) {
                $quantity = rand(1, 10);
                $itemSubtotal = rand(100, 500);
                $orderSubtotal += $itemSubtotal;
                
                $orderEntries[] = [
                    'order_id' => $orderId,
                    'product_id' => $productId,
                    'order_quantity' => $quantity,
                    'order_subtotal' => $itemSubtotal,
                    'order_tax' => 0, // Will calculate total tax at the end
                    'order_discount' => 0, // Will calculate total discount at the end
                    'order_total' => 0, // Will calculate final total at the end
                    'order_payment' => 0, // Will set for the last item
                    'order_change' => 0, // Will set for the last item
                    'order_status' => 'completed',
                    'order_payment_method' => $paymentMethods[array_rand($paymentMethods)],
                    'created_at' => $createdAt->toDateTimeString(),
                    'updated_at' => $updatedAt->toDateTimeString(),
                ];
            }
            
            // Calculate total tax, discount, payment and change for this order
            $orderTax = round($orderSubtotal * 0.12, 2); // Assuming 12% tax
            $orderDiscount = rand(0, 100);
            $orderTotal = $orderSubtotal + $orderTax - $orderDiscount;
            $orderPayment = $orderTotal + rand(0, 200); // Some extra cash given
            $orderChange = $orderPayment - $orderTotal;
            
            // Update the last entry for this order with the complete details
            $lastIndex = count($orderEntries) - 1;
            $orderEntries[$lastIndex]['order_tax'] = $orderTax;
            $orderEntries[$lastIndex]['order_discount'] = $orderDiscount;
            $orderEntries[$lastIndex]['order_total'] = $orderTotal;
            $orderEntries[$lastIndex]['order_payment'] = $orderPayment;
            $orderEntries[$lastIndex]['order_change'] = $orderChange;
        }

        // Insert all orders into database
        DB::table('orders')->insert($orderEntries);
    }
}
