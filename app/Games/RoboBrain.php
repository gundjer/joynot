<?php

namespace App\Games;

/** Robo Brain â€” what AI is, how it learns, and how to use it wisely. Levels must match public/games/{key}/game.js */
class RoboBrain extends LearningGame
{
    public function playView(): string
    {
        return 'games.robo-brain.play';
    }

    public function reportView(): ?string
    {
        return 'games.robo-brain.report';
    }

    public function settingsSchema(): array
    {
        $schema = array_intersect_key(parent::settingsSchema(), array_flip(['talk', 'video', 'voice', 'sfx', 'music']));
        $schema['voice']['label'] = 'Spoken instructions and coaching';
        $schema['voice']['hint'] = 'Recommended for early readers: the robot explains each step, object selection, and demonstration aloud.';

        return $schema;
    }

    public function badges(?\App\Models\GameProgress $progress): array
    {
        $completed = (array) data_get($progress?->state, 'extra.academyCompleted', []);

        return [['🤖', 'AI academy'], ['🏆', count($completed).' missions']];
    }

    public function overview(?\App\Models\GameProgress $progress): array
    {
        $state = $progress?->state ?? [];
        $level = max(1, min(10, (int) ($state['level'] ?? 1)));

        return [
            '🤖 AI academy' => self::LEVELS[$level][0].' · Grade '.self::LEVELS[$level][1],
            '🏆 Team missions' => count((array) data_get($state, 'extra.academyCompleted', [])),
            '🧭 Adventure teaching actions' => (int) data_get($state, 'extra.academyMetrics.explorations', 0),
            '📥 Child labels' => (int) data_get($state, 'extra.academyMetrics.labels', 0),
            '🧠 Team training runs' => (int) data_get($state, 'extra.academyMetrics.trains', 0),
            '🚚 Team test runs' => (int) data_get($state, 'extra.academyMetrics.tests', 0),
        ];
    }

    public const TRACK = 'ai';
    public const DARK = true;
    public const SKILL = ['ðŸ¤–', 'AI'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['ðŸ’¾', 'data chips'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#eef0ff', 'bg2' => '#e6fbff', 'accent' => '#6a4cff', 'accent-d' => '#4a2fd1', 'soft' => '#e6e2ff'];

    public const LEVELS = [
        1 => ['First Robot Teacher', 'K'],
        2 => ['Guided Robot Practice', 'K-1'],
        3 => ['Different Examples', '1'],
        4 => ['Training Explorer', '2'],
        5 => ['Repair the Examples', '2-3'],
        6 => ['Choose Useful Features', '3'],
        7 => ['Feature Investigator', '3-4'],
        8 => ['Ask a Human', '4'],
        9 => ['Careful AI Testing', '4-5'],
        10 => ['Model Workshop', '5'],
    ];
}
