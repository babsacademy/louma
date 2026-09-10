<?php

namespace App\Actions;

use App\Enums\UserRole;
use App\Models\Shop;
use App\Models\User;
use App\Services\WeightInGrams;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class CreateShop
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function execute(array $validated, ?UploadedFile $image = null): Shop
    {
        $seller = User::query()->whereKey($validated['seller_id'])->first();

        if (! $seller || $seller->role !== UserRole::Seller || ! $seller->active) {
            throw new InvalidArgumentException('Une boutique ne peut être attribuée qu’à un vendeur actif.');
        }

        $shop = new Shop;
        $shop->seller_id = $seller->id;
        $shop->name = $validated['name'];
        $shop->slug = $this->generateUniqueSlug($validated['name']);
        $shop->zone = $validated['zone'];
        $shop->description = $validated['description'] ?? null;
        $shop->stock_quantity = (int) ($validated['stock_quantity'] ?? 0);
        $shop->average_weight = WeightInGrams::fromKilograms((string) $validated['average_weight']);
        $shop->active = $validated['active'] ?? true;

        if ($image) {
            $imagePath = $image->store('shops', 'public');
            if ($imagePath === false) {
                throw new RuntimeException('Le stockage de l’image a échoué.');
            }
            $shop->image_path = $imagePath;
        } else {
            $shop->image_path = Shop::DEFAULT_IMAGE_PATH;
        }

        $shop->save();

        return $shop;
    }

    protected function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name) ?: 'boutique';
        $slug = $baseSlug;
        $counter = 1;

        while (Shop::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
