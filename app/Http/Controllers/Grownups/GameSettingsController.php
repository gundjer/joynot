<?php

namespace App\Http\Controllers\Grownups;

use App\Http\Controllers\Concerns\FindsFamilyRecords;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/** One kid + one game: settings and reset. (Shown on the kid's Grown-ups page.) */
class GameSettingsController extends Controller
{
    use FindsFamilyRecords;

    /** Old link → the kid's page, scrolled to that game. */
    public function show(Request $request, $kid, $game)
    {
        $kid = $this->familyKid($request, $kid);
        $game = $this->findGame($game);

        return redirect()->to(route('grownups.kids.edit', $kid->id).'#game-'.$game->key());
    }

    public function update(Request $request, $kid, $game)
    {
        $kid = $this->familyKid($request, $kid);
        $game = $this->findGame($game);
        $data = $request->validate(['visible' => 'required|in:0,1'] + $game->settingsRules());
        $progress = $kid->progressFor($game->key());
        $progress->update(['hidden' => $data['visible'] === '0']);
        $game->saveSettings($progress, $data);

        return redirect()->to(route('grownups.kids.edit', $kid->id).'#game-'.$game->key())
            ->with('status', "Saved {$kid->name}'s {$game->title()} settings. The game picks them up the next time it starts or saves.");
    }

    public function reset(Request $request, $kid, $game)
    {
        $kid = $this->familyKid($request, $kid);
        $game = $this->findGame($game);
        $request->validate(['confirm' => 'required|in:RESET'], ['confirm.in' => 'Type RESET to start over.']);
        $game->reset($kid->progressFor($game->key()));
        $game->applyGrades($kid->progressFor($game->key()), $kid->grades());

        return redirect()->to(route('grownups.kids.edit', $kid->id).'#game-'.$game->key())
            ->with('status', "{$kid->name}'s {$game->title()} progress was reset to their grade levels.");
    }
}
