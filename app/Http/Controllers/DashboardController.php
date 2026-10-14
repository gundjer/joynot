<?php

namespace App\Http\Controllers;

use App\Games\GameRegistry;
use App\Http\Controllers\Concerns\FindsFamilyRecords;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use FindsFamilyRecords;

    /** "Who's playing?" */
    public function who(Request $request)
    {
        return view('dashboard.who', [
            'kids' => $request->user()->kids,
            'lastKidId' => (int) $request->session()->get('last_kid_id'),
        ]);
    }

    /** One kid's game cards. */
    public function games(Request $request, GameRegistry $registry, $kid)
    {
        $kid = $this->familyKid($request, $kid);
        $request->session()->put('last_kid_id', $kid->id);
        $progress = $kid->progress()->get()->keyBy('game');

        $games = $registry->all()
            ->reject(fn ($g) => optional($progress->get($g->key()))->hidden)
            ->map(fn ($g) => ['game' => $g, 'badges' => $g->badges($progress->get($g->key()))]);

        return view('dashboard.games', [
            'kid' => $kid,
            'games' => $games,
            'comingSoon' => $registry->comingSoon(),
        ]);
    }
}
