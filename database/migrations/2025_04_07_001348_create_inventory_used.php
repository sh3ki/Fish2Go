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
        Schema::create('inventory_used', function (Blueprint $table) {
            $table->id('inventory_used_id');
            $table->unsignedBigInteger('inventory_id');
            $table->date('date');
            $table->integer('inventory_used');
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('inventory_id')->references('inventory_id')->on('inventory')->onDelete('cascade');
            $table->unique(['inventory_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_used');
    }
};
