<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentClassification;
use App\Models\Role;
use Illuminate\Http\JsonResponse;

class DocumentAccessMatrixController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::query()
            ->with('permissions')
            ->orderBy('name')
            ->get();

        $classifications = DocumentClassification::query()
            ->orderBy('name')
            ->get();

        return response()->json([
            'meta' => [
                'model' => 'rbac_plus_abac',
                'summary' => 'RBAC controlla l’accesso alle funzioni documentali; ABAC controlla l’accesso effettivo alle classificazioni documento in base a ruolo, classificazione, azione richiesta e assegnazione attiva al minore.',
                'minor_assignment_required_for_sensitive_minor_documents' => true,
                'document_rbac_permissions' => [
                    'read' => 'attachments.read',
                    'download' => 'attachments.download',
                    'upload' => 'attachments.upload',
                ],
            ],
            'classifications' => $classifications->map(fn (DocumentClassification $classification): array => [
                'id' => $classification->id,
                'code' => $classification->code,
                'name' => $classification->name,
                'description' => $classification->description,
                'is_active' => (bool) $classification->is_active,
                'allowed_role_codes' => $classification->allowed_role_codes ?? [],
                'allowed_download_role_codes' => $classification->allowed_download_role_codes ?? $classification->allowed_role_codes ?? [],
                'assignment_required_for_minor_documents' => true,
            ])->values()->all(),
            'roles' => $roles->map(function (Role $role) use ($classifications): array {
                $permissionCodes = $role->permissions->pluck('code')->values()->all();
                $canReadDocuments = in_array('attachments.read', $permissionCodes, true);
                $canDownloadDocuments = in_array('attachments.download', $permissionCodes, true);
                $canUploadDocuments = in_array('attachments.upload', $permissionCodes, true);

                return [
                    'id' => $role->id,
                    'code' => $role->code,
                    'name' => $role->name,
                    'description' => $role->description,
                    'is_system' => (bool) $role->is_system,
                    'rbac' => [
                        'attachments_read' => $canReadDocuments,
                        'attachments_download' => $canDownloadDocuments,
                        'attachments_upload' => $canUploadDocuments,
                    ],
                    'document_access' => $classifications->map(function (DocumentClassification $classification) use ($role, $canReadDocuments, $canDownloadDocuments): array {
                        $allowedRoleCodes = $classification->allowed_role_codes ?? [];
                        $allowedDownloadRoleCodes = $classification->allowed_download_role_codes ?? $allowedRoleCodes;
                        $roleAllowedByClassification = empty($allowedRoleCodes) || in_array($role->code, $allowedRoleCodes, true);
                        $roleAllowedByDownloadClassification = empty($allowedDownloadRoleCodes) || in_array($role->code, $allowedDownloadRoleCodes, true);

                        return [
                            'classification_code' => $classification->code,
                            'classification_name' => $classification->name,
                            'classification_active' => (bool) $classification->is_active,
                            'allowed_by_classification' => $roleAllowedByClassification,
                            'allowed_by_download_classification' => $roleAllowedByDownloadClassification,
                            'requires_minor_assignment' => true,
                            'effective_read_access' => $canReadDocuments && $roleAllowedByClassification,
                            'effective_download_access' => $canDownloadDocuments && $roleAllowedByDownloadClassification,
                            'effective_read_rule' => $canReadDocuments && $roleAllowedByClassification
                                ? 'allowed_if_minor_assignment_active'
                                : 'denied',
                            'effective_download_rule' => $canDownloadDocuments && $roleAllowedByDownloadClassification
                                ? 'allowed_if_minor_assignment_active'
                                : 'denied',
                            'notes' => ! $canReadDocuments
                                ? 'Il ruolo non dispone del permesso RBAC attachments.read.'
                                : (! $roleAllowedByClassification
                                    ? 'Il ruolo non è ammesso dalla classificazione documentale per la lettura.'
                                    : (! $canDownloadDocuments
                                        ? 'Lettura consentita; download negato perché manca il permesso RBAC attachments.download.'
                                        : (! $roleAllowedByDownloadClassification
                                            ? 'Lettura consentita; download negato dalla policy ABAC della classificazione.'
                                            : 'Il ruolo supera RBAC e ABAC; per i documenti del minore serve comunque assegnazione attiva.'))),
                        ];
                    })->values()->all(),
                ];
            })->values()->all(),
        ]);
    }
}
