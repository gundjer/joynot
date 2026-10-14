<?php

namespace App\Games;

/** Tick-Tock Clock Shop — set the clock hands. Levels must match public/games/{key}/game.js */
class ClockShop extends LearningGame
{
    public const TRACK = 'time';
    public const SKILL = ['⏰', 'Telling time'];
    public const GRADE_FROM = 'math';
    public const TOKEN = ['🔧', 'gears'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#fff2e0', 'bg2' => '#e6f2ff', 'accent' => '#e2683c', 'accent-d' => '#a94822', 'soft' => '#ffe6cf'];

    public const LEVELS = [
        1 => ["O'Clock", 'K-1'],
        2 => ['Half Past', '1'],
        3 => ['Quarter Past & To', '1-2'],
        4 => ['5-Minute Times', '2'],
        5 => ['Time Words', '2-3'],
        6 => ['To the Minute', '3'],
        7 => ['AM or PM?', '3'],
        8 => ['24-Hour Time', '4'],
    ];

    public function extraSettings(): array
    {
        return [
        ];
    }
}
