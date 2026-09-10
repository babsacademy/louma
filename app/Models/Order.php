<?php

namespace App\Models;

use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use Carbon\CarbonInterface;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property string $reference
 * @property string $request_token
 * @property int $shop_id
 * @property OrderSource $source
 * @property string $customer_name
 * @property string $customer_phone
 * @property string $delivery_address
 * @property int $quantity
 * @property int $average_weight_snapshot
 * @property int $unit_price
 * @property int $commission_per_unit
 * @property int $subtotal
 * @property int $platform_commission
 * @property int $seller_amount
 * @property OrderStatus $status
 * @property CarbonInterface|null $stock_reserved_at
 * @property CarbonInterface|null $stock_released_at
 * @property CarbonInterface|null $confirmed_at
 * @property CarbonInterface|null $preparing_at
 * @property CarbonInterface|null $picked_up_at
 * @property CarbonInterface|null $delivering_at
 * @property CarbonInterface|null $delivered_at
 * @property CarbonInterface|null $cancelled_at
 * @property string|null $cancellation_reason
 * @property CarbonInterface|null $reservation_expires_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 */
#[Fillable([
    'reference',
    'request_token',
    'shop_id',
    'source',
    'customer_name',
    'customer_phone',
    'delivery_address',
    'quantity',
    'average_weight_snapshot',
    'unit_price',
    'commission_per_unit',
    'subtotal',
    'platform_commission',
    'seller_amount',
    'status',
    'stock_reserved_at',
    'stock_released_at',
    'confirmed_at',
    'preparing_at',
    'picked_up_at',
    'delivering_at',
    'delivered_at',
    'cancelled_at',
    'cancellation_reason',
    'reservation_expires_at',
])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'source' => OrderSource::class,
            'quantity' => 'integer',
            'average_weight_snapshot' => 'integer',
            'unit_price' => 'integer',
            'commission_per_unit' => 'integer',
            'subtotal' => 'integer',
            'platform_commission' => 'integer',
            'seller_amount' => 'integer',
            'status' => OrderStatus::class,
            'stock_reserved_at' => 'datetime',
            'stock_released_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'preparing_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'delivering_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'reservation_expires_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Shop, $this>
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * @return HasMany<OrderStatusHistory, $this>
     */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    /**
     * @return HasOne<Payment, $this>
     */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    /**
     * @return HasOne<SellerPayout, $this>
     */
    public function sellerPayout(): HasOne
    {
        return $this->hasOne(SellerPayout::class);
    }
}
