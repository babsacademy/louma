<?php

namespace App\Models;

use App\Services\ChickenPriceCalculator;
use Database\Factories\ShopFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $seller_id
 * @property string $name
 * @property string $slug
 * @property string $zone
 * @property string|null $description
 * @property string|null $image_path
 * @property int $stock_quantity
 * @property int $average_weight
 * @property bool $active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'seller_id',
    'name',
    'slug',
    'zone',
    'description',
    'image_path',
    'stock_quantity',
    'average_weight',
    'active',
])]
class Shop extends Model
{
    /** @use HasFactory<ShopFactory> */
    use HasFactory;

    public const DEFAULT_IMAGE_PATH = 'shops/default-shop.png';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stock_quantity' => 'integer',
            'average_weight' => 'integer',
            'active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'unit_price',
        'formatted_weight',
        'average_weight_kg',
        'image_url',
    ];

    public function getUnitPriceAttribute(): int
    {
        return ChickenPriceCalculator::calculateUnitPrice($this->average_weight);
    }

    public function getFormattedWeightAttribute(): string
    {
        $formatted = number_format($this->average_weight / 1000, 3, ',', ' ');
        $formatted = rtrim(rtrim($formatted, '0'), ',');

        return $formatted.' kg';
    }

    public function getAverageWeightKgAttribute(): float
    {
        return round($this->average_weight / 1000, 2);
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
    }

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
