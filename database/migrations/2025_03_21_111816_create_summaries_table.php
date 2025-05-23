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
        Schema::create('summaries', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->decimal('total_gross_sales', 10, 2)->default(0);
            $table->decimal('total_expenses', 10, 2)->default(0);
            $table->decimal('total_net_sales', 10, 2)->default(0);
            $table->decimal('total_walk_in', 10, 2)->default(0);
            $table->decimal('total_gcash', 10, 2)->default(0);
            $table->decimal('total_grabfood', 10, 2)->default(0);
            $table->decimal('total_foodpanda', 10, 2)->default(0);
            $table->decimal('total_register_cash', 10, 2)->default(0);
            $table->decimal('total_deposited', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('summaries');
    }
};
