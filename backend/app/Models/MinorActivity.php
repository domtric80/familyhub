<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MinorActivity extends Model
{
    use SoftDeletes;

    public const STATUS_PLANNED = 'planned';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'facility_id',
        'minor_id',
        'activity_type_id',
        'responsible_staff_member_id',
        'title',
        'description',
        'location',
        'planned_start_at',
        'planned_end_at',
        'actual_start_at',
        'actual_end_at',
        'status',
        'attendance_status',
        'support_level',
        'requires_transport',
        'materials_needed',
        'follow_up_required',
        'follow_up_notes',
        'pei_objective_ref',
        'pei_objective_id',
        'outcome_notes',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'planned_start_at' => 'datetime',
            'planned_end_at' => 'datetime',
            'actual_start_at' => 'datetime',
            'actual_end_at' => 'datetime',
            'requires_transport' => 'boolean',
            'follow_up_required' => 'boolean',
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

    public function activityType(): BelongsTo
    {
        return $this->belongsTo(ActivityType::class);
    }

    public function responsibleStaffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class, 'responsible_staff_member_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function peiObjective(): BelongsTo
    {
        return $this->belongsTo(MinorPeiObjective::class, 'pei_objective_id');
    }
}
