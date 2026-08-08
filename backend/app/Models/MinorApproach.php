<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MinorApproach extends Model
{
    use SoftDeletes;

    public const STATUS_PLANNED = 'planned';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'facility_id',
        'minor_id',
        'approach_type_id',
        'minor_contact_id',
        'authorization_minor_document_id',
        'supervising_staff_member_id',
        'title',
        'objective',
        'location',
        'authorization_reference',
        'authorization_issued_at',
        'authorization_expires_at',
        'authorization_renewal_alert_days',
        'planned_start_at',
        'planned_end_at',
        'actual_start_at',
        'actual_end_at',
        'status',
        'pre_reaction_level',
        'pre_reaction_notes',
        'during_reaction_level',
        'during_reaction_notes',
        'post_reaction_level',
        'post_reaction_notes',
        'outcome_notes',
        'next_steps',
        'reserved_psychologist_notes',
        'reserved_coordinator_notes',
        'suspension_reason',
        'suspended_at',
        'suspended_by_user_id',
        'suspension_signed_at',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'authorization_issued_at' => 'date',
            'authorization_expires_at' => 'date',
            'authorization_renewal_alert_days' => 'integer',
            'planned_start_at' => 'datetime',
            'planned_end_at' => 'datetime',
            'actual_start_at' => 'datetime',
            'actual_end_at' => 'datetime',
            'suspended_at' => 'datetime',
            'suspension_signed_at' => 'datetime',
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

    public function approachType(): BelongsTo
    {
        return $this->belongsTo(ApproachType::class);
    }

    public function minorContact(): BelongsTo
    {
        return $this->belongsTo(MinorContact::class);
    }

    public function authorizationMinorDocument(): BelongsTo
    {
        return $this->belongsTo(MinorDocument::class, 'authorization_minor_document_id');
    }

    public function minorContacts(): BelongsToMany
    {
        return $this->belongsToMany(MinorContact::class, 'minor_approach_contacts')
            ->withTimestamps()
            ->withPivot('sort_order', 'contact_type_id')
            ->orderBy('minor_approach_contacts.sort_order')
            ->orderBy('minor_contacts.last_name')
            ->orderBy('minor_contacts.first_name');
    }

    public function supervisingStaffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class, 'supervising_staff_member_id');
    }

    public function staffParticipants(): HasMany
    {
        return $this->hasMany(MinorApproachStaffParticipant::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function suspendedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'suspended_by_user_id');
    }
}
