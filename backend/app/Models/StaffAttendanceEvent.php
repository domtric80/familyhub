<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffAttendanceEvent extends Model
{
    use HasFactory;

    public const TYPE_CLOCK_IN = 'clock_in';
    public const TYPE_CLOCK_OUT = 'clock_out';
    public const TYPE_BREAK_START = 'break_start';
    public const TYPE_BREAK_END = 'break_end';
    public const TYPE_MANUAL_ADJUSTMENT = 'manual_adjustment';

    protected $fillable = [
        'facility_id',
        'staff_member_id',
        'shift_assignment_id',
        'event_type',
        'work_date',
        'occurred_at',
        'source_type',
        'geo_latitude',
        'geo_longitude',
        'geo_accuracy_meters',
        'device_fingerprint',
        'ip_address',
        'notes',
        'created_by_user_id',
        'superseded_by_event_id',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date',
            'occurred_at' => 'datetime',
            'geo_latitude' => 'decimal:7',
            'geo_longitude' => 'decimal:7',
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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function supersededBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'superseded_by_event_id');
    }
}
