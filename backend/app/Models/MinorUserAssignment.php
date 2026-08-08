<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorUserAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'minor_id',
        'user_id',
        'facility_id',
        'valid_from',
        'valid_to',
        'is_active',
        'assigned_by_user_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'valid_from' => 'date',
            'valid_to' => 'date',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $assignment): void {
            $assignment->assignment_role_code ??= '__LEGACY_INTERNAL__';
            $assignment->access_level ??= '__LEGACY_INTERNAL__';
        });
    }

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    public function getEffectiveRoleCodeAttribute(): ?string
    {
        $roleAssignment = $this->resolveCurrentFacilityRole();

        return $roleAssignment?->role?->code;
    }

    public function getEffectiveRoleNameAttribute(): ?string
    {
        $roleAssignment = $this->resolveCurrentFacilityRole();

        return $roleAssignment?->role?->name;
    }

    private function resolveCurrentFacilityRole(): ?UserFacilityRole
    {
        $user = $this->relationLoaded('user') ? $this->user : $this->user()->first();

        if (! $user) {
            return null;
        }

        $assignments = $user->relationLoaded('userFacilityRoles')
            ? $user->userFacilityRoles
            : $user->userFacilityRoles()->with('role')->get();

        return $assignments
            ->filter(fn (UserFacilityRole $assignment) => (int) $assignment->facility_id === (int) $this->facility_id)
            ->filter(fn (UserFacilityRole $assignment) => $assignment->is_active)
            ->filter(fn (UserFacilityRole $assignment) => ! $assignment->valid_to || $assignment->valid_to->isFuture() || $assignment->valid_to->isToday())
            ->sortByDesc(fn (UserFacilityRole $assignment) => optional($assignment->valid_from)?->getTimestamp() ?? 0)
            ->sortByDesc('id')
            ->first();
    }
}
