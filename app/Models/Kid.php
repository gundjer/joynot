<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kid extends Model
{
    protected $fillable = ['user_id', 'name', 'avatar', 'color', 'grade', 'reading_grade', 'math_grade', 'goal_grade', 'sort', 'legacy_player_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(GameProgress::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(GameAttempt::class);
    }

    /** This kid's save for one game (made on first use). */
    public function progressFor(string $game): GameProgress
    {
        return $this->progress()->firstOrCreate(['game' => $game]);
    }

    /** Info the game page needs about who is playing. */
    public function card(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar' => $this->avatar,
            'color' => $this->color,
            // school grade ('PK', 'K', '1' … '5'), so games can match how spooky or hard they are to the kid's age
            'grade' => $this->grade,
            // reading grade, so games know to read the answer choices aloud for little readers
            'reads' => $this->reading_grade ?: $this->grade,
            // math grade, so games with a math ladder (Bee Smart) start at the right level
            'math' => $this->math_grade ?: $this->grade,
        ];
    }

    /** Grades the grown-up picked: ['grade' => 'K', 'reading' => 'K', 'math' => '1', 'goal' => '3'] (null = not set). */
    public function grades(): array
    {
        return [
            'grade' => $this->grade,
            'reading' => $this->reading_grade ?: $this->grade,
            'math' => $this->math_grade ?: $this->grade,
            'goal' => $this->goal_grade,
        ];
    }

    public static function gradeName(?string $grade): string
    {
        if ($grade === null || $grade === '') {
            return 'Not set';
        }
        foreach (config('joynot.grades') as $k => $name) {
            if ((string) $k === (string) $grade) {
                return $name;
            }
        }

        return (string) $grade;
    }

    public static function cleanAvatar(?string $avatar, int $fallbackIndex = 0): string
    {
        $all = config('joynot.avatars');

        return in_array($avatar, $all, true) ? $avatar : $all[$fallbackIndex % count($all)];
    }

    public static function cleanColor(?string $color, int $fallbackIndex = 0): string
    {
        $all = config('joynot.colors');

        return (in_array($color, $all, true) || preg_match('/^#[0-9a-fA-F]{6}$/', (string) $color)) ? $color : $all[$fallbackIndex % count($all)];
    }
}
