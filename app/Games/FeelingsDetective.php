<?php

namespace App\Games;

/** Feelings Detective — naming feelings, calming down, being a good friend. Levels must match public/games/{key}/game.js */
class FeelingsDetective extends LearningGame
{
    public const TRACK = 'feelings';
    public const SKILL = ['💛', 'Feelings'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['🔍', 'clues'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#fff0f3', 'bg2' => '#fff7da', 'accent' => '#e2557a', 'accent-d' => '#a93556', 'soft' => '#ffe1e8'];

    public const LEVELS = [
        1 => ['Name That Face', 'K'],
        2 => ['More Faces', 'K-1'],
        3 => ['How Would You Feel?', '1'],
        4 => ['Calm-Down Tools', '1-2'],
        5 => ['Being a Good Friend', '2-3'],
        6 => ['Big Feeling Words', '3'],
        7 => ['Solving Problems', '3-4'],
        8 => ['Two Feelings at Once', '4-5'],
        9 => ['Walk in Their Shoes', '5'],
    ];

    public function extraSettings(): array
    {
        return [
            'explain' => ['label' => '📚 Explain each answer', 'hint' => 'Scout says why after every answer.', 'options' => ['on' => 'Yes (recommended)', 'off' => 'No'], 'default' => 'on'],
        ];
    }
}
