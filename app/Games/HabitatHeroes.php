<?php

namespace App\Games;

/** Habitat Heroes — science: animals, habitats, food chains. Levels must match public/games/{key}/game.js */
class HabitatHeroes extends LearningGame
{
    public const TRACK = 'science';
    public const SKILL = ['🔬', 'Science'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['🌿', 'leaves'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#eafbe7', 'bg2' => '#d8f1ff', 'accent' => '#2f9e5b', 'accent-d' => '#1f7442', 'soft' => '#e3f6dd'];

    public const LEVELS = [
        1 => ['Water or Land', 'K'],
        2 => ['Ocean, Forest, Desert', 'K'],
        3 => ['Add the Icy Poles', 'K-1'],
        4 => ['Six Habitats', '1'],
        5 => ['What Animals Eat', '1-2'],
        6 => ['Body Parts That Help', '2-3'],
        7 => ['Food Chains', '3-4'],
        8 => ['Food Web Jobs', '4-5'],
        9 => ['When Things Change', '5'],
    ];

    public function extraSettings(): array
    {
        return [
            'explain' => ['label' => '📚 Show a fun fact after each answer', 'options' => ['on' => 'Yes', 'off' => 'No'], 'default' => 'on'],
        ];
    }
}
