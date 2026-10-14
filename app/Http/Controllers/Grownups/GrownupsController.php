<?php

namespace App\Http\Controllers\Grownups;

use App\Games\GameRegistry;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class GrownupsController extends Controller
{
    /** "All kids" tab: every kid, every game. */
    public function index(Request $request, GameRegistry $registry)
    {
        $kids = $request->user()->kids()->with('progress')->get();
        if ($kids->isEmpty()) {
            return redirect()->route('grownups.kids.create');
        }

        $rows = $kids->map(function ($kid) use ($registry) {
            $byGame = $kid->progress->keyBy('game');

            return [
                'kid' => $kid,
                'games' => $registry->all()->map(function ($g) use ($byGame, $kid) {
                    $p = $byGame->get($g->key());
                    $p?->setRelation('kid', $kid);

                    return ['game' => $g, 'progress' => $p, 'overview' => $g->overview($p)];
                }),
            ];
        });

        return view('grownups.index', ['rows' => $rows, 'kids' => $kids]);
    }

    /** "Account" tab: PIN + log out. */
    public function account(Request $request)
    {
        return view('grownups.account', ['kids' => $request->user()->kids]);
    }
}
