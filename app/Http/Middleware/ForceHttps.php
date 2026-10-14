<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sends every http:// visit to https:// when APP_URL starts with https://.
 * (Login cookies and the microphone only work on https.)
 */
class ForceHttps
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->secure() && str_starts_with((string) config('app.url'), 'https://')) {
            return redirect()->secure($request->getRequestUri(), 301);
        }

        return $next($request);
    }
}
