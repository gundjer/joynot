<?php

namespace App\Games;

use App\Models\GameProgress;
use App\Models\Kid;

/**
 * One mini-game on JoyNot.
 *
 * To add a game:
 *  1. Put its files in public/games/{key}/ and its page in resources/views/games/{key}/play.blade.php
 *  2. Make a class like RustysAfterHours that extends this one
 *  3. Add it to 'games' in config/joynot.php
 */
abstract class Game
{
    public function __construct(public readonly string $key, protected array $config)
    {
    }

    public function key(): string { return $this->key; }
    public function title(): string { return $this->config['title'] ?? $this->key; }
    public function description(): string { return $this->config['description'] ?? ''; }
    public function cover(): ?string { return $this->config['cover'] ?? null; }
    public function skills(): array { return $this->config['skills'] ?? []; }
    public function ages(): ?string { return $this->config['ages'] ?? null; }
    public function theme(): string { return $this->config['theme'] ?? 'bright'; }
    public function version(): string { return (string) ($this->config['version'] ?? '1'); }

    /** Blade view for the game page. */
    public function playView(): string
    {
        return "games.{$this->key}.play";
    }

    /** Extra response headers for the game page (e.g. microphone permission). */
    public function playHeaders(): array
    {
        return [];
    }

    // ---------------------------------------------------------------- saving

    /** Called every time the game saves. Return a stale response array to make the game reload, or null to accept. */
    public function beforeSave(GameProgress $progress, array $incoming): ?array
    {
        return null;
    }

    /** Pull the small numbers (levels etc.) out of a save so cards/reports don't need to read the whole save. */
    public function summarize(array $state): array
    {
        return [];
    }

    /** Validation rules for each logged answer (the game sends a list called "attempts"). */
    public function attemptRules(): array
    {
        return [
            'attempts' => 'required|array|max:500',
            'attempts.*.track' => 'required|string|max:20',
            'attempts.*.level' => 'required|integer|min:1|max:1000',
            'attempts.*.prompt' => 'required|string',
            'attempts.*.expected' => 'required|string',
            'attempts.*.heard' => 'nullable|string',
            'attempts.*.correct' => 'boolean',
            'attempts.*.first_try' => 'boolean',
            'attempts.*.helped' => 'boolean',
            'attempts.*.review' => 'boolean',
            'attempts.*.at' => 'nullable|string',
        ];
    }

    // ---------------------------------------------------------------- grown-ups

    /** Little chips for the kid's game card, e.g. [['📖', 'Level 3']]. */
    public function badges(?GameProgress $progress): array
    {
        return [];
    }

    /** One-line rows for the Grown-ups overview, e.g. ['Reading' => 'Level 3 (Short O, U, E)']. */
    public function overview(?GameProgress $progress): array
    {
        return [];
    }

    /** Partial with the per-kid settings fields (inside the settings form), or null if none. */
    public function settingsView(): ?string
    {
        return null;
    }

    public function settingsRules(): array
    {
        return [];
    }

    /** Values the settings form shows. */
    public function settingsFor(GameProgress $progress): array
    {
        return [];
    }

    /** Save the grown-up's settings for this kid. */
    public function saveSettings(GameProgress $progress, array $data): void
    {
    }

    /** Partial with the detailed progress report, or null. */
    public function reportView(): ?string
    {
        return null;
    }

    public function reportData(Kid $kid, GameProgress $progress): array
    {
        return [];
    }

    /**
     * The grown-up picked school grades for the kid (on Add kid, or "Match game levels" on Edit).
     * $grades = ['grade' => 'K', 'reading' => 'K', 'math' => '1', 'goal' => '3'] — keys from config joynot.grades, may be null.
     * Set this game's starting levels to match.
     */
    public function applyGrades(GameProgress $progress, array $grades): void
    {
    }

    // ---------------------------------------------------------------- play together

    /** Can grown-ups join this game from their own phone (Grown-ups → Join)? */
    public function supportsCoop(): bool
    {
        return false;
    }

    /** Which "play together" extras are switched on for this kid: ['talk' => bool, 'video' => bool]. Both start OFF. */
    public function together(GameProgress $progress): array
    {
        return ['talk' => false, 'video' => false];
    }

    /** The two "Play together" switches every game shows at the top of its settings (both start OFF). */
    public static function togetherSettings(): array
    {
        return [
            'talk' => [
                'label' => '🎙️ Talk & 💬 Chat with grown-ups',
                'hint' => 'When a grown-up joins from the Grown-ups page, they can talk (hold-to-talk) and send chat messages. Messages are read aloud to the kid. Kids in 3rd–5th grade can also type back. Chat is saved on this page so you can read or delete it. Voice is never saved.',
                'options' => ['off' => 'Off', 'on' => 'On'],
                'default' => 'off',
                'toggle' => true,
            ],
            'video' => [
                'label' => '📹 Grown-up video bubble',
                'hint' => 'A small video of the grown-up’s face in the corner of the kid’s game (the kid’s camera is never used). Uses more data and battery.',
                'options' => ['off' => 'Off', 'on' => 'On'],
                'default' => 'off',
                'toggle' => true,
            ],
        ];
    }

    /** Start this kid over in this game. */
    public function reset(GameProgress $progress): void
    {
        $progress->attempts()->delete();
        $progress->update(['state' => null, 'summary' => []]);
    }
}
