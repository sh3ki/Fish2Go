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
        $products = DB::table('products')->pluck('product_id'); // Assuming 'id' is the primary key in 'products'

        $orders = [];
        for ($i = 1; $i <= 20; $i++) {
            $orders[] = [
                'order_id' => $i,
                'product_id' => $products->random(),
                'order_quantity' => rand(1, 10),
                'order_subtotal' => rand(100, 1000),
                'order_tax' => rand(10, 100),
                'order_discount' => rand(0, 50),
                'order_total' => rand(150, 1200),
                'order_payment' => rand(150, 1200),
                'order_change' => rand(0, 50),
                'order_status' => 'completed',
                'order_payment_method' => $paymentMethods[array_rand($paymentMethods)],
                'created_at' => Carbon::now()->subDays(rand(1, 30))->toDateTimeString(),
                'updated_at' => Carbon::now()->toDateTimeString(),
            ];
        }

        DB::table('orders')->insert($orders);
    }
}
