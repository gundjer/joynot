<?php

namespace App\Games;

use App\Models\GameProgress;
use App\Models\Kid;

/**
 * Bee Smart: Hive Hero — fly a bee through 6 grade worlds, solve flower puzzles to pollinate them, make honey and build the hive.
 * Two skill ladders, mixed together in play:
 *  - LEVELS (reading track, the engine's level, starts from the kid's "Reads at" grade). Must match public/games/bee-smart/game.js
 *  - MATH_LEVELS (math track, saved in state.extra.math, starts from the kid's "Does math at" grade). Must match skills.js MATH.
 *    Math answers are logged on the 'math' track as level 100 + n.
 */
class BeeSmart extends LearningGame
{
    public const TRACK = 'literacy';
    public const SKILL = ['🐝', 'ABCs & spelling'];
    public const GRADE_FROM = 'reading';
    public const TOKEN = ['🍯', 'honey drops'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#fff9d6', 'bg2' => '#ffeedd', 'accent' => '#e0a000', 'accent-d' => '#9a6d00', 'soft' => '#fff0b3'];

    public const LEVELS = [
        1 => ['Letter Names', 'K'],
        2 => ['ABC Order', 'K'],
        3 => ['Letter Sounds', 'K'],
        4 => ['Big & Little Letters', '1'],
        5 => ['Build Short Words', '1'],
        6 => ['Blends & Digraphs', '1'],
        7 => ['Spelling Bee: Grade 2', '2'],
        8 => ['ABC Order of Words', '2'],
        9 => ['Spelling Bee: Grade 3', '3'],
        10 => ['Prefixes & Suffixes', '3'],
        11 => ['Spelling Bee: Grade 4', '4'],
        12 => ['More Word Parts', '4'],
        13 => ['Spelling Bee: Grade 5', '5'],
        14 => ['Greek & Latin Roots', '5'],
    ];

    public const MATH_LEVELS = [
        1 => ['Count to 10', 'K'],
        2 => ['Count to 20', 'K'],
        3 => ['Add Within 5', 'K'],
        4 => ['Take Away Within 5', 'K'],
        5 => ['Add Within 10', '1'],
        6 => ['Subtract Within 10', '1'],
        7 => ['Tens & Ones', '1'],
        8 => ['Add Within 20', '2'],
        9 => ['Subtract Within 20', '2'],
        10 => ['Skip Counting', '2'],
        11 => ['Add & Subtract to 100', '2'],
        12 => ['Equal Groups', '3'],
        13 => ['Times Tables', '3'],
        14 => ['Share Equally', '3'],
        15 => ['Big Add & Subtract', '4'],
        16 => ['Multiply Big Numbers', '4'],
        17 => ['Divide with Remainders', '4'],
        18 => ['Multiply 2-Digit by 2-Digit', '5'],
        19 => ['Long Division', '5'],
        20 => ['Two-Step Word Problems', '5'],
    ];

    public function clientConfig(): array
    {
        return parent::clientConfig() + [
            'mathLevels' => array_values(array_map(fn ($l) => ['name' => $l[0], 'grade' => $l[1]], static::MATH_LEVELS)),
        ];
    }

    /** Answers come from both ladders: reading (level 1–14) and math (level 101–120). */
    public function attemptRules(): array
    {
        $levels = array_merge(array_keys(static::LEVELS), array_map(fn ($n) => 100 + $n, array_keys(static::MATH_LEVELS)));

        return array_merge(parent::attemptRules(), [
            'attempts.*.track' => 'required|in:'.static::TRACK.',math',
            'attempts.*.level' => 'required|integer|in:'.implode(',', $levels),
        ]);
    }

    public function summarize(array $state): array
    {
        return parent::summarize($state) + [
            'mathLevel' => (int) data_get($state, 'extra.math.level', 0),
            'honey' => (int) data_get($state, 'extra.bee.honeyAll', 0),
            'rooms' => count((array) data_get($state, 'extra.bee.rooms', [])),
        ];
    }

    public function overview(?GameProgress $progress): array
    {
        $rows = parent::overview($progress);
        $s = $progress?->summary ?? [];
        $m = (int) ($s['mathLevel'] ?? 0);
        $new = [];
        foreach ($rows as $k => $v) {
            $new[$k] = $v;
            if (str_starts_with($k, static::SKILL[0])) {
                $new['🔢 Math'] = $m ? "Level {$m} · ".(static::MATH_LEVELS[$m][0] ?? '').' (Gr '.(static::MATH_LEVELS[$m][1] ?? '?').')' : 'starts at their math grade';
            }
        }
        $new['🍯 Hive'] = ($s['honey'] ?? 0).' honey made · '.($s['rooms'] ?? 0).' of 6 rooms built';

        return $new;
    }

    public function reportData(Kid $kid, GameProgress $progress): array
    {
        $data = parent::reportData($kid, $progress);
        $names = static::LEVELS;
        foreach (static::MATH_LEVELS as $n => [$name, $grade]) {
            $names[100 + $n] = ['🔢 '.$name, $grade];
        }
        $data['levelNames'] = $names;

        return $data;
    }
}
