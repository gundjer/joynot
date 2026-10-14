<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameAttempt extends Model
{
    protected $fillable = ['kid_id', 'game', 'track', 'level', 'prompt', 'expected', 'heard', 'correct', 'first_try', 'helped', 'review', 'answered_at'];

    protected $casts = [
        'correct' => 'boolean',
        'first_try' => 'boolean',
        'helped' => 'boolean',
        'review' => 'boolean',
        'answered_at' => 'datetime',
    ];

    public function kid(): BelongsTo
    {
        return $this->belongsTo(Kid::class);
    }
}
