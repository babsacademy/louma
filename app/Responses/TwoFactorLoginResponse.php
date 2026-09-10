<?php

namespace App\Responses;

use App\Enums\UserRole;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class TwoFactorLoginResponse implements TwoFactorLoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  Request  $request
     */
    public function toResponse($request): Response
    {
        return match ($request->user()?->role) {
            UserRole::Admin => redirect()->intended('/admin'),
            UserRole::Seller => redirect()->intended('/seller'),
            default => redirect()->intended('/'),
        };
    }
}
