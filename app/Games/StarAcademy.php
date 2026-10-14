<?php

namespace App\Games;

/** Star Academy — the Sun, planets, Moon, orbits and satellites. Levels must match public/games/{key}/game.js */
class StarAcademy extends LearningGame
{
    public const TRACK = 'space';
    public const DARK = true;
    public const PLAY = true;
    public const SKILL = ['🚀', 'Space'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['⭐', 'stars'];
    public const COLORS = ['bg1' => '#e8ecff', 'bg2' => '#f3e6ff', 'accent' => '#5b5bd6', 'accent-d' => '#3d3da8', 'soft' => '#e3e6ff'];

    public const LEVELS = [
        1 => ['Day & Night Sky', 'K'],
        2 => ['Our Sun Is a Star', 'K-1'],
        3 => ['Planets in Order', '1'],
        4 => ['Planet Facts', '2'],
        5 => ['Spin & Orbit', '2-3'],
        6 => ['Moon Phases', '3'],
        7 => ['Gravity & Orbits', '3-4'],
        8 => ['How Satellites Help Us', '4'],
        9 => ['Missions & Light-Years', '4-5'],
        10 => ['Space Scientist', '5'],
    ];
}
