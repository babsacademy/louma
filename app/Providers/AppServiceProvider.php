<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Limit public endpoints that can reserve stock or reveal order details.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('public-orders', function (Request $request): Limit {
            return Limit::perMinute(10)
                ->by('public-order:'.$request->ip())
                ->response(fn (Request $request, array $headers) => response(
                    'Trop de tentatives de commande. Réessayez dans quelques instants.',
                    429,
                    $headers,
                ));
        });

        RateLimiter::for('public-order-confirmation', function (Request $request): Limit {
            return Limit::perMinute(30)
                ->by('public-order-confirmation:'.$request->ip())
                ->response(fn (Request $request, array $headers) => response(
                    'Trop de tentatives de consultation. Réessayez dans quelques instants.',
                    429,
                    $headers,
                ));
        });
    }
}
