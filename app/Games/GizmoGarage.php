<?php

namespace App\Games;

use App\Models\GameProgress;
use App\Models\Kid;

/** Interactive workshop. Level names and grades match public/games/gizmo-garage/jobs.js. */
class GizmoGarage extends LearningGame
{
    public function settingsView(): ?string
    {
        return 'games.gizmo-garage.settings';
    }
    public function settingsSchema(): array
    {
        return array_merge(static::togetherSettings(), [
            'voice' => ['label' => 'Spoken workshop guidance', 'options' => ['on' => 'On', 'off' => 'Off'], 'default' => 'on'],
            'sfx' => ['label' => 'Machine sound effects', 'options' => ['on' => 'On', 'off' => 'Off'], 'default' => 'on'],
        ]);
    }

    public function saveSettings(GameProgress $progress, array $data): void
    {
        parent::saveSettings($progress, $data);
        $state = $progress->state;
        $garage = data_get($state, 'extra.garage2', []);
        $garage['grade'] = intdiv(max(1, min(12, (int) $data['level'])) - 1, 2);
        $garage['voice'] = ($data['voice'] ?? 'on') === 'on';
        $garage['sound'] = ($data['sfx'] ?? 'on') === 'on';
        $state['extra']['garage2'] = $garage;
        $progress->update(['state' => $state]);
    }

    public function reportView(): ?string
    {
        return 'games.gizmo-garage.report';
    }

    public function reportData(Kid $kid, GameProgress $progress): array
    {
        return ['garage' => data_get($progress->state, 'extra.garage2', []), 'jobs' => self::LEVELS];
    }
    public const TRACK = 'machines';
    public const SKILL = ['⚙️', 'Machines'];
    public const GRADE_FROM = 'grade';
    public const TOKEN = ['⚙️', 'gears'];
    public const PLAY = true;
    public const COLORS = ['bg1' => '#fff1e3', 'bg2' => '#e9f1ff', 'accent' => '#e06a1b', 'accent-d' => '#a64a0d', 'soft' => '#ffe3cc'];

    public const LEVELS = [
        1 => ['Market Day Delivery', 'K'],
        2 => ['Toy Rescue Run', 'K'],
        3 => ['Apple Delivery Chute', '1'],
        4 => ['Marble Mail', '1'],
        5 => ['Lift the Garden Gate', '2'],
        6 => ['Rescue Platform', '2'],
        7 => ['Spin the Drying Fan', '3'],
        8 => ['Clockwork Repair', '3'],
        9 => ['The Apple Picker', '4'],
        10 => ['The Jammed Storehouse', '4'],
        11 => ['Loft Loading Challenge', '5'],
        12 => ['Water Tower Repair', '5'],
    ];
}
