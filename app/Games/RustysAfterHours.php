<?php

namespace App\Games;

use App\Models\GameProgress;
use App\Models\Kid;

class RustysAfterHours extends Game
{
    // scare: 'auto' follows the kid's grade (Gentle Pre-K–K, Spooky-lite 1st–3rd, Spooky 4th–5th). A grown-up can pick a
    // lower level, never a higher one. Old values: off → gentle, mild/full → auto.
    public const SETTING_DEFAULTS = ['scare' => 'auto', 'monsterSpeed' => 'normal', 'focus' => 'both', 'strict' => 'easy', 'voices' => true, 'talk' => 'off', 'video' => 'off'];

    public function supportsCoop(): bool
    {
        return true;
    }

    /** "Play together" switches (Grown-ups → settings). Both start OFF. */
    public function together(GameProgress $progress): array
    {
        $s = ($progress->state ?? [])['settings'] ?? [];

        return ['talk' => ($s['talk'] ?? 'off') === 'on', 'video' => ($s['video'] ?? 'off') === 'on'];
    }

    public function playHeaders(): array
    {
        return ['Permissions-Policy' => 'microphone=(self), camera=(self)'];
    }

    // ---------------------------------------------------------------- saving

    /** If a grown-up changed this kid's settings since the game last loaded, send the new save back instead. */
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
            'reading_level' => (int) data_get($state, 'reading.level', 1),
            'math_level' => (int) data_get($state, 'math.level', 1),
            'night' => (int) ($state['night'] ?? 1),
            'tokens' => (int) ($state['tokens'] ?? 0),
            'nights' => (int) data_get($state, 'stats.nights', 0),
            // level loop: 0 flashlight night → 1 workshop → 2 hallway run (old saves had a 4th step: a workshop)
            'stage' => ((int) ($state['stage'] ?? 0)) === 3 ? 1 : ((int) ($state['stage'] ?? 0)) % 3,
            'bots' => count((array) ($state['bots'] ?? [])),
            'runs' => (int) ($state['runs'] ?? 0),
        ];
    }

    public function attemptRules(): array
    {
        return array_merge(parent::attemptRules(), [
            'attempts.*.track' => 'required|in:reading,math',
            'attempts.*.level' => 'required|integer|min:1|max:100',
        ]);
    }

    // ---------------------------------------------------------------- grown-ups

    protected function levels(): array
    {
        return [config('game.reading_levels'), config('game.math_levels')];
    }

    /**
     * Level number for a school grade. Level grade labels look like 'K', 'K-1', '1-2', '3-4'.
     * $first = true: the first level for that grade (starting point). false: the last one (goal).
     */
    public static function levelForGrade(array $levels, ?string $grade, bool $first = true): ?int
    {
        if ($grade === null || $grade === '') {
            return null;
        }
        if ($grade === 'PK') {
            return 1;
        }
        $order = ['K' => 0, '1' => 1, '2' => 2, '3' => 3, '4' => 4, '5' => 5, '6' => 6, '7' => 7, '8' => 8];
        $want = $order[$grade] ?? null;
        if ($want === null) {
            return null;
        }
        $hits = [];
        foreach ($levels as $n => [$name, $label]) {
            $parts = array_map(fn ($p) => $order[$p] ?? null, explode('-', $label));
            if ($first ? $parts[0] === $want : in_array($want, $parts, true)) {
                $hits[] = $n;
            }
        }
        if (! $hits) {
            // past the top of this game (e.g. 6th grade): use the hardest level
            return max(array_keys($levels));
        }

        return $first ? min($hits) : max($hits);
    }

    /** Goal levels for the kid's goal grade: ['reading' => 13, 'math' => 20] or nulls. */
    public function goalLevels(?string $goalGrade): array
    {
        [$reading, $math] = $this->levels();

        return [
            'reading' => self::levelForGrade($reading, $goalGrade, false),
            'math' => self::levelForGrade($math, $goalGrade, false),
        ];
    }

    public function applyGrades(GameProgress $progress, array $grades): void
    {
        [$reading, $math] = $this->levels();
        $rl = self::levelForGrade($reading, $grades['reading'] ?? null) ?? 1;
        $ml = self::levelForGrade($math, $grades['math'] ?? null) ?? 1;
        $state = $progress->state ?? [];
        $current = $this->settingsFor($progress);

        $this->saveSettings($progress, [
            'reading_level' => $rl,
            'math_level' => $ml,
            'night' => (int) ($state['night'] ?? 1),
            'scare' => $current['settings']['scare'],
            'monsterSpeed' => $current['settings']['monsterSpeed'],
            'focus' => $current['settings']['focus'],
            'strict' => $current['settings']['strict'],
            'voices' => $current['settings']['voices'] ? 'on' : 'off',
            'talk' => $current['settings']['talk'] ?? 'off',
            'video' => $current['settings']['video'] ?? 'off',
        ]);
    }

    public function badges(?GameProgress $progress): array
    {
        if (! $progress || ! $progress->state) {
            return [['✨', 'New!']];
        }
        $s = $progress->summary ?? [];

        return [['📖', 'Lv '.($s['reading_level'] ?? 1)], ['🔢', 'Lv '.($s['math_level'] ?? 1)], ['🌙', 'Night '.($s['night'] ?? 1)]];
    }

    public function overview(?GameProgress $progress): array
    {
        [$reading, $math] = $this->levels();
        $s = $progress?->summary ?? [];
        $rl = (int) ($s['reading_level'] ?? 1);
        $ml = (int) ($s['math_level'] ?? 1);

        $goal = $this->goalLevels($progress?->kid?->goal_grade);
        $toGoal = fn ($lv, $g) => $g ? ($lv >= $g ? ' · 🎯 goal reached!' : " · 🎯 goal Lv {$g}") : '';

        return [
            '📖 Reading' => "Level {$rl} · ".($reading[$rl][0] ?? '').' (Gr '.($reading[$rl][1] ?? '?').')'.$toGoal($rl, $goal['reading']),
            '🔢 Math' => "Level {$ml} · ".($math[$ml][0] ?? '').' (Gr '.($math[$ml][1] ?? '?').')'.$toGoal($ml, $goal['math']),
            '🌙 Night' => ($s['night'] ?? 1).' · '.($s['nights'] ?? 0).' escaped · ★ '.($s['tokens'] ?? 0),
            '⭐ Adventures' => 'Next: '.(['🌙 Flashlight night', '🔧 Robot workshop', '🙈 Hide & Seek'][(int) ($s['stage'] ?? 0) % 3] ?? '🌙 Flashlight night')
                .' · 🤖 '.($s['bots'] ?? 0).' animatronics built · 🏃 '.($s['runs'] ?? 0).' games of Hide & Seek (loop: night → build an animatronic → it hunts for you → next night)',
        ];
    }

    public function settingsView(): ?string
    {
        return 'games.rustys-after-hours.settings';
    }

    public function settingsRules(): array
    {
        [$reading, $math] = $this->levels();

        return [
            'reading_level' => 'required|integer|min:1|max:'.count($reading),
            'math_level' => 'required|integer|min:1|max:'.count($math),
            'night' => 'required|integer|min:1|max:999',
            'scare' => 'required|in:auto,gentle,lite,spooky,off,mild,full',
            'monsterSpeed' => 'required|in:slow,normal,fast',
            'focus' => 'required|in:both,reading,math',
            'strict' => 'required|in:easy,normal',
            'voices' => 'required|in:on,off',
            'talk' => 'nullable|in:on,off',
            'video' => 'nullable|in:on,off',
        ];
    }

    public function settingsFor(GameProgress $progress): array
    {
        [$readingLevels, $mathLevels] = $this->levels();
        $state = $progress->state ?? [];

        return [
            'settings' => array_merge(self::SETTING_DEFAULTS, $state['settings'] ?? []),
            'scareMax' => self::scareMaxFor($progress->kid?->grade),
            'rl' => (int) data_get($state, 'reading.level', 1),
            'ml' => (int) data_get($state, 'math.level', 1),
            'night' => (int) ($state['night'] ?? 1),
            'readingLevels' => $readingLevels,
            'mathLevels' => $mathLevels,
        ];
    }

    /** Highest scare level for a grade: 0 Gentle (Pre-K, K), 1 Spooky-lite (1st–3rd), 2 Spooky (4th and up). */
    public static function scareMaxFor(?string $grade): int
    {
        if ($grade === null || $grade === '') {
            return 1;
        }
        if (in_array(strtoupper($grade), ['PK', 'K'], true)) {
            return 0;
        }

        return ((int) $grade) <= 3 ? 1 : 2;
    }

    public function saveSettings(GameProgress $progress, array $data): void
    {
        // never above the kid's grade
        $levels = ['gentle' => 0, 'lite' => 1, 'spooky' => 2];
        if (isset($levels[$data['scare']]) && $levels[$data['scare']] > self::scareMaxFor($progress->kid?->grade)) {
            $data['scare'] = 'auto';
        }
        $state = $progress->state ?? [];
        $nowMs = (int) round(microtime(true) * 1000);

        foreach (['reading' => 'reading_level', 'math' => 'math_level'] as $track => $field) {
            $old = (int) data_get($state, "$track.level", 1);
            data_set($state, "$track.level", (int) $data[$field]);
            if ($old !== (int) $data[$field]) {
                data_set($state, "$track.history", []);
            }
        }
        $state['night'] = (int) $data['night'];
        $state['settings'] = [
            'scare' => $data['scare'],
            'monsterSpeed' => $data['monsterSpeed'],
            'focus' => $data['focus'],
            'strict' => $data['strict'],
            'voices' => $data['voices'] === 'on',
            'talk' => ($data['talk'] ?? 'off') === 'on' ? 'on' : 'off',
            'video' => ($data['video'] ?? 'off') === 'on' ? 'on' : 'off',
        ];
        $state['parentEditAt'] = $nowMs;
        $state['updatedAt'] = $nowMs;

        $progress->update(['state' => $state, 'summary' => $this->summarize($state)]);
    }

    public function reportView(): ?string
    {
        return 'games.rustys-after-hours.report';
    }

    public function reportData(Kid $kid, GameProgress $progress): array
    {
        [$readingLevels, $mathLevels] = $this->levels();
        $state = $progress->state ?? [];

        $summary = [];
        foreach (['reading', 'math'] as $track) {
            $q = $progress->attempts()->where('track', $track);
            $week = (clone $q)->where('created_at', '>=', now()->subDays(7));
            $weekTotal = (clone $week)->count();
            $summary[$track] = [
                'total' => (clone $q)->count(),
                'week' => $weekTotal,
                'week_first_try' => $weekTotal ? round((clone $week)->where('first_try', true)->where('correct', true)->where('helped', false)->count() / $weekTotal * 100) : null,
                'today' => (clone $q)->where('created_at', '>=', now()->startOfDay())->count(),
            ];
        }

        $tough = $progress->attempts()
            ->selectRaw('track, expected, COUNT(*) as misses')
            ->where(fn ($q) => $q->where('correct', false)->orWhere('first_try', false)->orWhere('helped', true))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('track', 'expected')
            ->orderByDesc('misses')
            ->limit(15)
            ->get();

        $recent = $progress->attempts()->latest()->limit(60)->get();

        $days = collect(range(13, 0))->map(function ($i) use ($progress) {
            $d = now()->subDays($i)->startOfDay();

            return [
                'label' => $d->format('D j'),
                'count' => $progress->attempts()->whereBetween('created_at', [$d, (clone $d)->endOfDay()])->count(),
            ];
        });

        return [
            'state' => $state,
            'stats' => $state['stats'] ?? [],
            'rl' => (int) data_get($state, 'reading.level', 1),
            'ml' => (int) data_get($state, 'math.level', 1),
            'readingLevels' => $readingLevels,
            'mathLevels' => $mathLevels,
            'summary' => $summary,
            'tough' => $tough,
            'recent' => $recent,
            'days' => $days,
            'maxDay' => max(1, $days->max('count') ?? 0),
            'goal' => $this->goalLevels($kid->goal_grade),
            'goalGrade' => $kid->goal_grade,
        ];
    }

    public function reset(GameProgress $progress): void
    {
        $progress->attempts()->delete();
        $nowMs = (int) round(microtime(true) * 1000);
        // keep the grown-up's settings (scare level etc.), wipe everything else
        $settings = array_merge(self::SETTING_DEFAULTS, ($progress->state ?? [])['settings'] ?? []);
        $state = ['settings' => $settings, 'parentEditAt' => $nowMs, 'updatedAt' => $nowMs, 'reset' => true];
        $progress->update(['state' => $state, 'summary' => $this->summarize($state)]);
    }
}
