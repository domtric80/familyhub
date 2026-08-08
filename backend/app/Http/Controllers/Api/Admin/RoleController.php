<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\SyncRolePermissionsRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json(
            Role::query()
                ->withCount('permissions')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = Role::query()->create([
            ...$request->validated(),
            'is_system' => $request->boolean('is_system', false),
        ]);

        return response()->json($role, 201);
    }

    public function show(Role $role): JsonResponse
    {
        $role->load('permissions');

        return response()->json($role);
    }

    public function update(StoreRoleRequest $request, Role $role): JsonResponse
    {
        $role->update([
            ...$request->validated(),
            'is_system' => $request->boolean('is_system', $role->is_system),
        ]);

        return response()->json($role->fresh()->load('permissions'));
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->userFacilityRoles()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare il ruolo: esistono assegnazioni utente-struttura collegate.',
            ], 409);
        }

        $role->delete();

        return response()->json(status: 204);
    }

    public function permissions(Role $role): JsonResponse
    {
        $role->load('permissions');
        $permissions = Permission::query()->orderBy('resource')->orderBy('action')->get();

        return response()->json([
            'role' => $role,
            'permissions' => $permissions,
            'all_permissions' => $permissions,
            'assigned_permission_ids' => $role->permissions->pluck('id')->values()->all(),
        ]);
    }

    public function syncPermissions(SyncRolePermissionsRequest $request, Role $role): JsonResponse
    {
        $beforePermissions = $role->permissions()->orderBy('code')->pluck('code')->values()->all();
        $newPermissionIds = $request->validated('permission_ids');

        $role->permissions()->sync($request->validated('permission_ids'));

        $afterPermissions = $role->fresh()->permissions()->orderBy('code')->pluck('code')->values()->all();
        $actorName = $this->auditLogService->resolveActorDisplayName($request->user());

        $this->auditLogService->record($request, [
            'action' => 'update',
            'resource_type' => 'role_permissions',
            'resource_id' => (string) $role->id,
            'resource_label' => $role->code,
            'operation_summary' => sprintf(
                '%s ha modificato i permessi del ruolo %s. Permessi precedenti: [%s]. Permessi successivi: [%s].',
                $actorName,
                $role->name,
                implode(', ', $beforePermissions),
                implode(', ', $afterPermissions)
            ),
            'old_values_json' => [
                'permission_codes' => $beforePermissions,
            ],
            'new_values_json' => [
                'permission_ids' => $newPermissionIds,
                'permission_codes' => $afterPermissions,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json([
            'message' => 'Permessi ruolo aggiornati.',
            'role' => $role->fresh()->load('permissions'),
        ]);
    }
}
