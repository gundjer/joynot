<?php

namespace App\Http\Controllers;

use App\Games\GameRegistry;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function __invoke(Request $request, GameRegistry $games)
    {
        if ($request->user()) {
            return redirect()->route('dashboard');
        }

        return view('home', ['games' => $games->all(), 'comingSoon' => $games->comingSoon()]);
    }
}
