<?php

namespace App\Actions;

use App\Enums\UserRole;
use App\Models\Shop;
use App\Models\User;
use App\Services\WeightInGrams;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class UpdateShop
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function execute(Shop $shop, array $validated, ?UploadedFile $image = null): Shop
    {
        $seller = User::query()->whereKey($validated['seller_id'])->first();

        if (! $seller || $seller->role !== UserRole::Seller) {
            throw new InvalidArgumentException('Une boutique ne peut être attribuée qu’à un utilisateur avec le rôle vendeur.');
        }

        $shop->seller_id = $seller->id;

        if ($shop->name !== $validated['name']) {
            $shop->name = $validated['name'];
            $shop->slug = $this->generateUniqueSlug($validated['name'], $shop->id);
        }

        $shop->zone = $validated['zone'];
        $shop->description = $validated['description'] ?? null;
        $shop->stock_quantity = (int) $validated['stock_quantity'];
        $shop->average_weight = WeightInGrams::fromKilograms((string) $validated['average_weight']);

        if (array_key_exists('active', $validated)) {
            $shop->active = (bool) $validated['active'];
        }

        $previousImagePath = $shop->image_path;
        $newImagePath = null;

        try {
            if ($image) {
                $imagePath = $image->store('shops', 'public');
                if ($imagePath === false) {
                    throw new RuntimeException('Le stockage de l’image a échoué.');
                }

                $shop->image_path = $imagePath;
                $newImagePath = $imagePath;
            }

            $shop->save();
        } catch (Throwable $exception) {
            if ($newImagePath !== null) {
                Storage::disk('public')->delete($newImagePath);
            }

            throw $exception;
        }

        if ($newImagePath !== null && $this->isManagedShopImage($previousImagePath)) {
            Storage::disk('public')->delete($previousImagePath);
        }

        return $shop;
    }

    protected function generateUniqueSlug(string $name, int $ignoreId): string
    {
        $baseSlug = Str::slug($name) ?: 'boutique';
        $slug = $baseSlug;
        $counter = 1;

        while (Shop::where('slug', $slug)->where('id', '!=', $ignoreId)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function isManagedShopImage(?string $path): bool
    {
        return $path !== null
            && $path !== Shop::DEFAULT_IMAGE_PATH
            && Str::startsWith($path, 'shops/');
    }
}
