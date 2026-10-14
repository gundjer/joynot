<?php

namespace App\Games;

/** Lumi's Light-Up Lab — circuits, conductors and insulators. Levels must match public/games/{key}/game.js */
class LightUpLab extends LearningGame
{
    public const TRACK = 'circuits';
    public const DARK = true;
    public const SKILL = ['⚡', 'Circuits'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['💡', 'bulbs lit'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#fff8d9', 'bg2' => '#e4ecff', 'accent' => '#f0a400', 'accent-d' => '#b67800', 'soft' => '#fff1bf'];

    public const LEVELS = [
        1 => ['What Is a Circuit?', 'K-1'],
        2 => ['Turn the Corners', '1'],
        3 => ['Bigger Boards', '1-2'],
        4 => ['Conductors & Insulators', '2'],
        5 => ['Switches', '2-3'],
        6 => ['Two Bulbs', '3'],
        7 => ['Resistors', '3-4'],
        8 => ['Capacitors', '4'],
        9 => ['Solar Power', '4'],
        10 => ['Wind Power', '4-5'],
        11 => ['Master Electrician', '5'],
    ];

    public function extraSettings(): array
    {
        return [
            'glow' => ['label' => '✨ Glow wires that touch the battery', 'hint' => 'Shows kids how far the electricity gets. Off is harder.', 'options' => ['on' => 'On (easier)', 'off' => 'Off (harder)'], 'default' => 'on'],
        ];
    }
}
