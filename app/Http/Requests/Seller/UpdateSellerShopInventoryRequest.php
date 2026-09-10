<?php

namespace App\Http\Requests\Seller;

use App\Models\Shop;
use App\Services\WeightInGrams;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSellerShopInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $shop = $this->route('shop');

        return $shop instanceof Shop
            && (bool) $this->user()?->can('updateInventory', $shop);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'average_weight' => ['required', 'numeric', 'decimal:0,3', 'min:0.5', 'max:10'],
        ];
    }

    public function stockQuantity(): int
    {
        return $this->integer('stock_quantity');
    }

    public function averageWeightInGrams(): int
    {
        return WeightInGrams::fromKilograms(
            $this->string('average_weight')->trim()->toString(),
        );
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'stock_quantity.required' => 'Le stock disponible est obligatoire.',
            'stock_quantity.integer' => 'Le stock doit être un nombre entier.',
            'stock_quantity.min' => 'Le stock ne peut pas être négatif.',
            'average_weight.required' => 'Le poids moyen est obligatoire.',
            'average_weight.decimal' => 'Le poids moyen peut comporter au maximum trois décimales.',
            'average_weight.min' => 'Le poids moyen doit être d’au moins 0,5 kg.',
            'average_weight.max' => 'Le poids moyen ne peut pas dépasser 10 kg.',
        ];
    }

    protected function failedAuthorization(): void
    {
        abort(404);
    }
}
