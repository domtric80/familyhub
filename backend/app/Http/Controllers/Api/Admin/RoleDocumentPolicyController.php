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
        $requestedReadCodes = collect($request->validated('classification_codes'))
            ->unique()
            ->values();

        $requestedDownloadCodes = collect($request->validated('download_classification_codes', []))
            ->unique()
            ->values();

        $classifications = DocumentClassification::query()
            ->orderBy('name')
            ->get();

        $beforeRead = $classifications
            ->filter(fn (DocumentClassification $classification): bool => in_array($role->code, $classification->allowed_role_codes ?? [], true))
            ->pluck('code')
            ->values()
            ->all();

        $beforeDownload = $classifications
            ->filter(fn (DocumentClassification $classification): bool => in_array($role->code, $classification->allowed_download_role_codes ?? $classification->allowed_role_codes ?? [], true))
            ->pluck('code')
            ->values()
            ->all();

        foreach ($classifications as $classification) {
            $allowedReadRoleCodes = collect($classification->allowed_role_codes ?? []);
            $allowedDownloadRoleCodes = collect($classification->allowed_download_role_codes ?? $classification->allowed_role_codes ?? []);

            $updatedReadCodes = $requestedReadCodes->contains($classification->code)
                ? $allowedReadRoleCodes->push($role->code)->unique()->values()->all()
                : $allowedReadRoleCodes->reject(fn (string $roleCode): bool => $roleCode === $role->code)->values()->all();

            $updatedDownloadCodes = $requestedDownloadCodes->contains($classification->code)
                ? $allowedDownloadRoleCodes->push($role->code)->unique()->values()->all()
                : $allowedDownloadRoleCodes->reject(fn (string $roleCode): bool => $roleCode === $role->code)->values()->all();

            $updatedDownloadCodes = array_values(array_intersect($updatedDownloadCodes, $updatedReadCodes));

            $classification->forceFill([
                'allowed_role_codes' => $updatedReadCodes,
                'allowed_download_role_codes' => $updatedDownloadCodes,
            ])->save();
        }

        $afterRead = DocumentClassification::query()
            ->orderBy('name')
            ->get()
            ->filter(fn (DocumentClassification $classification): bool => in_array($role->code, $classification->allowed_role_codes ?? [], true))
            ->pluck('code')
            ->values()
            ->all();

        $afterDownload = DocumentClassification::query()
            ->orderBy('name')
            ->get()
            ->filter(fn (DocumentClassification $classification): bool => in_array($role->code, $classification->allowed_download_role_codes ?? $classification->allowed_role_codes ?? [], true))
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
                '%s ha modificato la visibilita documentale del ruolo %s. Lettura precedente: [%s]. Lettura successiva: [%s]. Download precedente: [%s]. Download successivo: [%s].',
                $actorName,
                $role->name,
                implode(', ', $beforeRead),
                implode(', ', $afterRead),
                implode(', ', $beforeDownload),
                implode(', ', $afterDownload)
            ),
            'old_values_json' => [
                'classification_codes' => $beforeRead,
                'download_classification_codes' => $beforeDownload,
            ],
            'new_values_json' => [
                'classification_codes' => $afterRead,
                'download_classification_codes' => $afterDownload,
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
        $privilegedRoleCodes = array_values(config('minor_access.privileged_role_codes', []));
        $hasMinorAssignmentBypass = in_array($role->code, $privilegedRoleCodes, true);

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
            'meta' => [
                'privileged_role_codes' => $privilegedRoleCodes,
                'role_has_minor_assignment_bypass' => $hasMinorAssignmentBypass,
                'unknown_classification_policy' => [
                    'read' => 'deny',
                    'download' => 'deny',
                    'explanation' => 'Una nuova classificazione documentale senza ruoli esplicitamente associati resta negata finche la policy ABAC non viene configurata.',
                ],
            ],
            'summary' => [
                'can_read_any_documents' => $canReadDocuments,
                'can_download_any_documents' => $canDownloadDocuments,
                'can_upload_documents' => $canUploadDocuments,
                'readable_classifications_count' => $classifications->filter(fn (DocumentClassification $classification): bool => in_array($role->code, $classification->allowed_role_codes ?? [], true))->count(),
                'downloadable_classifications_count' => $classifications->filter(fn (DocumentClassification $classification): bool => in_array($role->code, $classification->allowed_download_role_codes ?? [], true))->count(),
                'role_has_minor_assignment_bypass' => $hasMinorAssignmentBypass,
                'minor_assignment_rule' => $hasMinorAssignmentBypass
                    ? 'bypass_for_privileged_role'
                    : 'active_minor_assignment_required',
                'explanation' => $canReadDocuments
                    ? ($canDownloadDocuments
                        ? ($hasMinorAssignmentBypass
                            ? 'Il ruolo puo leggere e scaricare i documenti consentiti dalla policy ABAC senza assegnazione esplicita al minore, perche rientra tra i ruoli privilegiati.'
                            : 'Il ruolo puo leggere e scaricare documenti solo se superano sia i permessi RBAC sia la policy ABAC della classificazione e, per i documenti del minore, l assegnazione attiva al minore.')
                        : 'Il ruolo puo leggere documenti se ammessi dalla classificazione, ma non puo scaricarli finche non riceve il permesso RBAC attachments.download.')
                    : 'Il ruolo non ha il permesso RBAC attachments.read: anche se una classificazione lo ammette, non leggera documenti finche il permesso base non viene assegnato.',
            ],
            'classifications' => $classifications->map(function (DocumentClassification $classification) use ($role, $canReadDocuments, $canDownloadDocuments, $hasMinorAssignmentBypass): array {
                $allowedRoleCodes = $classification->allowed_role_codes ?? [];
                $allowedDownloadRoleCodes = $classification->allowed_download_role_codes ?? $allowedRoleCodes;
                $allowedForRole = in_array($role->code, $allowedRoleCodes, true);
                $downloadAllowedForRole = in_array($role->code, $allowedDownloadRoleCodes, true);
                $requiresMinorAssignment = ! $hasMinorAssignmentBypass;
                $effectiveReadAccess = $canReadDocuments && $allowedForRole;
                $effectiveDownloadAccess = $canDownloadDocuments && $downloadAllowedForRole;

                return [
                    'id' => $classification->id,
                    'code' => $classification->code,
                    'name' => $classification->name,
                    'description' => $classification->description,
                    'is_active' => (bool) $classification->is_active,
                    'assigned_to_role' => $allowedForRole,
                    'download_assigned_to_role' => $downloadAllowedForRole,
                    'role_has_minor_assignment_bypass' => $hasMinorAssignmentBypass,
                    'effective_read_access' => $effectiveReadAccess,
                    'effective_download_access' => $effectiveDownloadAccess,
                    'requires_minor_assignment' => $requiresMinorAssignment,
                    'assignment_rule' => $requiresMinorAssignment
                        ? 'active_minor_assignment_required'
                        : 'assignment_not_required_for_privileged_role',
                    'notes' => $canReadDocuments
                        ? ($allowedForRole
                            ? ($canDownloadDocuments
                                ? ($downloadAllowedForRole
                                    ? ($requiresMinorAssignment
                                        ? 'Lettura e download consentiti se l utente e assegnato attivamente al minore.'
                                        : 'Lettura e download consentiti senza assegnazione esplicita, perche il ruolo e privilegiato.')
                                    : 'Lettura consentita, ma download negato dalla policy ABAC di questa classificazione.')
                                : 'Lettura consentita, ma download negato finche il ruolo non riceve attachments.download.')
                            : 'Il ruolo non e ammesso da questa classificazione documentale.')
                        : 'Manca il permesso RBAC attachments.read.',
                ];
            })->values(),
        ];
    }
}
