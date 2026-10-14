<?php

namespace App\Games;

/** Compass Cove — real maps: directions, map keys, grids, scale, latitude & longitude and (x, y). Levels must match public/games/{key}/game.js */
class CompassCove extends LearningGame
{
    public const TRACK = 'maps';
    public const SKILL = ['🗺️', 'Maps'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['💰', 'treasure bags'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#e3f7ff', 'bg2' => '#fff3d6', 'accent' => '#1c8fc9', 'accent-d' => '#136a96', 'soft' => '#d9f1fb'];

    public const LEVELS = [
        1 => ['Up, Down, Left, Right', 'K'],
        2 => ['North, South, East, West', 'K-1'],
        3 => ['Map Keys', '1'],
        4 => ['Two-Step Directions', '1'],
        5 => ['Grid Maps: Find the Square', '1-2'],
        6 => ['Fly to a Square', '2'],
        7 => ['Treasure Trails', '2-3'],
        8 => ['Map Scale: How Far?', '3'],
        9 => ['In-Between Directions', '3-4'],
        10 => ['Which Way From Here?', '4'],
        11 => ['Latitude & Longitude', '4-5'],
        12 => ['Coordinate Plane (x, y)', '5'],
    ];

    public function extraSettings(): array
    {
        return [
            'compass' => ['label' => '🧭 Compass rose on the map', 'options' => ['on' => 'Always show it', 'help' => 'Only when Help is tapped (harder)'], 'default' => 'on'],
            'words' => ['label' => '🔤 Direction words', 'options' => ['full' => 'Full words (North)', 'letters' => 'Letters (N)'], 'default' => 'full'],
        ];
    }
}
