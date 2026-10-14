<?php

namespace App\Games;

/** Signal Squad — how computers, phones and the internet work, and online safety. Levels must match public/games/{key}/game.js */
class SignalSquad extends LearningGame
{
    public const TRACK = 'tech';
    public const DARK = true;
    public const SKILL = ['📡', 'Tech'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['📶', 'signal bars'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#e6fbf7', 'bg2' => '#e9eeff', 'accent' => '#0f9d8a', 'accent-d' => '#0a6f62', 'soft' => '#d6f4ee'];

    public const LEVELS = [
        1 => ['What Is a Computer?', 'K'],
        2 => ['Parts of a Phone', 'K-1'],
        3 => ['Input & Output', '1-2'],
        4 => ['Staying Safe Online', '2'],
        5 => ['Bits & Binary', '2-3'],
        6 => ['Wi-Fi & Cell Towers', '3'],
        7 => ['Packets', '3-4'],
        8 => ['How a Message Travels', '4'],
        9 => ['Addresses & the Cloud', '4-5'],
        10 => ['Phone Science', '5'],
    ];
}
