<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Only lets the request through when the parent typed their Grown-ups PIN recently.
 * Each visit keeps it unlocked a little longer (config joynot.pin_minutes).
 */
class GrownupsUnlocked
{
    public const KEY = 'grownups_unlocked_at';

    public static function isUnlocked(Request $request): bool
    {
        $at = (int) $request->session()->get(self::KEY, 0);

        return $at > 0 && (time() - $at) < config('joynot.pin_minutes', 15) * 60;
    }

    public static function unlock(Request $request): void
    {
        $request->session()->put(self::KEY, time());
    }

    public static function lock(Request $request): void
    {
        $request->session()->forget(self::KEY);
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user->hasPin()) {
            return redirect()->route('grownups.pin.setup');
        }

        if (! self::isUnlocked($request)) {
            $request->session()->put('url.grownups', $request->fullUrl());

            return redirect()->route('grownups.unlock');
        }

        self::unlock($request); // sliding timeout

        $response = $next($request);
        $response->headers->set('Cache-Control', 'no-store, private');

        return $response;
    }
}
