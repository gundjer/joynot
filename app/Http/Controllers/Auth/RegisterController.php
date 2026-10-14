<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Grownups\PinController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class RegisterController extends Controller
{
    public function show()
    {
        return view('auth.register');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:80',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(8)],
            'agree' => 'accepted',
        ], [
            'agree.accepted' => 'Please confirm you are a parent or guardian (18+) and agree to the Terms and Privacy Policy.',
        ]);
        unset($data['agree']);

        $user = User::create($data);

        Auth::login($user, remember: true); // stay logged in on this device
        $request->session()->regenerate();
        $request->session()->put(PinController::TRUSTED, true); // just typed the password: skip asking again for the first PIN

        return redirect()->route('grownups.pin.setup');
    }
}
