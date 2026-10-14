<?php

namespace App\Games;

/** Gizmo Garage — forces, gears, pulleys, levers, ramps and simple machines. Levels must match public/games/{key}/game.js */
class GizmoGarage extends LearningGame
{
    public const TRACK = 'machines';
    public const SKILL = ['⚙️', 'Machines'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['⚙️', 'gears'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#fff1e3', 'bg2' => '#e9f1ff', 'accent' => '#e06a1b', 'accent-d' => '#a64a0d', 'soft' => '#ffe3cc'];

    public const LEVELS = [
        1 => ['Push or Pull?', 'K'],
        2 => ['Wheels & Rolling', 'K-1'],
        3 => ['Ramps', '1'],
        4 => ['Levers', '1-2'],
        5 => ['Gears: Which Way?', '2-3'],
        6 => ['Gears: How Fast?', '3'],
        7 => ['Pulleys', '3-4'],
        8 => ['Screws & Wedges', '4'],
        9 => ['Machines Inside Machines', '4-5'],
        10 => ["Engineer's Challenge", '5'],
    ];
}
