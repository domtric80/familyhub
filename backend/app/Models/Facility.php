<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Facility extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'code',
        'name',
        'address_line',
        'city_id',
        'postal_code',
        'capacity',
        'status',
        'status_code',
    ];

    protected $hidden = [
        'status',
    ];

    protected $appends = [
        'status_label',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function statusLookup(): BelongsTo
    {
        return $this->belongsTo(FacilityStatus::class, 'status_code', 'code');
    }

    public function userFacilityRoles(): HasMany
    {
        return $this->hasMany(UserFacilityRole::class);
    }

    public function staffMembers(): HasMany
    {
        return $this->hasMany(StaffMember::class);
    }

    public function minors(): HasMany
    {
        return $this->hasMany(Minor::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function exits(): HasMany
    {
        return $this->hasMany(MinorExit::class);
    }

    public function minorApproaches(): HasMany
    {
        return $this->hasMany(MinorApproach::class);
    }

    public function journalEntries(): HasMany
    {
        return $this->hasMany(MinorJournalEntry::class);
    }

    public function shiftTemplates(): HasMany
    {
        return $this->hasMany(StaffShiftTemplate::class);
    }

    public function shiftAssignments(): HasMany
    {
        return $this->hasMany(StaffShiftAssignment::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function getStatusLabelAttribute(): ?string
    {
        return $this->statusLookup?->name ?? ($this->attributes['status'] ?? null);
    }
}
