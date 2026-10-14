<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A grown-up playing along on their own phone. */
class CoopMember extends Model
{
    protected $fillable = ['coop_session_id', 'token', 'name', 'color', 'last_seen_at', 'left_at'];

    protected $casts = ['last_seen_at' => 'datetime', 'left_at' => 'datetime'];

    public function session(): BelongsTo
    {
        return $this->belongsTo(CoopSession::class, 'coop_session_id');
    }
}
