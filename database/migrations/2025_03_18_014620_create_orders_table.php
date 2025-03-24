<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id(column: 'id');
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedInteger('order_quantity'); 
            $table->decimal('order_subtotal', 10, 2);
            $table->decimal('order_tax', 10, 2);
            $table->decimal('order_discount', 10, 2);
            $table->decimal('order_total', 10, 2); 
            $table->decimal('order_payment', 10, 2);
            $table->decimal('order_change', 10, 2);
            $table->string('order_status');
            $table->enum('order_payment_method', ['cash', 'gcash', 'grabfood', 'foodpanda']);
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
            $table->timestamps(); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
