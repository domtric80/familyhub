<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffMember extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'facility_id',
        'user_id',
        'employee_code',
        'first_name',
        'last_name',
        'birth_date',
        'birth_city_id',
        'tax_code',
        'email',
        'phone',
        'qualification',
        'qualification_code',
        'status',
        'status_code',
    ];

    protected $hidden = [
        'qualification',
        'status',
    ];

    protected $appends = [
        'qualification_label',
        'status_label',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function birthCity(): BelongsTo
    {
        return $this->belongsTo(City::class, 'birth_city_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StaffDocument::class);
    }

    public function certifications(): HasMany
    {
        return $this->hasMany(StaffMemberCertification::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(StaffSkill::class, 'staff_member_skills')
            ->withPivot(['proficiency_level_code', 'acquired_at', 'notes'])
            ->withTimestamps();
    }

    public function languages(): BelongsToMany
    {
        return $this->belongsToMany(StaffLanguage::class, 'staff_member_languages')
            ->withPivot(['proficiency_level_code', 'notes'])
            ->withTimestamps();
    }

    public function specializations(): BelongsToMany
    {
        return $this->belongsToMany(StaffSpecialization::class, 'staff_member_specializations')
            ->withPivot(['achieved_at', 'notes'])
            ->withTimestamps();
    }

    public function supervisedApproaches(): HasMany
    {
        return $this->hasMany(MinorApproach::class, 'supervising_staff_member_id');
    }

    public function qualificationLookup(): BelongsTo
    {
        return $this->belongsTo(StaffQualification::class, 'qualification_code', 'code');
    }

    public function statusLookup(): BelongsTo
    {
        return $this->belongsTo(StaffStatus::class, 'status_code', 'code');
    }

    public function shiftAssignments(): HasMany
    {
        return $this->hasMany(StaffShiftAssignment::class);
    }

    public function attendanceEvents(): HasMany
    {
        return $this->hasMany(StaffAttendanceEvent::class);
    }

    public function timesheetEntries(): HasMany
    {
        return $this->hasMany(StaffTimesheetEntry::class);
    }

    public function getQualificationLabelAttribute(): ?string
    {
        return $this->qualificationLookup?->name ?? ($this->attributes['qualification'] ?? null);
    }

    public function getStatusLabelAttribute(): ?string
    {
        return $this->statusLookup?->name ?? ($this->attributes['status'] ?? null);
    }
}
