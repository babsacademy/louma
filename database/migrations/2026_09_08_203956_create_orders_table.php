<?php

use App\Enums\OrderSource;
use App\Enums\OrderStatus;
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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('request_token')->unique();
            $table->foreignId('shop_id')->constrained('shops')->restrictOnDelete();
            $table->string('source')->default(OrderSource::WebWhatsapp->value)->index();
            $table->string('customer_name');
            $table->string('customer_phone')->index();
            $table->text('delivery_address');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('average_weight_snapshot'); // in grams
            $table->unsignedInteger('unit_price'); // in integer FCFA
            $table->unsignedInteger('commission_per_unit'); // in integer FCFA (400)
            $table->unsignedBigInteger('subtotal'); // in integer FCFA
            $table->unsignedBigInteger('platform_commission'); // in integer FCFA
            $table->unsignedBigInteger('seller_amount'); // in integer FCFA
            $table->string('status')->default(OrderStatus::Pending->value)->index();
            $table->timestamp('stock_reserved_at')->nullable();
            $table->timestamp('stock_released_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('preparing_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivering_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('reservation_expires_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
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
