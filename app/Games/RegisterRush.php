<?php

namespace App\Games;

/** Register Rush — paying and making change. Levels must match public/games/{key}/game.js */
class RegisterRush extends LearningGame
{
    public const TRACK = 'change';
    public const SKILL = ['🧾', 'Making change'];
    public const GRADE_FROM = 'math';
    public const TOKEN = ['😊', 'happy customers'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#eaf6ff', 'bg2' => '#fff0e0', 'accent' => '#3a7bd5', 'accent-d' => '#2858a0', 'soft' => '#dcebff'];

    public const LEVELS = [
        1 => ['Pay with Dollar Bills', 'K-1'],
        2 => ['Pay with $1 and $5', '1'],
        3 => ['Pay Exact Coins', '2'],
        4 => ['Change from $1', '2'],
        5 => ['Change from $5', '2-3'],
        6 => ['Change from $10 & $20', '3'],
        7 => ['Two Items', '3-4'],
        8 => ['Tax & Discounts', '4-5'],
    ];

    public function extraSettings(): array
    {
        return [
            'total' => ['label' => '🧮 Show the running total', 'options' => ['on' => 'On (easier)', 'off' => 'Off (harder)'], 'default' => 'on'],
        ];
    }
}
