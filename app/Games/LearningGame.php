<?php

namespace App\Games;

use App\Models\GameProgress;
use App\Models\Kid;

/**
 * Base for the JoyNot learning mini-games (Habitat Heroes, Tick-Tock Clock Shop, Register Rush, ...).
 *
 * Every one of these games:
 *  - runs on the shared engine in public/games/_joy/ (one JS file per game: public/games/{key}/game.js)
 *  - has ONE skill track with numbered levels (LEVELS below) that move up/down automatically
 *  - shares one play page, one settings form and one report (resources/views/games/_learning/)
 *
 * A game class only lists its levels, its colors and any extra settings.
 */
abstract class LearningGame extends Game
{
    /** Levels, 1-based: [1 => ['Name', 'Grade label like K, K-1, 2-3'], ...] */
    public const LEVELS = [];

    /** Name of the skill (saved with every answer, max 20 chars). */
    public const TRACK = 'skill';

    /** Icon + word for the skill on cards and reports. */
    public const SKILL = ['⭐', 'Skill'];

    /** Which of the kid's grades picks the starting level: 'reading' ("Reads at") or 'math' ("Does math at"). Both fall back to the school grade. */
    public const GRADE_FROM = 'reading';

    /** Dark theme by default? (space, tech and coding games are dark; the rest are light) */
    public const DARK = false;

    /** What the kid collects. */
    public const TOKEN = ['⭐', 'stars'];

    /** Colors for the game screens. */
    public const COLORS = ['bg1' => '#fff6e5', 'bg2' => '#e7f4ff', 'accent' => '#ff6b4a', 'accent-d' => '#c94a2d', 'soft' => '#fff1dc'];

    /** Settings only this game has: key => ['label' => .., 'options' => [value => text], 'default' => value, 'hint' => ..] */
    public function extraSettings(): array
    {
        return [];
    }

    // ---------------------------------------------------------------- basics

    public function levels(): array
    {
        return static::LEVELS;
    }

    public function playView(): string
    {
        return 'games._learning.play';
    }

    /** Everything the game page needs to know about this game (goes into window.JOY_GAME). */
    public function clientConfig(): array
    {
        return [
            'key' => $this->key(),
            'title' => $this->title(),
            'track' => static::TRACK,
            'levels' => array_values(array_map(fn ($l) => ['name' => $l[0], 'grade' => $l[1]], $this->levels())),
            'defaults' => $this->defaults(),
            'theme' => static::COLORS,
            'token' => static::TOKEN,
            'dark' => static::DARK,
        ];
    }

    public function settingsSchema(): array
    {
        $all = $this->baseSettings();
        if (static::PLAY) {
            // real games (Play engine): no answer-button settings
            unset($all['modes'], $all['readChoices'], $all['breaks'], $all['look'], $all['hints'], $all['round']);
        }

        return $all;
    }

    /** Real playable game (canvas, Play engine) instead of the question engine? */
    public const PLAY = false;

    /** Every Play-engine game can be played together (Grown-ups → Join). */
    public function supportsCoop(): bool
    {
        return (bool) static::PLAY;
    }

    public function together(GameProgress $progress): array
    {
        if (! $this->supportsCoop()) {
            return parent::together($progress);
        }
        $s = $this->settingsFor($progress)['settings'];

        return ['talk' => ($s['talk'] ?? 'off') === 'on', 'video' => ($s['video'] ?? 'off') === 'on'];
    }

    protected function baseSettings(): array
    {
        return array_merge(static::PLAY ? static::togetherSettings() : [], [
            'autoLevel' => ['label' => '🧠 Move up when mastered', 'hint' => 'A level is mastered at 5 of the last 6 right on the first try with no help. Finishing a grade needs every level mastered plus a mixed Grade Boss round (80%).', 'options' => ['on' => 'Yes (recommended)', 'off' => 'No — keep the level I pick'], 'default' => 'on'],
            'support' => ['label' => '🤝 Quiet extra help', 'hint' => 'After 2 rough answers, questions quietly come from an easier level with a walk-through, then step back up after 3 right in a row. The kid always sees their real level.', 'options' => ['on' => 'On (recommended)', 'off' => 'Off'], 'default' => 'on'],
            'round' => ['label' => '🔁 Questions per round', 'hint' => 'Auto matches attention span: 5 for K–1, 8 for 2nd–3rd, 10 for 4th–5th.', 'options' => ['auto' => 'Auto by grade (recommended)', '5' => '5 (short)', '8' => '8', '10' => '10', '15' => '15 (long)'], 'default' => 'auto'],
            'modes' => ['label' => '🎮 Play styles', 'hint' => 'Kids pick Critter Hatchery, Turbo Race, Block Builder or Dungeon Quest. Same questions, different game around them.', 'options' => ['on' => 'On (recommended)', 'off' => 'Off — classic look'], 'default' => 'on'],
            'breaks' => ['label' => '🧠 Brain breaks', 'hint' => 'A 30-second movement break after about 12 min (K–1), 18 min (2nd–3rd) or 25 min (4th–5th).', 'options' => ['on' => 'On', 'off' => 'Off'], 'default' => 'on'],
            'voice' => ['label' => '🗣️ Read questions aloud', 'hint' => 'Great for kids who are still learning to read.', 'options' => ['on' => 'On', 'off' => 'Off'], 'default' => 'on'],
            'readChoices' => ['label' => '👂 Read the answer choices aloud', 'hint' => 'For kids who can’t read yet: each answer is read out loud while its button lights up, and every answer has a 🔊 button. Auto turns this on when "Reads at" is Pre-K, Kindergarten or 1st grade. Letter and spelling questions never read the answer out.', 'options' => ['auto' => 'Auto by reading grade (recommended)', 'always' => 'Always', 'off' => 'Off'], 'default' => 'auto'],
            'hints' => ['label' => '💡 Help button', 'options' => ['on' => 'Show it', 'off' => 'Hide it'], 'default' => 'on'],
            'sfx' => ['label' => '🔔 Sound effects', 'options' => ['on' => 'On', 'off' => 'Off'], 'default' => 'on'],
            'music' => ['label' => '🎵 Music', 'options' => ['on' => 'On', 'off' => 'Off'], 'default' => 'off'],
            'lessons' => ['label' => '📘 Lessons', 'hint' => 'A short "watch me, then let\'s try together" lesson before each new level.', 'options' => ['auto' => 'When a new level starts (recommended)', 'always' => 'Before every round', 'off' => 'Off — only from the menu'], 'default' => 'auto'],
            'theme' => ['label' => '🌗 Colors', 'hint' => 'Each game has its own: space, tech and coding games are dark, the others are light.', 'options' => ['auto' => 'Game default', 'light' => 'Always light', 'dark' => 'Always dark'], 'default' => 'auto'],
            'look' => ['label' => '🎨 Look', 'hint' => 'Auto grows up with the kid: bright for K–1, cleaner for 2–3, a sleek "mission console" for 4–5.', 'options' => ['auto' => 'Auto — matches the level (recommended)', 'young' => 'Always K–1 look', 'middle' => 'Always 2nd–3rd look', 'older' => 'Always 4th–5th look'], 'default' => 'auto'],
        ], $this->extraSettings());
    }

    public function defaults(): array
    {
        return array_map(fn ($s) => (string) $s['default'], $this->settingsSchema());
    }

    // ---------------------------------------------------------------- saving

    /** If a grown-up changed this kid's settings since the game loaded, send the new save back instead. */
    public function beforeSave(GameProgress $progress, array $incoming): ?array
    {
        $current = $progress->state ?? [];
        $serverEdit = (int) ($current['parentEditAt'] ?? 0);
        $seen = (int) ($incoming['seenParentEditAt'] ?? 0);

        return $serverEdit > $seen ? ['ok' => false, 'stale' => true, 'state' => $current] : null;
    }

    public function summarize(array $state): array
    {
        return [
            'level' => (int) ($state['level'] ?? 1),
            'stars' => (int) ($state['stars'] ?? 0),
            'rounds' => (int) data_get($state, 'stats.rounds', 0),
            'questions' => (int) data_get($state, 'stats.questions', 0),
            'right' => (int) data_get($state, 'stats.right', 0),
            'badges' => array_keys(array_filter((array) data_get($state, 'extra.badges', []))),
            'support' => (int) data_get($state, 'extra.sup', 0),
            'mastered' => count(array_filter((array) data_get($state, 'extra.m', []), fn ($m) => is_array($m) && ! empty($m['ok']))),
            'gradeBoss' => data_get($state, 'extra.gc.g'),
        ];
    }

    /** Grade badges earned, e.g. ['K', '1'] (a badge is earned when the kid finishes that grade's levels). */
    public static function badgeNames(array $keys): string
    {
        $names = ['K' => '🌱 K', '1' => '🧭 1st', '2' => '🗺️ 2nd', '3' => '🔧 3rd', '4' => '🚀 4th', '5' => '👑 5th'];

        return implode(' ', array_map(fn ($k) => $names[$k] ?? $k, $keys));
    }

    public function attemptRules(): array
    {
        return array_merge(parent::attemptRules(), [
            'attempts.*.track' => 'required|in:'.static::TRACK,
            'attempts.*.level' => 'required|integer|min:1|max:'.max(1, count($this->levels())),
        ]);
    }

    // ---------------------------------------------------------------- grown-ups

    public function badges(?GameProgress $progress): array
    {
        if (! $progress || ! $progress->state) {
            return [['✨', 'New!']];
        }
        $s = $progress->summary ?? [];

        return [[static::SKILL[0], 'Lv '.($s['level'] ?? 1)], [static::TOKEN[0], (string) ($s['stars'] ?? 0)]];
    }

    public function overview(?GameProgress $progress): array
    {
        $levels = $this->levels();
        $s = $progress?->summary ?? [];
        $lv = (int) ($s['level'] ?? 1);
        $goal = $this->goalLevel($progress?->kid?->goal_grade);
        $goalText = $goal ? ($lv >= $goal ? ' · 🎯 goal reached!' : " · 🎯 goal Lv {$goal}") : '';

        return [
            static::SKILL[0].' '.static::SKILL[1] => "Level {$lv} · ".($levels[$lv][0] ?? '').' (Gr '.($levels[$lv][1] ?? '?').')'.$goalText,
            static::TOKEN[0].' '.ucfirst(static::TOKEN[1]) => ($s['stars'] ?? 0).' · '.($s['rounds'] ?? 0).' rounds',
            '🎓 Grade badges' => ! empty($s['badges']) ? self::badgeNames($s['badges']) : 'none yet',
        ] + $this->teachingRows($s, $lv);
    }

    /** Grown-ups only: quiet support and Grade Boss status (kids never see this). */
    protected function teachingRows(array $s, int $lv): array
    {
        $rows = ['✅ Levels mastered' => ($s['mastered'] ?? 0).' of '.count($this->levels())];
        $sup = (int) ($s['support'] ?? 0);
        if ($sup > 0) {
            $at = max(1, $lv - $sup);
            $rows['🤝 Quiet extra help'] = "Practicing easier level {$at} (".($this->levels()[$at][0] ?? '').') before trying level '.$lv.' again';
        }
        if (($s['gradeBoss'] ?? null) !== null && $s['gradeBoss'] !== '') {
            $names = ['Kindergarten', '1st grade', '2nd grade', '3rd grade', '4th grade', '5th grade'];
            $rows['🎓 Grade Boss'] = 'Ready for the '.($names[(int) $s['gradeBoss']] ?? 'grade').' Grade Boss';
        }

        return $rows;
    }

    public function settingsView(): ?string
    {
        return 'games._learning.settings';
    }

    public function settingsRules(): array
    {
        $rules = ['level' => 'required|integer|min:1|max:'.max(1, count($this->levels()))];
        foreach ($this->settingsSchema() as $key => $s) {
            $rules[$key] = 'required|in:'.implode(',', array_map('strval', array_keys($s['options'])));
        }

        return $rules;
    }

    public function settingsFor(GameProgress $progress): array
    {
        $state = $progress->state ?? [];
        $saved = is_array($state['settings'] ?? null) ? $state['settings'] : [];
        $settings = $this->defaults();
        foreach ($settings as $k => $v) {
            if (isset($saved[$k]) && array_key_exists((string) $saved[$k], $this->settingsSchema()[$k]['options'])) {
                $settings[$k] = (string) $saved[$k];
            }
        }

        return [
            'settings' => $settings,
            'level' => max(1, min(count($this->levels()), (int) ($state['level'] ?? 1))),
            'levels' => $this->levels(),
            'schema' => $this->settingsSchema(),
            'skill' => static::SKILL,
            'gameKey' => $this->key(),
        ];
    }

    public function saveSettings(GameProgress $progress, array $data): void
    {
        $state = $progress->state ?? [];
        $nowMs = (int) round(microtime(true) * 1000);

        $old = (int) ($state['level'] ?? 1);
        $state['level'] = (int) $data['level'];
        if ($old !== (int) $data['level']) {
            $state['history'] = [];
        }
        $settings = [];
        foreach ($this->settingsSchema() as $key => $s) {
            $settings[$key] = (string) ($data[$key] ?? $s['default']);
        }
        $state['settings'] = $settings;
        $state['parentEditAt'] = $nowMs;
        $state['updatedAt'] = $nowMs;

        $progress->update(['state' => $state, 'summary' => $this->summarize($state)]);
    }

    /**
     * Level for a school grade. Level labels look like 'K', 'K-1', '2-3'.
     * $first = true: where a kid in that grade should start. false: the last level for that grade (goal).
     */
    public static function levelFor(array $levels, ?string $grade, bool $first = true): ?int
    {
        if ($grade === null || $grade === '') {
            return null;
        }
        $order = ['PK' => -1, 'K' => 0, '1' => 1, '2' => 2, '3' => 3, '4' => 4, '5' => 5, '6' => 6, '7' => 7, '8' => 8];
        $want = $order[(string) $grade] ?? null;
        if ($want === null || ! $levels) {
            return null;
        }
        $ranges = [];
        foreach ($levels as $n => [$name, $label]) {
            $parts = array_map(fn ($p) => $order[trim($p)] ?? 0, explode('-', (string) $label));
            $ranges[$n] = [min($parts), max($parts)];
        }
        $keys = array_keys($levels);
        if ($first) {
            foreach ($ranges as $n => [$lo, $hi]) {
                if ($lo === $want) {
                    return $n;
                }
            }
            foreach ($ranges as $n => [$lo, $hi]) {
                if ($lo <= $want && $want <= $hi) {
                    return $n;
                }
            }
            $last = null;
            foreach ($ranges as $n => [$lo, $hi]) {
                if ($lo < $want) {
                    $last = $n;
                }
            }

            return $last ?? min($keys); // younger than the game's first level → level 1
        }

        $hit = null;
        foreach ($ranges as $n => [$lo, $hi]) {
            if ($lo <= $want) {
                $hit = $n;
            }
        }

        return $hit ?? min($keys);
    }

    public function goalLevel(?string $goalGrade): ?int
    {
        return self::levelFor($this->levels(), $goalGrade, false);
    }

    public function applyGrades(GameProgress $progress, array $grades): void
    {
        $grade = $grades[static::GRADE_FROM] ?? null;
        if ($grade === null || $grade === '') {
            $grade = $grades['grade'] ?? null;
        }
        $level = self::levelFor($this->levels(), $grade) ?? 1;
        $current = $this->settingsFor($progress)['settings'];

        $this->saveSettings($progress, ['level' => $level] + $current);
    }

    public function reportView(): ?string
    {
        return 'games._learning.report';
    }

    public function reportData(Kid $kid, GameProgress $progress): array
    {
        $state = $progress->state ?? [];
        $q = $progress->attempts();
        $week = (clone $q)->where('created_at', '>=', now()->subDays(7));
        $weekTotal = (clone $week)->count();

        $summary = [
            'total' => (clone $q)->count(),
            'week' => $weekTotal,
            'week_first_try' => $weekTotal ? round((clone $week)->where('first_try', true)->where('correct', true)->where('helped', false)->count() / $weekTotal * 100) : null,
            'today' => (clone $q)->where('created_at', '>=', now()->startOfDay())->count(),
        ];

        $tough = $progress->attempts()
            ->selectRaw('expected, MAX(level) as level, COUNT(*) as misses')
            ->where(fn ($w) => $w->where('correct', false)->orWhere('first_try', false)->orWhere('helped', true))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('expected')
            ->orderByDesc('misses')
            ->limit(15)
            ->get();

        // one query for the 14-day chart (this page shows every game, so keep it light)
        $perDay = $progress->attempts()
            ->selectRaw('DATE(created_at) as d, COUNT(*) as n')
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->groupByRaw('DATE(created_at)')
            ->pluck('n', 'd');
        $days = collect(range(13, 0))->map(function ($i) use ($perDay) {
            $d = now()->subDays($i)->startOfDay();

            return ['label' => $d->format('D j'), 'count' => (int) ($perDay[$d->toDateString()] ?? 0)];
        });

        $byLevel = $progress->attempts()
            ->selectRaw('level, COUNT(*) as total, SUM(CASE WHEN correct = 1 AND first_try = 1 AND helped = 0 THEN 1 ELSE 0 END) as clean')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('level')
            ->orderBy('level')
            ->get();

        return [
            'state' => $state,
            'stats' => is_array($state['stats'] ?? null) ? $state['stats'] : [],
            'level' => max(1, min(count($this->levels()), (int) ($state['level'] ?? 1))),
            'levels' => $this->levels(),
            'summary' => $summary,
            'tough' => $tough,
            'byLevel' => $byLevel,
            'recent' => $progress->attempts()->latest()->limit(60)->get(),
            'days' => $days,
            'maxDay' => max(1, $days->max('count') ?? 0),
            'goal' => $this->goalLevel($kid->goal_grade),
            'goalGrade' => $kid->goal_grade,
            'skill' => static::SKILL,
            'token' => static::TOKEN,
            'badges' => array_keys(array_filter((array) data_get($state, 'extra.badges', []))),
            'lessonsSeen' => count(array_filter((array) data_get($state, 'extra.lessons', []))),
        ];
    }

    public function reset(GameProgress $progress): void
    {
        $progress->attempts()->delete();
        $nowMs = (int) round(microtime(true) * 1000);
        $settings = $this->settingsFor($progress)['settings']; // keep the grown-up's settings
        $state = ['settings' => $settings, 'parentEditAt' => $nowMs, 'updatedAt' => $nowMs, 'reset' => true];
        $progress->update(['state' => $state, 'summary' => $this->summarize($state)]);
    }
}
