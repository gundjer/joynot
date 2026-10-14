<?php

namespace App\Games;

/** Clock Dash — a real racing game: steer through the gate with the right time. Uses the Play engine (public/games/_play). Levels must match public/games/{key}/game.js */
class ClockDash extends LearningGame
{
    public const TRACK = 'time';
    public const DARK = true;
    public const PLAY = true;
    public const SKILL = ['⏱️', 'Time matching'];
    public const GRADE_FROM = 'math';
    public const TOKEN = ['🥕', 'carrots'];
    public const COLORS = ['bg1' => '#e9fff0', 'bg2' => '#fff0e3', 'accent' => '#2bb36b', 'accent-d' => '#1d8350', 'soft' => '#dcf7e6'];

    public const LEVELS = [
        1 => ["O'Clock Match", 'K-1'],
        2 => ['Half Hour Match', '1'],
        3 => ['Quarter Hours', '1-2'],
        4 => ['5-Minute Match', '2'],
        5 => ['Time Words Match', '2-3'],
        6 => ['Minute Match', '3'],
        7 => ['12-Hour to 24-Hour', '4'],
        8 => ['Time Unit Switch', '4-5'],
    ];

    public function extraSettings(): array
    {
        return [
            'speed' => ['label' => '🏎️ Race speed', 'hint' => 'How fast the road moves. Slower gives more time to read each clock.', 'options' => ['slow' => 'Slow', 'normal' => 'Normal', 'fast' => 'Fast'], 'default' => 'normal'],
        ];
    }
}
