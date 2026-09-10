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
        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('zone')->index();
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->unsignedInteger('stock_quantity')->default(0);
            $table->unsignedInteger('average_weight'); // in grams, e.g. 2100 for 2.10 kg
            $table->boolean('active')->default(true)->index();
            $table->timestamps();

            $table->index(['active', 'zone']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shops');
    }
};
