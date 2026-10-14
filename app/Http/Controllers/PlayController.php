<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FindsFamilyRecords;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PlayController extends Controller
{
    use FindsFamilyRecords;

    /** The game page. */
    public function show(Request $request, $game, $kid)
    {
        $game = $this->findGame($game);
        $kid = $this->familyKid($request, $kid);
        $progress = $kid->progressFor($game->key());
        abort_if($progress->hidden, 404);

        $progress->increment('plays');
        $progress->forceFill(['last_played_at' => now()])->save();
        $request->session()->put('last_kid_id', $kid->id);

        $joynot = [
            'game' => $game->key(),
            'kid' => $kid->card(),
            'urls' => [
                'progress' => route('play.progress', [$game->key(), $kid->id]),
                'save' => route('play.save', [$game->key(), $kid->id]),
                'attempts' => route('play.attempts', [$game->key(), '__KID__']),
                'exit' => route('kid.games', $kid->id),
                'switch' => route('dashboard'),
                'grownups' => route('grownups.kids.edit', $kid->id),
                // grown-ups can join this game from their own phone (games that support it)
                'coop' => $game->supportsCoop() ? route('coop.host', [$game->key(), $kid->id]) : null,
            ],
        ];

        $response = response()->view($game->playView(), compact('game', 'kid', 'joynot'));
        foreach ($game->playHeaders() as $k => $v) {
            $response->header($k, $v);
        }
        $response->header('Cache-Control', 'no-store, private');

        return $response;
    }

    /** Game asks for this kid's saved progress (+ a fresh CSRF token). */
    public function progress(Request $request, $game, $kid)
    {
        $game = $this->findGame($game);
        $kid = $this->familyKid($request, $kid);
        $progress = $kid->progress()->where('game', $game->key())->first();

        return response()->json([
            'state' => $progress?->state,
            'kid' => $kid->card(),
            'csrf' => csrf_token(),
        ])->header('Cache-Control', 'no-store, private');
    }

    /** Game saves this kid's progress. */
    public function save(Request $request, $game, $kid)
    {
        $game = $this->findGame($game);
        $kid = $this->familyKid($request, $kid);
        $data = $request->validate(['state' => 'required|array']);
        $progress = $kid->progressFor($game->key());

        if ($stale = $game->beforeSave($progress, $data['state'])) {
            return response()->json($stale);
        }

        $state = $data['state'];
        $state['name'] = $kid->name; // the kid's name always comes from their profile
        $progress->update(['state' => $state, 'summary' => $game->summarize($state)]);

        return response()->json(['ok' => true]);
    }

    /** Game logs answers so grown-ups can see how each kid is doing. */
    public function attempts(Request $request, $game, $kid)
    {
        $game = $this->findGame($game);
        $kid = $this->familyKid($request, $kid);
        $data = $request->validate($game->attemptRules());

        foreach ($data['attempts'] as $a) {
            $kid->attempts()->create([
                'game' => $game->key(),
                'track' => $a['track'],
                'level' => $a['level'],
                'prompt' => mb_substr($a['prompt'], 0, 1000),
                'expected' => mb_substr($a['expected'], 0, 255),
                'heard' => isset($a['heard']) ? mb_substr($a['heard'], 0, 255) : null,
                'correct' => (bool) ($a['correct'] ?? false),
                'first_try' => (bool) ($a['first_try'] ?? false),
                'helped' => (bool) ($a['helped'] ?? false),
                'review' => (bool) ($a['review'] ?? false),
                'answered_at' => isset($a['at']) ? Carbon::parse($a['at']) : now(),
            ]);
        }

        return response()->json(['ok' => true, 'saved' => count($data['attempts'])]);
    }
}
