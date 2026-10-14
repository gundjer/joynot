<?php

namespace App\Games;

/** Lemonade Lane — money math at a lemonade stand. Levels must match public/games/{key}/game.js */
class LemonadeLane extends LearningGame
{
    public const TRACK = 'money';
    public const SKILL = ['💰', 'Money math'];
    public const GRADE_FROM = 'math';
    public const TOKEN = ['🍋', 'lemons'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#fffbd6', 'bg2' => '#ffe9ef', 'accent' => '#e5a800', 'accent-d' => '#a87a00', 'soft' => '#fff3b0'];

    public const LEVELS = [
        1 => ['Count the Cups', 'K'],
        2 => ['Add Two Prices', '1'],
        3 => ['Whole Dollars', '1-2'],
        4 => ['Dollars and Cents', '2-3'],
        5 => ['Enough Money?', '3'],
        6 => ['How Many Can I Buy?', '3'],
        7 => ['Profit', '3-4'],
        8 => ['Big Orders', '4'],
        9 => ['Sales & Discounts', '5'],
    ];

    public function extraSettings(): array
    {
        return [
            'answer' => ['label' => '✍️ How to answer', 'options' => ['pad' => 'Type it on a number pad', 'pick' => 'Pick from 4 answers (easier)'], 'default' => 'pad'],
        ];
    }
}
