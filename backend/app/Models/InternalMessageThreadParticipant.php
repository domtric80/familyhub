<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternalMessageThreadParticipant extends Model
{
    protected $fillable = [
        'thread_id',
        'user_id',
        'joined_at',
        'last_read_at',
        'is_active',
        'added_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'last_read_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(InternalMessageThread::class, 'thread_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by_user_id');
    }
}
