<?php

namespace App\Games;

/** Time Tunnel Sorters — putting history in order. Levels must match public/games/{key}/game.js */
class TimeTunnelSorters extends LearningGame
{
    public const TRACK = 'history';
    public const DARK = true;
    public const SKILL = ['🏛️', 'History'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['⏳', 'time crystals'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#f3eaff', 'bg2' => '#ffeede', 'accent' => '#7b4fd6', 'accent-d' => '#5a33a8', 'soft' => '#efe5ff'];

    public const LEVELS = [
        1 => ['First, Next, Last', 'K'],
        2 => ['Long Ago or Today?', 'K-1'],
        3 => ['Growing & Changing', '1'],
        4 => ['Old to New Inventions', '1-2'],
        5 => ['Invention Timeline', '2-3'],
        6 => ['Big Moments in History', '3'],
        7 => ['Which Came First?', '3-4'],
        8 => ['Centuries', '4-5'],
        9 => ['History Timeline Pro', '5'],
    ];

    public function extraSettings(): array
    {
        return [
            'topics' => ['label' => '📚 History topics', 'hint' => 'Used from level 4 up.', 'options' => ['all' => 'Everything', 'inventions' => 'Inventions only', 'events' => 'US & world history only'], 'default' => 'all'],
            'years' => ['label' => '📅 Years on the cards', 'options' => ['after' => 'Show after checking', 'always' => 'Always show (easier)'], 'default' => 'after'],
        ];
    }
}
