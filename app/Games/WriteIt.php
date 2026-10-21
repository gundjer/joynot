<?php

namespace App\Games;

/** Quillbound — handwriting, sentence spells and story scrolls. The saved write-it key stays compatible. */
class WriteIt extends LearningGame
{
    public const TRACK = 'writing';
    public const SKILL = ['✏️', 'Writing'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['🪙', 'gold tokens'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#f7efdc', 'bg2' => '#e6eee2', 'accent' => '#4b8078', 'accent-d' => '#315b59', 'soft' => '#e1ebdf'];

    public const LEVELS = [
        1 => ['Lines & Shapes', 'K'],
        2 => ['Numbers 0–9', 'K'],
        3 => ['Capitals: Straight Lines', 'K'],
        4 => ['Capitals: Slanted Lines', 'K-1'],
        5 => ['Capitals: Curvy Letters', '1'],
        6 => ['Lowercase: Magic C Letters', '1'],
        7 => ['All Lowercase Letters', '1-2'],
        8 => ['Words', '2'],
        9 => ['Sentence Spells', '2-3'],
        10 => ['Story Scrolls & Paragraphs', '3'],
    ];

    public function extraSettings(): array
    {
        return [
            'guide' => ['label' => '👉 Tracing guide', 'hint' => 'Auto: full gray path to trace for levels 1–6, a faded guide after that (watch → trace → write on your own).', 'options' => ['auto' => 'Auto (recommended)', 'trace' => 'Always show the full path', 'fade' => 'Always faded (harder)'], 'default' => 'auto'],
        ];
    }
}
