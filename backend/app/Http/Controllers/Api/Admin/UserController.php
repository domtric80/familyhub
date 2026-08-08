<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEducatorAccountRequest;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Role;
use App\Models\StaffMember;
use App\Models\User;
use App\Models\UserFacilityRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            User::query()
                ->with('userFacilityRoles.role')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::query()->create([
            ...$request->validated(),
            'uuid' => (string) Str::uuid(),
            'is_active' => $request->boolean('is_active', true),
            'mfa_required' => $request->boolean('mfa_required', false),
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user): JsonResponse
    {
        $user->load('userFacilityRoles.role.permissions', 'userFacilityRoles.facility');

        return response()->json($user);
    }

    public function assignedMinors(User $user): JsonResponse
    {
        $user->load([
            'minorAssignments.minor.minorStatus',
            'minorAssignments.minor.facility.organization',
            'minorAssignments.user.userFacilityRoles.role',
            'minorAssignments.assignedBy:id,first_name,last_name,email',
        ]);

        return response()->json([
            'user' => $user->only(['id', 'uuid', 'email', 'first_name', 'last_name', 'is_active']),
            'assignments' => $user->minorAssignments,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $payload = [
            'email' => $request->string('email')->toString(),
            'first_name' => $request->string('first_name')->toString(),
            'last_name' => $request->string('last_name')->toString(),
            'is_active' => $request->boolean('is_active', $user->is_active),
            'mfa_required' => $request->boolean('mfa_required', $user->mfa_required),
        ];

        if ($request->filled('password')) {
            $payload['password'] = Hash::make($request->string('password')->toString());
        }

        if (! $payload['mfa_required']) {
            $payload['mfa_secret_encrypted'] = null;
            $payload['mfa_recovery_codes_encrypted'] = null;
            $payload['mfa_confirmed_at'] = null;
        }

        $user->forceFill($payload)->save();

        return response()->json($user->fresh());
    }

    public function deactivate(Request $request, User $user): JsonResponse
    {
        if ($request->user()?->id === $user->id) {
            return response()->json([
                'message' => 'Non è consentito disattivare il proprio utente.',
            ], 422);
        }

        $user->forceFill([
            'is_active' => false,
        ])->save();

        return response()->json([
            'message' => 'Utente disattivato.',
            'user' => $user->fresh(),
        ]);
    }

    public function resetMfa(Request $request, User $user): JsonResponse
    {
        $user->forceFill([
            'mfa_secret_encrypted' => null,
            'mfa_recovery_codes_encrypted' => null,
            'mfa_confirmed_at' => null,
        ])->save();

        return response()->json([
            'message' => 'MFA utente reimpostata.',
            'user' => $user->fresh(),
        ]);
    }

    public function linkableStaffMembers(Request $request): JsonResponse
    {
        $query = StaffMember::query()
            ->with(['facility.organization', 'birthCity.province.region.country', 'qualificationLookup', 'statusLookup'])
            ->whereNull('user_id')
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('q')) {
            $term = trim((string) $request->input('q'));

            $query->where(function (Builder $builder) use ($term): void {
                $builder
                    ->where('first_name', 'like', "%{$term}%")
                    ->orWhere('last_name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('employee_code', 'like', "%{$term}%");
            });
        }

        return response()->json($query->get());
    }

    public function storeEducatorAccount(StoreEducatorAccountRequest $request): JsonResponse
    {
        $role = $this->resolveRole(
            $request->input('role_id'),
            $request->input('role_code', 'EDUCATORE')
        );

        $this->ensureEducatorRole($role);
        $this->ensureEducatorAccountPermissions($request, $request->integer('facility_id'));

        $result = DB::transaction(function () use ($request, $role): array {
            $user = User::query()->create([
                'uuid' => (string) Str::uuid(),
                'email' => $request->string('email')->toString(),
                'password' => $request->string('password')->toString(),
                'first_name' => $request->string('first_name')->toString(),
                'last_name' => $request->string('last_name')->toString(),
                'is_active' => $request->boolean('is_active', true),
                'mfa_required' => $request->boolean('mfa_required', false),
            ]);

            $staffMember = $this->resolveOrCreateStaffMember($request, $user);

            $assignment = UserFacilityRole::query()->create([
                'user_id' => $user->id,
                'facility_id' => $request->integer('facility_id'),
                'role_id' => $role->id,
                'valid_from' => $request->input('valid_from') ?: now()->toDateString(),
                'valid_to' => $request->input('valid_to'),
                'is_active' => $request->boolean('is_active', true),
                'assigned_by_user_id' => $request->user()?->id,
            ]);

            return [
                'user' => $user->load('userFacilityRoles.role', 'userFacilityRoles.facility', 'staffMember'),
                'staff_member' => $staffMember->load('facility.organization', 'birthCity.province.region.country', 'qualificationLookup', 'statusLookup'),
                'assignment' => $assignment->load('facility', 'role', 'assignedBy'),
            ];
        });

        return response()->json([
            'message' => 'Account educatore creato e collegato con successo.',
            ...$result,
        ], 201);
    }

    private function resolveRole(mixed $roleId, mixed $roleCode): Role
    {
        $role = Role::query()
            ->when($roleId, fn ($query) => $query->whereKey((int) $roleId))
            ->when(! $roleId, fn ($query) => $query->where('code', (string) $roleCode))
            ->first();

        abort_unless($role, 422, 'Ruolo non valido.');

        return $role;
    }

    private function ensureEducatorRole(Role $role): void
    {
        abort_unless(in_array($role->code, ['EDUCATORE', 'EDUCATORE_NOTTURNO'], true), 422, 'Il flusso guidato è riservato ai ruoli educativi.');
    }

    private function ensureEducatorAccountPermissions(StoreEducatorAccountRequest $request, int $facilityId): void
    {
        $user = $request->user();

        abort_unless($user?->hasPermission('users.create', $facilityId), 403, 'Permesso insufficiente: users.create.');
        abort_unless($user?->hasPermission('user_facility_roles.create', $facilityId), 403, 'Permesso insufficiente: user_facility_roles.create.');

        if ($request->filled('staff_member_id')) {
            abort_unless($user?->hasPermission('staff_members.update', $facilityId), 403, 'Permesso insufficiente: staff_members.update.');

            return;
        }

        abort_unless($user?->hasPermission('staff_members.create', $facilityId), 403, 'Permesso insufficiente: staff_members.create.');
    }

    private function resolveOrCreateStaffMember(StoreEducatorAccountRequest $request, User $user): StaffMember
    {
        if ($request->filled('staff_member_id')) {
            $staffMember = StaffMember::query()->findOrFail($request->integer('staff_member_id'));

            if ($staffMember->user_id) {
                abort(409, 'L’educatore selezionato è già collegato a un account utente.');
            }

            if ($staffMember->facility_id !== $request->integer('facility_id')) {
                abort(422, 'L’educatore selezionato appartiene a una struttura diversa.');
            }

            $staffMember->forceFill([
                'user_id' => $user->id,
            ])->save();

            return $staffMember;
        }

        $employeeCode = (string) data_get($request->validated(), 'staff_member.employee_code');

        $exists = StaffMember::query()
            ->where('facility_id', $request->integer('facility_id'))
            ->where('employee_code', $employeeCode)
            ->exists();

        if ($exists) {
            abort(422, 'Esiste già un educatore con la stessa matricola nella struttura selezionata.');
        }

        return StaffMember::query()->create([
            'facility_id' => $request->integer('facility_id'),
            'user_id' => $user->id,
            'employee_code' => $employeeCode,
            'first_name' => $request->string('first_name')->toString(),
            'last_name' => $request->string('last_name')->toString(),
            'birth_date' => data_get($request->validated(), 'staff_member.birth_date'),
            'birth_city_id' => data_get($request->validated(), 'staff_member.birth_city_id'),
            'tax_code' => data_get($request->validated(), 'staff_member.tax_code'),
            'email' => data_get($request->validated(), 'staff_member.email') ?: $request->string('email')->toString(),
            'phone' => data_get($request->validated(), 'staff_member.phone'),
            'qualification_code' => data_get($request->validated(), 'staff_member.qualification_code') ?: 'EDUCATORE',
            'qualification' => data_get($request->validated(), 'staff_member.qualification') ?: 'Educatore',
            'status_code' => data_get($request->validated(), 'staff_member.status_code') ?: 'ACTIVE',
            'status' => data_get($request->validated(), 'staff_member.status') ?: 'active',
        ]);
    }
}
