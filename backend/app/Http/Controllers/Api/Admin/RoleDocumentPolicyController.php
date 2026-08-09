<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SyncRoleDocumentPolicyRequest;
use App\Models\DocumentClassification;
use App\Models\Role;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;

class RoleDocumentPolicyController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json($this->serialize($role));
    }

    public function update(SyncRoleDocumentPolicyRequest $request, Role $role): JsonResponse
    {
        $requestedCodes = collect($request->validated('classification_codes'))
            ->unique()
            ->values();

        $classifications = DocumentClassification::query()
            ->orderBy('name')
            ->get();

        $before = $classifications
            ->filter(fn (DocumentClassification $classification): bool => in_array($role->code, $classification->allowed_role_codes ?? [], true))
            ->pluck('code')
            ->values()
            ->all();

        foreach ($classifications as $classification) {
            $allowedRoleCodes = collect($classification->allowed_role_codes ?? []);

            $updatedRoleCodes = $requestedCodes->contains($classification->code)
                ? $allowedRoleCodes->push($role->code)->unique()->values()->all()
                : $allowedRoleCodes->reject(fn (string $roleCode): bool => $roleCode === $role->code)->values()->all();

            $classification->forceFill([
                'allowed_role_codes' => $updatedRoleCodes,
            ])->save();
        }

        $after = DocumentClassification::query()
            ->orderBy('name')
            ->get()
            ->filter(fn (DocumentClassification $classification): bool => in_array($role->code, $classification->allowed_role_codes ?? [], true))
            ->pluck('code')
            ->values()
            ->all();

        $actorName = $this->auditLogService->resolveActorDisplayName($request->user());

        $this->auditLogService->record($request, [
            'action' => 'update',
            'resource_type' => 'role_document_policies',
            'resource_id' => (string) $role->id,
            'resource_label' => $role->code,
            'operation_summary' => sprintf(
                '%s ha modificato la visibilità documentale del ruolo %s. Classificazioni precedenti: [%s]. Classificazioni successive: [%s].',
                $actorName,
                $role->name,
                implode(', ', $before),
                implode(', ', $after)
            ),
            'old_values_json' => [
                'classification_codes' => $before,
            ],
            'new_values_json' => [
                'classification_codes' => $after,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json([
            'message' => 'Policy documentale del ruolo aggiornata.',
            ...$this->serialize($role->fresh('permissions')),
        ]);
    }

    private function serialize(Role $role): array
    {
        $role->loadMissing('permissions');

        $classifications = DocumentClassification::query()
            ->orderBy('name')
            ->get();

        $canReadDocuments = $role->permissions->contains('code', 'attachments.read');
        $canDownloadDocuments = $role->permissions->contains('code', 'attachments.download');
        $canUploadDocuments = $role->permissions->contains('code', 'attachments.upload');

        return [
            'role' => [
                'id' => $role->id,
                'code' => $role->code,
                'name' => $role->name,
                'description' => $role->description,
                'is_system' => (bool) $role->is_system,
            ],
            'rbac' => [
                'attachments_read' => $canReadDocuments,
                'attachments_download' => $canDownloadDocuments,
                'attachments_upload' => $canUploadDocuments,
            ],
            'summary' => [
                'can_read_any_documents' => $canReadDocuments,
                'can_download_any_documents' => $canDownloadDocuments,
                'can_upload_documents' => $canUploadDocuments,
                'explanation' => $canReadDocuments
                    ? ($canDownloadDocuments
                        ? 'Il ruolo può leggere e scaricare documenti solo se superano sia i permessi RBAC sia la policy ABAC della classificazione e, per i documenti del minore, l’assegnazione attiva al minore.'
                        : 'Il ruolo può leggere documenti se ammessi dalla classificazione, ma non può scaricarli finché non riceve il permesso RBAC attachments.download.')
                    : 'Il ruolo non ha il permesso RBAC attachments.read: anche se una classificazione lo ammette, non leggerà documenti finché il permesso base non viene assegnato.',
            ],
            'classifications' => $classifications->map(function (DocumentClassification $classification) use ($role, $canReadDocuments, $canDownloadDocuments): array {
                $allowedRoleCodes = $classification->allowed_role_codes ?? [];
                $allowedDownloadRoleCodes = $classification->allowed_download_role_codes ?? $allowedRoleCodes;
                $allowedForRole = in_array($role->code, $allowedRoleCodes, true);
                $downloadAllowedForRole = in_array($role->code, $allowedDownloadRoleCodes, true);

                return [
                    'id' => $classification->id,
                    'code' => $classification->code,
                    'name' => $classification->name,
                    'description' => $classification->description,
                    'is_active' => (bool) $classification->is_active,
                    'assigned_to_role' => $allowedForRole,
                    'download_assigned_to_role' => $downloadAllowedForRole,
                    'effective_read_access' => $canReadDocuments && $allowedForRole,
                    'effective_download_access' => $canDownloadDocuments && $downloadAllowedForRole,
                    'requires_minor_assignment' => true,
                    'notes' => $canReadDocuments
                        ? ($allowedForRole
                            ? ($canDownloadDocuments
                                ? ($downloadAllowedForRole
                                    ? 'Lettura e download consentiti se l’utente è assegnato attivamente al minore.'
                                    : 'Lettura consentita, ma download negato dalla policy ABAC di questa classificazione.')
                                : 'Lettura consentita, ma download negato finché il ruolo non riceve attachments.download.')
                            : 'Il ruolo non è ammesso da questa classificazione documentale.')
                        : 'Manca il permesso RBAC attachments.read.',
                ];
            })->values(),
        ];
    }
}
