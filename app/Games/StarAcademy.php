<?php

namespace App\Games;

/** Galaxy Spiral: grade-scaled space tours and memory challenges. */
class StarAcademy extends LearningGame
{
    public function playView(): string
    {
        return 'games.star-academy.play';
    }

    public function settingsSchema(): array
    {
        // Expeditions use the grade selected by the grown-up, without quiz-engine modes or mastery gates.
        return array_intersect_key(parent::settingsSchema(), array_flip(['talk', 'video', 'voice', 'sfx', 'music']));
    }

    public const TRACK = 'space';
    public const DARK = true;
    public const PLAY = true;
    public const SKILL = ['🚀', 'Space'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['⭐', 'stars'];
    public const COLORS = ['bg1' => '#e8ecff', 'bg2' => '#f3e6ff', 'accent' => '#5b5bd6', 'accent-d' => '#3d3da8', 'soft' => '#e3e6ff'];

    public const LEVELS = [
        1 => ['First Discoveries', 'K'],
        2 => ['Short Space Stories', 'K-1'],
        3 => ['Rookie Explorer', '1'],
        4 => ['Cosmic Recall', '2'],
        5 => ['Science Story Missions', '2-3'],
        6 => ['Space Investigator', '3'],
        7 => ['Orbit Detective', '3-4'],
        8 => ['Mission Specialist', '4'],
        9 => ['Deep Space Memory', '4-5'],
        10 => ['Galaxy Historian', '5'],
    ];
}
