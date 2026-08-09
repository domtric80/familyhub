<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InternalMessageThread extends Model
{
    public const TYPE_FACILITY = 'facility';
    public const TYPE_MINOR = 'minor';

    protected $fillable = [
        'facility_id',
        'minor_id',
        'thread_type',
        'subject',
        'topic',
        'classification_code',
        'created_by_user_id',
        'updated_by_user_id',
        'last_message_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function documentClassification(): BelongsTo
    {
        return $this->belongsTo(DocumentClassification::class, 'classification_code', 'code');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(InternalMessageThreadParticipant::class, 'thread_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(InternalMessageMessage::class, 'thread_id')->orderBy('created_at');
    }
}
