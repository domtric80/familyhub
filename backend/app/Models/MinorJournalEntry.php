<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MinorJournalEntry extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'facility_id',
        'minor_id',
        'journal_entry_type_id',
        'observed_at',
        'title',
        'content',
        'priority_level',
        'mood_level',
        'nutrition_summary',
        'hygiene_summary',
        'sleep_summary',
        'pei_objective_id',
        'follow_up_required',
        'follow_up_notes',
        'handover_required',
        'handover_notes',
        'handover_read_at',
        'handover_read_by_user_id',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'observed_at' => 'datetime',
            'follow_up_required' => 'boolean',
            'handover_required' => 'boolean',
            'handover_read_at' => 'datetime',
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

    public function journalEntryType(): BelongsTo
    {
        return $this->belongsTo(JournalEntryType::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function handoverReadBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handover_read_by_user_id');
    }

    public function peiObjective(): BelongsTo
    {
        return $this->belongsTo(MinorPeiObjective::class, 'pei_objective_id');
    }
}
