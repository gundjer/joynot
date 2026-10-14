<?php

namespace App\Games;

/** Coco's Budget Island — needs and wants, saving, spending and budgeting. Levels must match public/games/{key}/game.js */
class BudgetIsland extends LearningGame
{
    public const TRACK = 'budget';
    public const SKILL = ['🏝️', 'Budgeting'];
    public const GRADE_FROM = 'math';
    public const TOKEN = ['🥥', 'coconuts'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#e0fbf6', 'bg2' => '#fff3d9', 'accent' => '#14a38b', 'accent-d' => '#0c7564', 'soft' => '#d2f5ee'];

    public const LEVELS = [
        1 => ['Needs or Wants', 'K-1'],
        2 => ['Can I Buy It?', '1'],
        3 => ['What Is Left?', '1-2'],
        4 => ['Saving Goals', '2-3'],
        5 => ['Save, Spend, Share', '3'],
        6 => ['Earning Money', '3-4'],
        7 => ['Best Deal', '4'],
        8 => ['Budget Planner', '4-5'],
        9 => ['Growing Savings', '5'],
    ];

    public function extraSettings(): array
    {
        return [
        ];
    }
}
