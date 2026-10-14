<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One chat message between a kid and a grown-up playing along. */
class ChatMessage extends Model
{
    protected $fillable = ['user_id', 'kid_id', 'game', 'coop_session_id', 'from_kid', 'sender', 'color', 'body'];

    protected $casts = ['from_kid' => 'boolean'];

    public function kid(): BelongsTo
    {
        return $this->belongsTo(Kid::class);
    }
}
