<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSellerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $seller = $this->seller();

        if (! $user?->isAdmin()) {
            return false;
        }

        if ($seller === null || ! $seller->isSeller()) {
            abort(404);
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $sellerId = $this->seller()?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$sellerId],
            'phone' => ['nullable', 'string', 'max:20'],
        ];
    }

    private function seller(): ?User
    {
        $seller = $this->route('seller');

        return $seller instanceof User ? $seller : null;
    }
}
