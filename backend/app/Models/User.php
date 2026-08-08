<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\DocumentClassification;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    protected $fillable = [
        'uuid',
        'email',
        'password',
        'first_name',
        'last_name',
        'is_active',
        'mfa_required',
        'mfa_secret_encrypted',
        'mfa_recovery_codes_encrypted',
        'mfa_confirmed_at',
        'last_login_at',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'mfa_secret_encrypted',
        'mfa_recovery_codes_encrypted',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'mfa_required' => 'boolean',
            'mfa_confirmed_at' => 'datetime',
        ];
    }

    public function userFacilityRoles(): HasMany
    {
        return $this->hasMany(UserFacilityRole::class);
    }

    public function staffMember(): HasOne
    {
        return $this->hasOne(StaffMember::class);
    }

    public function assignedRoles(): HasMany
    {
        return $this->hasMany(UserFacilityRole::class, 'assigned_by_user_id');
    }

    public function minorAssignments(): HasMany
    {
        return $this->hasMany(MinorUserAssignment::class);
    }

    public function assignedShifts(): HasMany
    {
        return $this->hasMany(StaffShiftAssignment::class, 'assigned_by_user_id');
    }

    public function facilities(): BelongsToMany
    {
        return $this->belongsToMany(Facility::class, 'user_facility_roles')
            ->withPivot(['role_id', 'valid_from', 'valid_to', 'is_active', 'assigned_by_user_id'])
            ->withTimestamps();
    }

    public function hasRoleIn(array $roleCodes): bool
    {
        return $this->userFacilityRoles()
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', now());
            })
            ->whereHas('role', fn ($query) => $query->whereIn('code', $roleCodes))
            ->exists();
    }

    public function hasPermission(string $permissionCode, ?int $facilityId = null): bool
    {
        $activeAssignments = $this->userFacilityRoles()
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', now());
            });

        $isSuperAdmin = (clone $activeAssignments)
            ->whereHas('role', fn ($query) => $query->where('code', 'SUPER_ADMIN'))
            ->exists();

        if ($isSuperAdmin) {
            return (clone $activeAssignments)
                ->whereHas('role.permissions', fn ($query) => $query->where('code', $permissionCode))
                ->exists();
        }

        return $this->userFacilityRoles()
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', now());
            })
            ->when($facilityId, fn ($query) => $query->where('facility_id', $facilityId))
            ->whereHas('role.permissions', fn ($query) => $query->where('code', $permissionCode))
            ->exists();
    }

    public function hasMfaEnabled(): bool
    {
        return $this->mfa_required
            && filled($this->mfa_secret_encrypted)
            && filled($this->mfa_confirmed_at);
    }

    public function effectivePermissions(): array
    {
        $roles = $this->relationLoaded('userFacilityRoles')
            ? $this->userFacilityRoles
            : $this->userFacilityRoles()->with('role.permissions')->get();

        return $roles
            ->filter(fn (UserFacilityRole $assignment) => $assignment->is_active && (! $assignment->valid_to || $assignment->valid_to->isFuture() || $assignment->valid_to->isToday()))
            ->flatMap(fn (UserFacilityRole $assignment) => $assignment->role?->permissions?->pluck('code') ?? [])
            ->unique()
            ->values()
            ->all();
    }

    public function allowedDocumentClassifications(): array
    {
        $dbClassifications = DocumentClassification::query()
            ->where('is_active', true)
            ->get();

        $classifications = $dbClassifications->isNotEmpty()
            ? $dbClassifications->map(fn (DocumentClassification $classification): array => [
                'code' => $classification->code,
                'name' => $classification->name,
                'description' => $classification->description,
                'allowed_roles' => $classification->allowed_role_codes ?? [],
            ])
            : collect(config('document_classifications', []));

        return $classifications
            ->filter(function (array $classification): bool {
                $allowedRoles = $classification['allowed_roles'] ?? [];

                return empty($allowedRoles) || $this->hasRoleIn($allowedRoles);
            })
            ->map(fn (array $classification): array => [
                'code' => $classification['code'],
                'name' => $classification['name'] ?? $classification['code'],
                'description' => $classification['description'] ?? null,
                'allowed_roles' => $classification['allowed_roles'] ?? [],
            ])
            ->values()
            ->all();
    }
}
