<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSystemStorageConfigRequest;
use App\Http\Requests\Admin\UpdateSystemStorageConfigRequest;
use App\Models\SystemStorageConfig;
use App\Services\AuditLogService;
use App\Services\StorageConfigService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemStorageConfigController extends Controller
{
    public function __construct(
        private readonly StorageConfigService $storageConfigService = new StorageConfigService(),
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json($this->storageConfigService->indexPayload());
    }

    public function store(StoreSystemStorageConfigRequest $request): JsonResponse
    {
        $config = $this->storageConfigService->create($request->validated(), $request->user());

        $this->auditLogService->record($request, [
            'actor_user' => $request->user(),
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($request->user()),
            'action' => 'create',
            'resource_type' => 'system_storage',
            'resource_id' => (string) $config->id,
            'resource_label' => $config->name,
            'operation_summary' => sprintf('%s ha creato una configurazione storage (%s).', $this->auditLogService->resolveActorDisplayName($request->user()), $config->name),
            'new_values_json' => $this->storageConfigService->toArray($config),
        ]);

        return response()->json($this->storageConfigService->toArray($config), 201);
    }

    public function update(UpdateSystemStorageConfigRequest $request, SystemStorageConfig $storageConfig): JsonResponse
    {
        $oldValues = $this->storageConfigService->toArray($storageConfig);
        $config = $this->storageConfigService->update($storageConfig, $request->validated(), $request->user());

        $this->auditLogService->record($request, [
            'actor_user' => $request->user(),
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($request->user()),
            'action' => 'update',
            'resource_type' => 'system_storage',
            'resource_id' => (string) $config->id,
            'resource_label' => $config->name,
            'operation_summary' => sprintf('%s ha aggiornato la configurazione storage (%s).', $this->auditLogService->resolveActorDisplayName($request->user()), $config->name),
            'old_values_json' => $oldValues,
            'new_values_json' => $this->storageConfigService->toArray($config),
        ]);

        return response()->json($this->storageConfigService->toArray($config));
    }

    public function test(Request $request, SystemStorageConfig $storageConfig): JsonResponse
    {
        $result = $this->storageConfigService->test($storageConfig);

        $this->auditLogService->record($request, [
            'actor_user' => $request->user(),
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($request->user()),
            'action' => 'update',
            'resource_type' => 'system_storage',
            'resource_id' => (string) $storageConfig->id,
            'resource_label' => $storageConfig->name,
            'operation_summary' => sprintf('%s ha eseguito il test della configurazione storage (%s).', $this->auditLogService->resolveActorDisplayName($request->user()), $storageConfig->name),
            'new_values_json' => $result,
        ]);

        return response()->json($result);
    }

    public function activate(Request $request, SystemStorageConfig $storageConfig): JsonResponse
    {
        $config = $this->storageConfigService->activate($storageConfig, $request->user());
        $this->storageConfigService->applyRuntimeConfiguration();

        $this->auditLogService->record($request, [
            'actor_user' => $request->user(),
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($request->user()),
            'action' => 'update',
            'resource_type' => 'system_storage',
            'resource_id' => (string) $config->id,
            'resource_label' => $config->name,
            'operation_summary' => sprintf('%s ha attivato la configurazione storage (%s).', $this->auditLogService->resolveActorDisplayName($request->user()), $config->name),
            'new_values_json' => $this->storageConfigService->toArray($config),
        ]);

        return response()->json([
            'message' => 'Configurazione storage attivata.',
            'item' => $this->storageConfigService->toArray($config),
            'current_source' => $this->storageConfigService->currentSource(),
        ]);
    }

    public function destroy(Request $request, SystemStorageConfig $storageConfig): JsonResponse
    {
        $payload = $this->storageConfigService->toArray($storageConfig);
        $this->storageConfigService->delete($storageConfig);

        $this->auditLogService->record($request, [
            'actor_user' => $request->user(),
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($request->user()),
            'action' => 'delete',
            'resource_type' => 'system_storage',
            'resource_id' => (string) ($payload['id'] ?? ''),
            'resource_label' => $payload['name'] ?? 'storage-config',
            'operation_summary' => sprintf('%s ha eliminato la configurazione storage (%s).', $this->auditLogService->resolveActorDisplayName($request->user()), $payload['name'] ?? 'storage-config'),
            'old_values_json' => $payload,
        ]);

        return response()->json(['message' => 'Configurazione storage eliminata.']);
    }
}
