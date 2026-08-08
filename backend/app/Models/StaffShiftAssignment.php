<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffShiftAssignment extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'facility_id',
        'shift_template_id',
        'staff_member_id',
        'shift_date',
        'starts_at',
        'ends_at',
        'status',
        'notes',
        'assigned_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'shift_date' => 'date',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function shiftTemplate(): BelongsTo
    {
        return $this->belongsTo(StaffShiftTemplate::class, 'shift_template_id');
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    public function attendanceEvents(): HasMany
    {
        return $this->hasMany(StaffAttendanceEvent::class, 'shift_assignment_id');
    }

    public function timesheetEntries(): HasMany
    {
        return $this->hasMany(StaffTimesheetEntry::class, 'shift_assignment_id');
    }
}
