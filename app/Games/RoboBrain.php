<?php

namespace App\Games;

/** Robo Brain — what AI is, how it learns, and how to use it wisely. Levels must match public/games/{key}/game.js */
class RoboBrain extends LearningGame
{
    public const TRACK = 'ai';
    public const DARK = true;
    public const SKILL = ['🤖', 'AI'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['💾', 'data chips'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#eef0ff', 'bg2' => '#e6fbff', 'accent' => '#6a4cff', 'accent-d' => '#4a2fd1', 'soft' => '#e6e2ff'];

    public const LEVELS = [
        1 => ['What Is AI?', 'K'],
        2 => ['Teach the Robot', 'K-1'],
        3 => ['Finding Patterns', '1'],
        4 => ['More Examples, Smarter AI', '2'],
        5 => ['When AI Makes Mistakes', '2-3'],
        6 => ['Decision Trees', '3'],
        7 => ['How Sure Is the Robot?', '3-4'],
        8 => ['Chatbots & Prompts', '4'],
        9 => ['Using AI Wisely', '4-5'],
        10 => ['Neural Networks', '5'],
    ];
}
