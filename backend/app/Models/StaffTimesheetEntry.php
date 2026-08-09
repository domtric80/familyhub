<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StaffTimesheetEntry extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_COMPUTED = 'computed';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_LOCKED = 'locked';

    public const ADJUSTMENT_TYPES = [
        'manual_correction',
        'break_correction',
        'overtime_authorization',
        'absence_reconciliation',
    ];

    protected $fillable = [
        'facility_id',
        'staff_member_id',
        'shift_assignment_id',
        'work_date',
        'planned_starts_at',
        'planned_ends_at',
        'actual_starts_at',
        'actual_ends_at',
        'planned_minutes',
        'worked_minutes',
        'break_minutes',
        'ordinary_minutes',
        'overtime_minutes',
        'night_minutes',
        'absence_minutes',
        'variance_minutes',
        'status',
        'anomaly_flags_json',
        'notes',
        'submitted_at',
        'submitted_by_user_id',
        'approved_at',
        'approved_by_user_id',
        'locked_at',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date',
            'planned_starts_at' => 'datetime',
            'planned_ends_at' => 'datetime',
            'actual_starts_at' => 'datetime',
            'actual_ends_at' => 'datetime',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'locked_at' => 'datetime',
            'anomaly_flags_json' => 'array',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function shiftAssignment(): BelongsTo
    {
        return $this->belongsTo(StaffShiftAssignment::class, 'shift_assignment_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function attendanceEvents(): HasMany
    {
        return $this->hasMany(StaffAttendanceEvent::class, 'staff_member_id', 'staff_member_id');
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(StaffTimesheetAdjustment::class, 'timesheet_entry_id')->orderByDesc('created_at')->orderByDesc('id');
    }
}
