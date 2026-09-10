<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShopRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'seller_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(function ($query) {
                    $query->where('role', UserRole::Seller->value)
                        ->where('active', true);
                }),
            ],
            'name' => ['required', 'string', 'max:255'],
            'zone' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'average_weight' => ['required', 'numeric', 'decimal:0,3', 'min:0.5', 'max:10.0'],
            'active' => ['sometimes', 'boolean'],
            'image' => [
                'nullable',
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:2048',
                Rule::dimensions()
                    ->minWidth(320)
                    ->minHeight(240)
                    ->maxWidth(4096)
                    ->maxHeight(4096),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'seller_id.required' => 'Veuillez sélectionner un vendeur.',
            'seller_id.exists' => 'Le compte sélectionné doit être un vendeur valide.',
            'name.required' => 'Le nom de la boutique est obligatoire.',
            'zone.required' => 'La zone est obligatoire.',
            'stock_quantity.required' => 'Le stock initial est obligatoire.',
            'stock_quantity.min' => 'Le stock ne peut pas être négatif.',
            'average_weight.required' => 'Le poids moyen est obligatoire.',
            'average_weight.min' => 'Le poids moyen doit être d’au moins 0,5 kg.',
            'average_weight.max' => 'Le poids moyen ne peut pas dépasser 10 kg.',
            'image.image' => 'Le fichier doit être une image.',
            'image.max' => 'L’image ne doit pas dépasser 2 Mo.',
            'image.dimensions' => 'L’image doit mesurer entre 320 × 240 et 4096 × 4096 pixels.',
        ];
    }
}
