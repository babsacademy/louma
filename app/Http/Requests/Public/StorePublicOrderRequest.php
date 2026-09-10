<?php

namespace App\Http\Requests\Public;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePublicOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $phone = preg_replace('/\D+/', '', (string) $this->input('customer_phone'));

        if (is_string($phone) && preg_match('/^7\d{8}$/', $phone)) {
            $phone = '+221'.$phone;
        } elseif (is_string($phone) && preg_match('/^2217\d{8}$/', $phone)) {
            $phone = '+'.$phone;
        }

        $this->merge([
            'customer_name' => trim((string) $this->input('customer_name')),
            'customer_phone' => $phone,
            'delivery_address' => trim((string) $this->input('delivery_address')),
        ]);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'regex:/^\\+2217\\d{8}$/'],
            'delivery_address' => ['required', 'string', 'min:5', 'max:500'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
            'request_token' => ['required', 'uuid'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'customer_name.required' => 'Votre nom est obligatoire.',
            'customer_phone.required' => 'Votre numéro de téléphone est obligatoire.',
            'customer_phone.regex' => 'Saisissez un numéro sénégalais valide, par exemple 77 123 45 67.',
            'delivery_address.required' => 'L’adresse de livraison est obligatoire.',
            'delivery_address.min' => 'L’adresse de livraison est trop courte.',
            'quantity.min' => 'Choisissez au moins un poulet.',
            'request_token.uuid' => 'La demande de commande est invalide. Rechargez la page puis réessayez.',
        ];
    }
}
