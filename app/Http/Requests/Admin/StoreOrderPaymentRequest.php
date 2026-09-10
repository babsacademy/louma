<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderPaymentRequest extends FormRequest
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
            'transaction_reference' => [
                'required',
                'string',
                'max:255',
                Rule::unique('payments', 'transaction_reference'),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'transaction_reference' => trim((string) $this->input('transaction_reference')),
        ]);
    }
}
