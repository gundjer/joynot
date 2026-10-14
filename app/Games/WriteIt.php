<?php

namespace App\Games;

/** Write It! — handwriting with a finger, mouse or stylus. Levels must match public/games/{key}/game.js */
class WriteIt extends LearningGame
{
    public const TRACK = 'writing';
    public const SKILL = ['✏️', 'Handwriting'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['🖍️', 'crayons'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#eef6ff', 'bg2' => '#fff2e6', 'accent' => '#3a7bd5', 'accent-d' => '#2858a0', 'soft' => '#e2edff'];

    public const LEVELS = [
        1 => ['Lines & Shapes', 'K'],
        2 => ['Numbers 0–9', 'K'],
        3 => ['Capitals: Straight Lines', 'K'],
        4 => ['Capitals: Slanted Lines', 'K-1'],
        5 => ['Capitals: Curvy Letters', '1'],
        6 => ['Lowercase: Magic C Letters', '1'],
        7 => ['All Lowercase Letters', '1-2'],
        8 => ['Words', '2'],
        9 => ['Names & Sentences', '2-3'],
    ];

    public function extraSettings(): array
    {
        return [
            'guide' => ['label' => '👉 Tracing guide', 'hint' => 'Auto: full gray path to trace for levels 1–6, a faded guide after that (watch → trace → write on your own).', 'options' => ['auto' => 'Auto (recommended)', 'trace' => 'Always show the full path', 'fade' => 'Always faded (harder)'], 'default' => 'auto'],
        ];
    }
}
