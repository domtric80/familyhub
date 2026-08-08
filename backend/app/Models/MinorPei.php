<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MinorPei extends Model
{
    use HasFactory;

    protected $fillable = [
        'minor_id',
        'title',
        'summary',
        'start_date',
        'review_date',
        'end_date',
        'status',
        'digital_signature_status',
        'signed_at',
        'signed_by_user_id',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'review_date' => 'date',
            'end_date' => 'date',
            'signed_at' => 'datetime',
        ];
    }

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function objectives(): HasMany
    {
        return $this->hasMany(MinorPeiObjective::class)->orderBy('id');
    }

    public function signedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function historyEntries(): HasMany
    {
        return $this->hasMany(MinorPeiHistoryEntry::class)->orderByDesc('created_at')->orderByDesc('id');
    }
}
