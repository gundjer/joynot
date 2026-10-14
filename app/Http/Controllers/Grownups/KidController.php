<?php

namespace App\Http\Controllers\Grownups;

use App\Games\GameRegistry;
use App\Http\Controllers\Concerns\FindsFamilyRecords;
use App\Http\Controllers\Controller;
use App\Models\Kid;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KidController extends Controller
{
    use FindsFamilyRecords;

    private function rules(): array
    {
        $grades = array_keys(config('joynot.grades'));

        return [
            'name' => 'required|string|max:40',
            'avatar' => 'nullable|string|max:16',
            'color' => 'nullable|string|max:16',
            'grade' => ['nullable', Rule::in($grades)],
            'reading_grade' => ['nullable', Rule::in($grades)],
            'math_grade' => ['nullable', Rule::in($grades)],
            'goal_grade' => ['nullable', Rule::in($grades)],
        ];
    }

    /** Set every game's starting levels from the kid's grades. Returns how many games were set. */
    private function applyGrades(Kid $kid, GameRegistry $registry): int
    {
        $n = 0;
        foreach ($registry->all() as $game) {
            $game->applyGrades($kid->progressFor($game->key()), $kid->grades());
            $n++;
        }

        return $n;
    }

    /** "All 21 games now match: reading & other games at 2nd grade, math games at 1st grade." */
    private function gradesMessage(Kid $kid, int $count): string
    {
        $g = $kid->grades();
        $reading = Kid::gradeName($g['reading']);
        $math = Kid::gradeName($g['math']);
        if ($g['reading'] === null && $g['math'] === null) {
            return " No grades are set, so all {$count} games start at level 1.";
        }

        return " All {$count} games moved: 📖 reading, writing, science, coding and other games → {$reading} level; 🔢 time and money games → {$math} level.";
    }

    public function create(Request $request)
    {
        $kids = $request->user()->kids;
        $n = $kids->count();

        return view('grownups.create', [
            'kids' => $kids,
            'full' => $n >= config('joynot.max_kids'),
            'avatar' => config('joynot.avatars')[$n % count(config('joynot.avatars'))],
            'color' => config('joynot.colors')[$n % count(config('joynot.colors'))],
        ]);
    }

    public function store(Request $request, GameRegistry $registry)
    {
        $user = $request->user();
        $data = $request->validate($this->rules());
        $count = $user->kids()->count();

        if ($count >= config('joynot.max_kids')) {
            return back()->withErrors(['name' => 'You can have up to '.config('joynot.max_kids').' kids.']);
        }

        $kid = $user->kids()->create([
            'name' => trim($data['name']),
            'avatar' => Kid::cleanAvatar($data['avatar'] ?? null, $count),
            'color' => Kid::cleanColor($data['color'] ?? null, $count),
            'grade' => $data['grade'] ?? null,
            'reading_grade' => $data['reading_grade'] ?? null,
            'math_grade' => $data['math_grade'] ?? null,
            'goal_grade' => $data['goal_grade'] ?? null,
            'sort' => $count,
        ]);
        $count = $this->applyGrades($kid, $registry);

        return redirect()->route('grownups.kids.edit', $kid->id)
            ->with('status', "Added {$kid->name}!".$this->gradesMessage($kid, $count));
    }

    /** One kid: profile, grades, and every game's settings + progress (like the old Grown-ups page). */
    public function edit(Request $request, GameRegistry $registry, $kid)
    {
        $kid = $this->familyKid($request, $kid);
        $byGame = $kid->progress()->get()->keyBy('game');

        $games = $registry->all()->map(function ($g) use ($kid, $byGame) {
            $progress = $byGame->get($g->key()) ?? $kid->progressFor($g->key());
            $progress->setRelation('kid', $kid);

            return [
                'game' => $g,
                'progress' => $progress,
                'settings' => $g->settingsFor($progress),
                'report' => $g->reportView() ? $g->reportData($kid, $progress) : [],
            ];
        });

        return view('grownups.kid', [
            'kid' => $kid,
            'kids' => $request->user()->kids,
            'games' => $games,
        ]);
    }

    public function update(Request $request, GameRegistry $registry, $kid)
    {
        $kid = $this->familyKid($request, $kid);
        $data = $request->validate($this->rules() + ['match_levels' => 'nullable|in:1']);

        $kid->update([
            'name' => trim($data['name']),
            'avatar' => Kid::cleanAvatar($data['avatar'] ?? $kid->avatar),
            'color' => Kid::cleanColor($data['color'] ?? $kid->color),
            'grade' => $data['grade'] ?? null,
            'reading_grade' => $data['reading_grade'] ?? null,
            'math_grade' => $data['math_grade'] ?? null,
            'goal_grade' => $data['goal_grade'] ?? null,
        ]);

        $msg = "Saved {$kid->name}.";
        if (! empty($data['match_levels'])) {
            $msg .= $this->gradesMessage($kid, $this->applyGrades($kid, $registry));
        }

        return redirect()->route('grownups.kids.edit', $kid->id)->with('status', $msg);
    }

    public function destroy(Request $request, $kid)
    {
        $kid = $this->familyKid($request, $kid);
        $request->validate(['confirm' => 'required|in:DELETE'], ['confirm.in' => 'Type DELETE to remove this kid.']);
        $name = $kid->name;
        $kid->delete(); // progress + answers go with it

        return redirect()->route('grownups.index')->with('status', "Removed {$name}.");
    }

    /** Move a kid up or down in the "Who's playing?" list. */
    public function order(Request $request)
    {
        $data = $request->validate(['kid_id' => 'required|integer', 'dir' => 'required|in:up,down']);
        $kids = $request->user()->kids()->get()->values();
        $i = $kids->search(fn ($k) => $k->id === (int) $data['kid_id']);
        abort_if($i === false, 404);
        $j = $data['dir'] === 'up' ? $i - 1 : $i + 1;

        if ($j >= 0 && $j < $kids->count()) {
            $list = $kids->all();
            [$list[$i], $list[$j]] = [$list[$j], $list[$i]];
            foreach ($list as $n => $k) {
                $k->update(['sort' => $n]);
            }
        }

        return back();
    }
}
