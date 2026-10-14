<?php

namespace App\Http\Controllers\Grownups;

use App\Http\Controllers\Controller;
use App\Http\Middleware\GrownupsUnlocked;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class PinController extends Controller
{
    /** Session flag: parent just registered, so the first PIN doesn't need the password again. */
    public const TRUSTED = 'pin_setup_trusted';

    private const PIN_RULE = ['required', 'digits_between:4,6', 'confirmed'];

    public function unlockForm(Request $request)
    {
        if (! $request->user()->hasPin()) {
            return redirect()->route('grownups.pin.setup');
        }
        if (GrownupsUnlocked::isUnlocked($request)) {
            return redirect()->route('grownups.index');
        }

        return view('grownups.unlock');
    }

    public function unlock(Request $request)
    {
        $request->validate(['pin' => 'required|string']);
        $user = $request->user();
        $key = 'pin:'.$user->id;

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages(['pin' => 'Too many tries. Wait '.RateLimiter::availableIn($key).' seconds.']);
        }
        if (! $user->checkPin((string) $request->input('pin'))) {
            RateLimiter::hit($key, 120);
            throw ValidationException::withMessages(['pin' => 'That PIN isn\'t right.']);
        }

        RateLimiter::clear($key);
        GrownupsUnlocked::unlock($request);

        return redirect()->to($request->session()->pull('url.grownups', route('grownups.index')));
    }

    public function lock(Request $request)
    {
        GrownupsUnlocked::lock($request);

        return redirect()->route('dashboard');
    }

    /** First PIN, or "forgot my PIN" (needs the account password). */
    public function setupForm(Request $request)
    {
        return view('grownups.pin-setup', [
            'forgot' => $request->user()->hasPin(),
            'needsPassword' => ! $this->trusted($request),
        ]);
    }

    public function setup(Request $request)
    {
        $rules = ['pin' => self::PIN_RULE];
        if (! $this->trusted($request)) {
            $rules['password'] = 'required|current_password';
        }
        $data = $request->validate($rules, ['password.current_password' => 'That isn\'t your account password.']);

        $request->user()->forceFill(['parent_pin' => $data['pin']])->save();
        $request->session()->forget(self::TRUSTED);
        GrownupsUnlocked::unlock($request);

        return redirect()->route('grownups.index')->with('status', 'Your Grown-ups PIN is set. Now add your kids!');
    }

    /** Change the PIN from inside the Grown-ups area. */
    public function change(Request $request)
    {
        $data = $request->validate(['pin' => self::PIN_RULE]);
        $request->user()->forceFill(['parent_pin' => $data['pin']])->save();

        return back()->with('status', 'PIN changed.');
    }

    private function trusted(Request $request): bool
    {
        return $request->session()->get(self::TRUSTED) === true && ! $request->user()->hasPin();
    }
}
