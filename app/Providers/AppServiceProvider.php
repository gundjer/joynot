<?php

namespace App\Providers;

use App\Games\GameRegistry;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(GameRegistry::class);
    }

    public function boot(): void
    {
        // Every link and form Laravel builds uses https.
        if (str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }
    }
}
