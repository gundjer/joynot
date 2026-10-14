<?php

namespace App\Games;

/** Beep's Code Quest — sequencing, loops and if/then. Levels must match public/games/{key}/game.js */
class CodeQuest extends LearningGame
{
    public const TRACK = 'coding';
    public const DARK = true;
    public const SKILL = ['💻', 'Coding'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['🔋', 'batteries'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#e7fbff', 'bg2' => '#eae6ff', 'accent' => '#00a3b8', 'accent-d' => '#007585', 'soft' => '#d9f6fa'];

    public const LEVELS = [
        1 => ['Arrow Steps', 'K'],
        2 => ['Arrow Paths', 'K-1'],
        3 => ['Turn Left, Turn Right', '1-2'],
        4 => ['Jump the Rocks', '2'],
        5 => ['Predict the Path', '2-3'],
        6 => ['Debug It!', '3'],
        7 => ['Repeat Loops', '3-4'],
        8 => ['Loops With Turns', '4'],
        9 => ['If / Else', '4-5'],
        10 => ['Loop + If Master', '5'],
    ];

    public function extraSettings(): array
    {
        return [
            'speed' => ['label' => '🤖 Robot speed', 'options' => ['slow' => 'Slow', 'normal' => 'Normal', 'fast' => 'Fast'], 'default' => 'normal'],
        ];
    }
}
