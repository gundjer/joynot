<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameProgress extends Model
{
    protected $table = 'game_progress';

    protected $fillable = ['kid_id', 'game', 'state', 'summary', 'hidden', 'plays', 'last_played_at'];

    protected $casts = [
        'state' => 'array',
        'summary' => 'array',
        'hidden' => 'boolean',
        'last_played_at' => 'datetime',
    ];

    public function kid(): BelongsTo
    {
        return $this->belongsTo(Kid::class);
    }

    public function attempts()
    {
        return GameAttempt::where('kid_id', $this->kid_id)->where('game', $this->game);
    }
}
