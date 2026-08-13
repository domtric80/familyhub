<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffShiftSubstitution extends Model
{
    use HasFactory;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'facility_id',
        'shift_assignment_id',
        'original_staff_member_id',
        'replacement_staff_member_id',
        'reason_code',
        'reason_notes',
        'effective_starts_at',
        'effective_ends_at',
        'status',
        'cancelled_at',
        'created_by_user_id',
        'cancelled_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'effective_starts_at' => 'datetime',
            'effective_ends_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function shiftAssignment(): BelongsTo
    {
        return $this->belongsTo(StaffShiftAssignment::class, 'shift_assignment_id');
    }

    public function originalStaffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class, 'original_staff_member_id');
    }

    public function replacementStaffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class, 'replacement_staff_member_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_user_id');
    }
}
