<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MinorPeiObjective extends Model
{
    use HasFactory;

    protected $fillable = [
        'minor_pei_id',
        'code',
        'title',
        'description',
        'due_date',
        'status',
        'progress_percent',
        'responsible_staff_member_id',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'progress_percent' => 'integer',
        ];
    }

    public function pei(): BelongsTo
    {
        return $this->belongsTo(MinorPei::class, 'minor_pei_id');
    }

    public function responsibleStaffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class, 'responsible_staff_member_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function progressLogs(): HasMany
    {
        return $this->hasMany(MinorPeiObjectiveProgressLog::class, 'minor_pei_objective_id')
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(MinorActivity::class, 'pei_objective_id');
    }

    public function journalEntries(): HasMany
    {
        return $this->hasMany(MinorJournalEntry::class, 'pei_objective_id');
    }
}
