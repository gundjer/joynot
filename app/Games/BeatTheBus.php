<?php

namespace App\Games;

/** Beat the Bus — elapsed time and schedules. Levels must match public/games/{key}/game.js */
class BeatTheBus extends LearningGame
{
    public const TRACK = 'time';
    public const SKILL = ['🚌', 'Elapsed time'];
    public const GRADE_FROM = 'math';
    public const TOKEN = ['🎟️', 'tickets'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#fff7d1', 'bg2' => '#e3f0ff', 'accent' => '#f2a20c', 'accent-d' => '#b07200', 'soft' => '#ffeeb3'];

    public const LEVELS = [
        1 => ['One Hour Later', '1'],
        2 => ['Half an Hour Later', '1-2'],
        3 => ['Minutes Later', '2'],
        4 => ['Over the Hour', '2-3'],
        5 => ['How Long Did It Take?', '3'],
        6 => ['When Did It Start?', '3-4'],
        7 => ['Across Noon (AM/PM)', '4'],
        8 => ['Busy Schedules', '4-5'],
    ];

    public function extraSettings(): array
    {
        return [
            'timeline' => ['label' => '📏 Time-line helper', 'options' => ['help' => 'When Help is tapped', 'always' => 'Always show it', 'never' => 'Never'], 'default' => 'help'],
        ];
    }
}
