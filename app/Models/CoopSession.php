<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A kid's game that grown-ups can join (see CoopController). */
class CoopSession extends Model
{
    protected $fillable = ['user_id', 'kid_id', 'game', 'world', 'host_token', 'state', 'state_ver', 'host_seen_at', 'ended_at'];

    protected $casts = ['host_seen_at' => 'datetime', 'ended_at' => 'datetime'];

    protected $hidden = ['host_token', 'state'];

    public function kid(): BelongsTo
    {
        return $this->belongsTo(Kid::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(CoopMember::class);
    }

    /** Grown-ups still connected (seen in the last 20 seconds). */
    public function activeMembers()
    {
        return $this->members()->whereNull('left_at')->where('last_seen_at', '>=', now()->subSeconds(20));
    }

    /** The kid's game is open right now. */
    public function isLive(): bool
    {
        return ! $this->ended_at && $this->host_seen_at && $this->host_seen_at->gte(now()->subSeconds(25));
    }
}
