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
                'summary' => 'RBAC controlla l’accesso alle funzioni documentali; ABAC controlla l’accesso effettivo alle classificazioni documento in base a ruolo, classificazione e assegnazione attiva al minore.',
                'minor_assignment_required_for_sensitive_minor_documents' => true,
                'document_rbac_permissions' => [
                    'read' => 'attachments.read',
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
                'assignment_required_for_minor_documents' => true,
            ])->values()->all(),
            'roles' => $roles->map(function (Role $role) use ($classifications): array {
                $permissionCodes = $role->permissions->pluck('code')->values()->all();
                $canReadDocuments = in_array('attachments.read', $permissionCodes, true);
                $canUploadDocuments = in_array('attachments.upload', $permissionCodes, true);

                return [
                    'id' => $role->id,
                    'code' => $role->code,
                    'name' => $role->name,
                    'description' => $role->description,
                    'is_system' => (bool) $role->is_system,
                    'rbac' => [
                        'attachments_read' => $canReadDocuments,
                        'attachments_upload' => $canUploadDocuments,
                    ],
                    'document_access' => $classifications->map(function (DocumentClassification $classification) use ($role, $canReadDocuments): array {
                        $allowedRoleCodes = $classification->allowed_role_codes ?? [];
                        $roleAllowedByClassification = empty($allowedRoleCodes) || in_array($role->code, $allowedRoleCodes, true);

                        return [
                            'classification_code' => $classification->code,
                            'classification_name' => $classification->name,
                            'classification_active' => (bool) $classification->is_active,
                            'allowed_by_classification' => $roleAllowedByClassification,
                            'requires_minor_assignment' => true,
                            'effective_read_access' => $canReadDocuments && $roleAllowedByClassification,
                            'effective_read_rule' => $canReadDocuments && $roleAllowedByClassification
                                ? 'allowed_if_minor_assignment_active'
                                : 'denied',
                            'notes' => $canReadDocuments
                                ? ($roleAllowedByClassification
                                    ? 'Il ruolo supera il controllo RBAC documentale; per i documenti del minore serve comunque assegnazione attiva e policy ABAC soddisfatta.'
                                    : 'Il ruolo non è tra quelli ammessi dalla classificazione documentale.')
                                : 'Il ruolo non dispone del permesso RBAC attachments.read.',
                        ];
                    })->values()->all(),
                ];
            })->values()->all(),
        ]);
    }
}
