<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('product_name');
            $table->decimal('product_price', 10, 2);
            $table->integer('product_quantity');
            $table->string('product_category');
            $table->string('product_image')->nullable();
            $table->enum('notification_status', ['unread', 'read'])->default('unread'); // New column
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('products');
    }
};
