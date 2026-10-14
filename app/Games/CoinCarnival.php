<?php

namespace App\Games;

/** Penny's Coin Carnival — coin names, values and counting money. Levels must match public/games/{key}/game.js */
class CoinCarnival extends LearningGame
{
    public const TRACK = 'coins';
    public const SKILL = ['🐷', 'Coins'];
    public const GRADE_FROM = 'math';
    public const TOKEN = ['🎟️', 'tickets'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#ffeef6', 'bg2' => '#e9f7ff', 'accent' => '#ef5aa0', 'accent-d' => '#b33a74', 'soft' => '#ffdcec'];

    public const LEVELS = [
        1 => ['Know Your Coins', 'K'],
        2 => ['Coin Values', 'K'],
        3 => ['Pennies & Nickels', 'K-1'],
        4 => ['Add Dimes', '1'],
        5 => ['Add Quarters', '1-2'],
        6 => ['Count the Pile', '2'],
        7 => ['Fewest Coins', '2-3'],
        8 => ['Bills and Coins', '3'],
    ];

    public function extraSettings(): array
    {
        return [
            'values' => ['label' => '🔢 Numbers on the coins', 'options' => ['auto' => 'Auto (show for levels 3–5)', 'always' => 'Always show', 'never' => 'Hide (harder)'], 'default' => 'auto'],
            'total' => ['label' => '🐷 Show the piggy bank total while counting', 'options' => ['on' => 'On (easier)', 'off' => 'Off (harder)'], 'default' => 'on'],
        ];
    }
}
