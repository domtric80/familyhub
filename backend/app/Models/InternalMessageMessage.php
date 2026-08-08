<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class InternalMessageMessage extends Model
{
    protected $fillable = [
        'thread_id',
        'sender_user_id',
        'body_encrypted',
    ];

    protected $hidden = [
        'body_encrypted',
    ];

    protected $appends = [
        'body',
    ];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(InternalMessageThread::class, 'thread_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function getBodyAttribute(): ?string
    {
        if (! $this->body_encrypted) {
            return null;
        }

        return Crypt::decryptString($this->body_encrypted);
    }
}
