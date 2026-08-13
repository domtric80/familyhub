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
        $privilegedRoleCodes = array_values(config('minor_access.privileged_role_codes', []));

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
                'summary' => 'RBAC controlla l accesso alle funzioni documentali; ABAC controlla l accesso effettivo alle classificazioni documento in base a ruolo, classificazione, azione richiesta e assegnazione attiva al minore.',
                'minor_assignment_required_for_sensitive_minor_documents' => true,
                'privileged_role_codes' => $privilegedRoleCodes,
                'unknown_classification_policy' => [
                    'read' => 'deny',
                    'download' => 'deny',
                    'explanation' => 'Una nuova classificazione documentale senza ruoli esplicitamente associati resta negata finche la policy ABAC non viene configurata.',
                ],
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
                'allowed_download_role_codes' => $classification->allowed_download_role_codes ?? [],
                'assignment_required_for_minor_documents' => true,
                'allowed_role_count' => count($classification->allowed_role_codes ?? []),
                'allowed_download_role_count' => count($classification->allowed_download_role_codes ?? []),
            ])->values()->all(),
            'roles' => $roles->map(function (Role $role) use ($classifications, $privilegedRoleCodes): array {
                $permissionCodes = $role->permissions->pluck('code')->values()->all();
                $canReadDocuments = in_array('attachments.read', $permissionCodes, true);
                $canDownloadDocuments = in_array('attachments.download', $permissionCodes, true);
                $canUploadDocuments = in_array('attachments.upload', $permissionCodes, true);
                $hasMinorAssignmentBypass = in_array($role->code, $privilegedRoleCodes, true);

                $documentAccess = $classifications->map(function (DocumentClassification $classification) use ($role, $canReadDocuments, $canDownloadDocuments, $hasMinorAssignmentBypass): array {
                    $allowedRoleCodes = $classification->allowed_role_codes ?? [];
                    $allowedDownloadRoleCodes = $classification->allowed_download_role_codes ?? [];
                    $roleAllowedByClassification = in_array($role->code, $allowedRoleCodes, true);
                    $roleAllowedByDownloadClassification = in_array($role->code, $allowedDownloadRoleCodes, true);
                    $requiresMinorAssignment = ! $hasMinorAssignmentBypass;
                    $effectiveReadAccess = $canReadDocuments && $roleAllowedByClassification;
                    $effectiveDownloadAccess = $canDownloadDocuments && $roleAllowedByDownloadClassification;

                    return [
                        'classification_code' => $classification->code,
                        'classification_name' => $classification->name,
                        'classification_active' => (bool) $classification->is_active,
                        'allowed_by_classification' => $roleAllowedByClassification,
                        'allowed_by_download_classification' => $roleAllowedByDownloadClassification,
                        'role_has_minor_assignment_bypass' => $hasMinorAssignmentBypass,
                        'requires_minor_assignment' => $requiresMinorAssignment,
                        'assignment_rule' => $requiresMinorAssignment
                            ? 'active_minor_assignment_required'
                            : 'assignment_not_required_for_privileged_role',
                        'effective_read_access' => $effectiveReadAccess,
                        'effective_download_access' => $effectiveDownloadAccess,
                        'effective_read_rule' => $effectiveReadAccess
                            ? ($requiresMinorAssignment
                                ? 'allowed_if_minor_assignment_active'
                                : 'allowed_without_minor_assignment')
                            : 'denied',
                        'effective_download_rule' => $effectiveDownloadAccess
                            ? ($requiresMinorAssignment
                                ? 'allowed_if_minor_assignment_active'
                                : 'allowed_without_minor_assignment')
                            : 'denied',
                        'notes' => ! $canReadDocuments
                            ? 'Il ruolo non dispone del permesso RBAC attachments.read.'
                            : (! $roleAllowedByClassification
                                ? 'Il ruolo non e ammesso dalla classificazione documentale per la lettura.'
                                : (! $canDownloadDocuments
                                    ? 'Lettura consentita; download negato perche manca il permesso RBAC attachments.download.'
                                    : (! $roleAllowedByDownloadClassification
                                        ? 'Lettura consentita; download negato dalla policy ABAC della classificazione.'
                                        : ($requiresMinorAssignment
                                            ? 'Il ruolo supera RBAC e ABAC; per i documenti del minore serve comunque assegnazione attiva.'
                                            : 'Ruolo privilegiato: supera RBAC e ABAC e non richiede assegnazione esplicita al minore.')))),
                    ];
                })->values();

                return [
                    'id' => $role->id,
                    'code' => $role->code,
                    'name' => $role->name,
                    'description' => $role->description,
                    'is_system' => (bool) $role->is_system,
                    'role_has_minor_assignment_bypass' => $hasMinorAssignmentBypass,
                    'rbac' => [
                        'attachments_read' => $canReadDocuments,
                        'attachments_download' => $canDownloadDocuments,
                        'attachments_upload' => $canUploadDocuments,
                    ],
                    'summary' => [
                        'readable_classifications_count' => $documentAccess->where('effective_read_access', true)->count(),
                        'downloadable_classifications_count' => $documentAccess->where('effective_download_access', true)->count(),
                        'minor_assignment_rule' => $hasMinorAssignmentBypass
                            ? 'bypass_for_privileged_role'
                            : 'active_minor_assignment_required',
                    ],
                    'document_access' => $documentAccess->all(),
                ];
            })->values()->all(),
        ]);
    }
}
