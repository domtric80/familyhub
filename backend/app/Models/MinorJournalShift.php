<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MinorJournalShift extends Model
{
    protected $fillable = [
        'facility_id',
        'started_at',
        'ended_at',
        'title',
        'closing_notes',
        'opened_by_user_id',
        'closed_at',
        'closed_by_user_id',
        'closure_signature_type',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by_user_id');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by_user_id');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(MinorJournalEntry::class);
    }
}
