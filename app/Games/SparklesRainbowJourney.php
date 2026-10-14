<?php

namespace App\Games;

use App\Models\GameProgress;
use App\Models\Kid;

/**
 * Sparkle's Rainbow Journey — bright unicorn maze. Same reading + math levels as Rusty's After Hours
 * (config/game.php), so grades, goals and reports work the same way.
 */
class SparklesRainbowJourney extends RustysAfterHours
{
    public const SETTING_DEFAULTS = ['focus' => 'both', 'strict' => 'easy', 'music' => true, 'speed' => 'normal', 'talk' => 'off', 'video' => 'off'];

    public function summarize(array $state): array
    {
        return [
            'reading_level' => (int) data_get($state, 'reading.level', 1),
            'math_level' => (int) data_get($state, 'math.level', 1),
            'stage' => (int) ($state['stage'] ?? 1),
            'beans' => (int) ($state['tokens'] ?? 0),
            'stages' => (int) data_get($state, 'stats.stages', 0),
        ];
    }

    public function badges(?GameProgress $progress): array
    {
        if (! $progress || ! $progress->state) {
            return [['✨', 'New!']];
        }
        $s = $progress->summary ?? [];

        return [['📖', 'Lv '.($s['reading_level'] ?? 1)], ['🔢', 'Lv '.($s['math_level'] ?? 1)], ['🌈', 'Stage '.($s['stage'] ?? 1)]];
    }

    public function overview(?GameProgress $progress): array
    {
        $rows = parent::overview($progress);
        $s = $progress?->summary ?? [];
        unset($rows['🌙 Night'], $rows['⭐ Adventures']);
        $found = min(5, max(0, ($s['stage'] ?? 1) - 1));
        $rows['🌈 Stage'] = ($s['stage'] ?? 1).' · family found '.$found.'/5 · 🍬 '.($s['beans'] ?? 0);

        return $rows;
    }

    public function settingsView(): ?string
    {
        return 'games.sparkles-rainbow-journey.settings';
    }

    public function settingsRules(): array
    {
        [$reading, $math] = $this->levels();

        return [
            'reading_level' => 'required|integer|min:1|max:'.count($reading),
            'math_level' => 'required|integer|min:1|max:'.count($math),
            'stage' => 'required|integer|min:1|max:999',
            'focus' => 'required|in:both,reading,math',
            'strict' => 'required|in:easy,normal',
            'music' => 'required|in:on,off',
            'speed' => 'required|in:slow,normal,fast',
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
            'rl' => (int) data_get($state, 'reading.level', 1),
            'ml' => (int) data_get($state, 'math.level', 1),
            'stage' => (int) ($state['stage'] ?? 1),
            'readingLevels' => $readingLevels,
            'mathLevels' => $mathLevels,
        ];
    }

    public function saveSettings(GameProgress $progress, array $data): void
    {
        $state = $progress->state ?? [];
        $nowMs = (int) round(microtime(true) * 1000);

        foreach (['reading' => 'reading_level', 'math' => 'math_level'] as $track => $field) {
            $old = (int) data_get($state, "$track.level", 1);
            data_set($state, "$track.level", (int) $data[$field]);
            if ($old !== (int) $data[$field]) {
                data_set($state, "$track.history", []);
            }
        }
        $state['stage'] = (int) $data['stage'];
        $state['settings'] = [
            'focus' => $data['focus'],
            'strict' => $data['strict'],
            'music' => $data['music'] === 'on',
            'speed' => $data['speed'],
            'talk' => ($data['talk'] ?? 'off') === 'on' ? 'on' : 'off',
            'video' => ($data['video'] ?? 'off') === 'on' ? 'on' : 'off',
        ];
        $state['parentEditAt'] = $nowMs;
        $state['updatedAt'] = $nowMs;

        $progress->update(['state' => $state, 'summary' => $this->summarize($state)]);
    }

    public function applyGrades(GameProgress $progress, array $grades): void
    {
        [$reading, $math] = $this->levels();
        $state = $progress->state ?? [];
        $current = $this->settingsFor($progress)['settings'];

        $this->saveSettings($progress, [
            'reading_level' => self::levelForGrade($reading, $grades['reading'] ?? null) ?? 1,
            'math_level' => self::levelForGrade($math, $grades['math'] ?? null) ?? 1,
            'stage' => (int) ($state['stage'] ?? 1),
            'focus' => $current['focus'],
            'strict' => $current['strict'],
            'music' => $current['music'] ? 'on' : 'off',
            'speed' => $current['speed'],
            'talk' => $current['talk'] ?? 'off',
            'video' => $current['video'] ?? 'off',
        ]);
    }

    public function reportView(): ?string
    {
        return 'games.sparkles-rainbow-journey.report';
    }

    public function reset(GameProgress $progress): void
    {
        $progress->attempts()->delete();
        $nowMs = (int) round(microtime(true) * 1000);
        $settings = array_merge(self::SETTING_DEFAULTS, ($progress->state ?? [])['settings'] ?? []);
        $state = ['settings' => $settings, 'parentEditAt' => $nowMs, 'updatedAt' => $nowMs, 'reset' => true];
        $progress->update(['state' => $state, 'summary' => $this->summarize($state)]);
    }
}
