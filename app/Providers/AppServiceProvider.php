<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

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
        // Detect ngrok request from host
        $isNgrokRequest = strpos(request()->getHost(), 'ngrok-free.app') !== false;
        
        // Force HTTPS only for ngrok requests
        if ($isNgrokRequest) {
            URL::forceScheme('https');
        }
    }
}
