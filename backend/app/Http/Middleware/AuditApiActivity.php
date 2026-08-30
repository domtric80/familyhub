<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Services\AuditLogService;
use Closure;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditApiActivity
{
    public function __construct(
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $beforeSnapshot = $this->captureRouteModelSnapshot($request);
        $response = $next($request);

        if (! $this->shouldLog($request, $response) || $this->auditLogService->isHandled($request)) {
            return $response;
        }

        $isDeniedResponse = in_array($response->getStatusCode(), [401, 403], true);

        $this->auditLogService->record($request, [
            'action' => $isDeniedResponse ? 'denied' : $this->auditLogService->resolveAction($request),
            'resource_label' => $request->path(),
            'old_values_json' => $beforeSnapshot,
            'new_values_json' => [
                'status_code' => $response->getStatusCode(),
                'method' => $request->method(),
                'path' => $request->path(),
                'payload' => $this->sanitizePayload($request->all()),
            ],
            'operation_summary' => $isDeniedResponse
                ? $this->buildDeniedOperationSummary($request, $response)
                : $this->buildOperationSummary($request, $beforeSnapshot),
        ]);

        return $response;
    }

    private function shouldLog(Request $request, Response $response): bool
    {
        if (! $request->is(
            'api/admin/*',
            'api/minors*',
            'api/exits*',
            'api/activities*',
            'api/approaches*',
            'api/journals*',
            'api/internal-messages*',
        )) {
            return false;
        }

        return $response->getStatusCode() < 500;
    }

    private function sanitizePayload(array $payload): array
    {
        $hiddenKeys = [
            'password',
            'password_confirmation',
            'token',
            'access_token',
            'family_background',
            'life_history',
            'clinical_notes_encrypted',
            'diagnosis_notes_encrypted',
            'message_body',
            'body',
            'body_encrypted',
            'reserved_notes',
            'reserved_notes_encrypted',
            'psychologist_notes',
            'coordinator_notes',
            'clinical_notes',
            'diagnosis_notes',
            'notes',
        ];

        return $this->sanitizeValue($payload, $hiddenKeys);
    }

    private function sanitizeValue(mixed $value, array $hiddenKeys): mixed
    {
        if ($value instanceof UploadedFile) {
            return [
                'original_name' => $value->getClientOriginalName(),
                'mime_type' => $value->getClientMimeType(),
                'size_bytes' => $value->getSize(),
            ];
        }

        if (! is_array($value)) {
            return $value;
        }

        $sanitized = [];

        foreach ($value as $key => $item) {
            if (is_string($key) && in_array($key, $hiddenKeys, true)) {
                $sanitized[$key] = '***redacted***';
                continue;
            }

            $sanitized[$key] = $this->sanitizeValue($item, $hiddenKeys);
        }

        return $sanitized;
    }

    private function captureRouteModelSnapshot(Request $request): ?array
    {
        foreach ($request->route()?->parameters() ?? [] as $parameter) {
            if (is_object($parameter) && method_exists($parameter, 'getAttributes')) {
                return $this->sanitizePayload($parameter->getAttributes());
            }
        }

        return null;
    }

    private function buildOperationSummary(Request $request, ?array $beforeSnapshot): string
    {
        $actor = $this->auditLogService->resolveActorDisplayName($request->user());
        $action = $this->auditLogService->resolveAction($request);
        $resourceType = $this->auditLogService->resolveResourceType($request);
        $resourceId = $this->auditLogService->resolveResourceId($request);
        $resourceLabel = $this->resolveResourceLabel($resourceType, $beforeSnapshot, $request);
        $humanResource = $this->humanizeResourceType($resourceType);

        return match ($action) {
            'create' => sprintf('%s ha creato %s%s.', $actor, $humanResource, $resourceLabel ? " \"{$resourceLabel}\"" : ''),
            'update' => sprintf('%s ha modificato %s%s.', $actor, $humanResource, $resourceLabel ? " \"{$resourceLabel}\"" : ($resourceId ? " #{$resourceId}" : '')),
            'delete' => sprintf('%s ha eliminato %s%s.', $actor, $humanResource, $resourceLabel ? " \"{$resourceLabel}\"" : ($resourceId ? " #{$resourceId}" : '')),
            'read' => sprintf('%s ha visualizzato %s%s.', $actor, $humanResource, $resourceLabel ? " \"{$resourceLabel}\"" : ($resourceId ? " #{$resourceId}" : '')),
            default => $this->auditLogService->buildGenericSummary($request, $request->user()),
        };
    }

    private function buildDeniedOperationSummary(Request $request, Response $response): string
    {
        $actor = $this->auditLogService->resolveActorDisplayName($request->user());
        $resourceType = $this->auditLogService->resolveResourceType($request);
        $resourceId = $this->auditLogService->resolveResourceId($request);
        $humanResource = $this->humanizeResourceType($resourceType);
        $statusCode = $response->getStatusCode();

        return sprintf(
            '%s ha tentato un accesso non autorizzato. Risorsa: %s%s. Esito HTTP: %d.',
            $actor,
            $humanResource,
            $resourceId ? " #{$resourceId}" : '',
            $statusCode,
        );
    }

    private function humanizeResourceType(string $resourceType): string
    {
        return match ($resourceType) {
            'organizations' => 'l’organizzazione',
            'facilities' => 'la struttura',
            'staff-members', 'staff_members' => 'l’anagrafica operatore',
            'users' => 'l’utente applicativo',
            'roles' => 'il ruolo',
            'document-types', 'document_types' => 'il tipo documento',
            'contact-types', 'contact_types' => 'il tipo contatto',
            'countries' => 'la nazione',
            'regions' => 'la regione',
            'provinces' => 'la provincia',
            'cities' => 'la città',
            'activity-types', 'activity_types' => 'il tipo attività',
            'exit-types', 'exit_types' => 'il tipo uscita',
            'minor-statuses', 'minor_statuses' => 'lo stato minore',
            'gender-identities', 'gender_identities' => 'l’identità di genere',
            'biological-sexes', 'biological_sexes' => 'il sesso biologico',
            'exits' => 'l’uscita del minore',
            'activities' => 'l’attività del minore',
            'approaches' => 'l’avvicinamento familiare',
            'journals' => 'il diario educativo',
            'internal-messages', 'internal_messages' => 'la conversazione interna',
            default => 'la risorsa '.$resourceType,
        };
    }

    private function resolveResourceLabel(string $resourceType, ?array $beforeSnapshot, Request $request): ?string
    {
        $candidates = array_filter([
            $request->input('name'),
            $request->input('code'),
            $request->input('email'),
            $request->input('employee_code'),
            $beforeSnapshot['name'] ?? null,
            $beforeSnapshot['code'] ?? null,
            $beforeSnapshot['email'] ?? null,
            $beforeSnapshot['employee_code'] ?? null,
        ], fn ($value) => is_string($value) && trim($value) !== '');

        return $candidates[0] ?? null;
    }
}
