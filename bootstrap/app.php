<?php

use App\Http\Middleware\ForceHttps;
use App\Http\Middleware\GrownupsUnlocked;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Hosting companies often put a proxy / load balancer in front of the site.
        // Trust it so Laravel knows the visitor is really on https.
        $middleware->trustProxies(at: '*');

        // Always use https (when APP_URL is https://...)
        $middleware->web(prepend: [ForceHttps::class]);

        $middleware->alias(['grownups' => GrownupsUnlocked::class]);

        $middleware->redirectGuestsTo(fn () => route('login'));
        $middleware->redirectUsersTo(fn () => route('dashboard'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
