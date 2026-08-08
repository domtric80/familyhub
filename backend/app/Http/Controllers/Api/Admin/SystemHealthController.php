<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuditLogService;
use App\Services\SystemHealthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemHealthController extends Controller
{
    public function __construct(
        private readonly SystemHealthService $systemHealthService = new SystemHealthService(),
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json($this->systemHealthService->snapshot());
    }

    public function run(Request $request): JsonResponse
    {
        $snapshot = $this->systemHealthService->snapshot();

        $this->auditLogService->record($request, [
            'actor_user' => $request->user(),
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($request->user()),
            'action' => 'read',
            'resource_type' => 'system_health',
            'resource_label' => 'manual-run',
            'operation_summary' => sprintf('%s ha eseguito un controllo manuale dello stato servizi.', $this->auditLogService->resolveActorDisplayName($request->user())),
            'new_values_json' => [
                'summary' => $snapshot['summary'] ?? [],
                'generated_at' => $snapshot['generated_at'] ?? null,
            ],
        ]);

        return response()->json($snapshot);
    }
}
