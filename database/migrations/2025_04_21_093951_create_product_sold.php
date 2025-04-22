<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_sold', function (Blueprint $table) {
            $table->id('product_sold_id');
            $table->date('date');
            $table->unsignedBigInteger('product_id');
            $table->integer('product_qty');
            $table->integer('product_sold');
            $table->timestamps();
            
            // Foreign key relationship
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_sold');
    }
};
