<?php

namespace App\Http\Controllers\Concerns;

use App\Games\Game;
use App\Games\GameRegistry;
use App\Models\Kid;
use Illuminate\Http\Request;

/**
 * Looks up {kid} and {game} from the URL.
 * A kid is only ever found inside the logged-in parent's own family (anything else = 404).
 */
trait FindsFamilyRecords
{
    protected function familyKid(Request $request, mixed $kid): Kid
    {
        $user = $request->user();
        abort_unless($user, 404);

        if ($kid instanceof Kid) {
            abort_unless((int) $kid->user_id === (int) $user->id, 404);

            return $kid;
        }
        abort_unless(is_numeric($kid), 404);

        return Kid::where('user_id', $user->id)->findOrFail((int) $kid);
    }

    protected function findGame(mixed $game): Game
    {
        return $game instanceof Game ? $game : app(GameRegistry::class)->findOrFail((string) $game);
    }
}
