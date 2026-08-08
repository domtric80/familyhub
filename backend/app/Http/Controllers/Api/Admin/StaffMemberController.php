<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LinkStaffMemberUserRequest;
use App\Http\Requests\Admin\StoreStaffMemberRequest;
use App\Models\StaffDocument;
use App\Models\StaffMember;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\HttpException;

class StaffMemberController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = StaffMember::query()
            ->with([
                'facility.organization',
                'birthCity.province.region.country',
                'qualificationLookup',
                'statusLookup',
                'user.userFacilityRoles.role',
                'user.userFacilityRoles.facility',
            ])
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }

        if ($request->boolean('unlinked_only')) {
            $query->whereNull('user_id');
        }

        if ($request->filled('q')) {
            $term = trim((string) $request->input('q'));

            $query->where(function ($builder) use ($term): void {
                $builder
                    ->where('first_name', 'like', "%{$term}%")
                    ->orWhere('last_name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('employee_code', 'like', "%{$term}%");
            });
        }

        return response()->json($query->get());
    }

    public function show(StaffMember $staffMember): JsonResponse
    {
        return response()->json(
            $staffMember->load([
                'facility.organization',
                'birthCity.province.region.country',
                'qualificationLookup',
                'statusLookup',
                'user.userFacilityRoles.role',
                'user.userFacilityRoles.facility',
                'documents.documentType',
                'documents.statusLookup',
                'documents.attachment',
            ])
        );
    }

    public function store(StoreStaffMemberRequest $request): JsonResponse
    {
        $staffMember = StaffMember::query()->create($request->validated());

        return response()->json(
            $staffMember->load([
                'facility.organization',
                'birthCity.province.region.country',
                'qualificationLookup',
                'statusLookup',
                'user.userFacilityRoles.role',
                'user.userFacilityRoles.facility',
            ]),
            201
        );
    }

    public function update(StoreStaffMemberRequest $request, StaffMember $staffMember): JsonResponse
    {
        $staffMember->update($request->validated());

        return response()->json(
            $staffMember->load([
                'facility.organization',
                'birthCity.province.region.country',
                'qualificationLookup',
                'statusLookup',
                'user.userFacilityRoles.role',
                'user.userFacilityRoles.facility',
            ])
        );
    }

    public function destroy(StaffMember $staffMember): JsonResponse
    {
        if ($staffMember->documents()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare l’educatore: esistono documenti collegati.',
            ], 409);
        }

        $staffMember->delete();

        return response()->json([
            'message' => 'Educatore eliminato con successo.',
        ], Response::HTTP_OK);
    }

    public function linkUser(LinkStaffMemberUserRequest $request, StaffMember $staffMember): JsonResponse
    {
        if ($staffMember->user_id) {
            return response()->json([
                'message' => 'Questo educatore è già collegato a un account utente.',
            ], 409);
        }

        $staffMember->forceFill([
            'user_id' => $request->integer('user_id'),
        ])->save();

        return response()->json([
            'message' => 'Account utente collegato all’educatore.',
            'staff_member' => $staffMember->fresh()->load([
                'facility.organization',
                'birthCity.province.region.country',
                'qualificationLookup',
                'statusLookup',
                'user.userFacilityRoles.role',
                'user.userFacilityRoles.facility',
            ]),
        ]);
    }

    public function previewDocument(Request $request, StaffMember $staffMember, StaffDocument $document)
    {
        abort_unless($document->staff_member_id === $staffMember->id, 404);

        if (! $request->user() || ! $request->user()->hasPermission('attachments.read', $staffMember->facility_id)) {
            throw new HttpException(403, 'Permesso insufficiente per visualizzare il documento dello staff.');
        }

        $attachment = $document->attachment()->firstOrFail();

        if ($attachment->security_status !== 'clean') {
            throw new HttpException(423, 'Documento non disponibile: verifica di sicurezza non completata o non superata.');
        }

        $summary = sprintf(
            '%s ha visualizzato il documento staff %s di %s %s (%s).',
            $this->auditLogService->resolveActorDisplayName($request->user()),
            $attachment->original_name,
            $staffMember->first_name,
            $staffMember->last_name,
            $staffMember->employee_code
        );

        $this->auditLogService->record($request, [
            'facility_id' => $staffMember->facility_id,
            'action' => 'read',
            'resource_type' => 'staff_document_preview',
            'resource_id' => (string) $document->id,
            'resource_label' => $attachment->original_name,
            'operation_summary' => $summary,
            'new_values_json' => [
                'staff_member_id' => $staffMember->id,
                'staff_document_id' => $document->id,
                'attachment_id' => $attachment->id,
                'mime_type' => $attachment->mime_type,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return Storage::disk($attachment->disk)->response(
            $attachment->path,
            $attachment->original_name,
            [
                'Content-Type' => $attachment->mime_type ?: 'application/octet-stream',
                'Content-Disposition' => 'inline; filename="'.$attachment->original_name.'"',
            ]
        );
    }

    public function downloadDocument(Request $request, StaffMember $staffMember, StaffDocument $document)
    {
        abort_unless($document->staff_member_id === $staffMember->id, 404);

        if (! $request->user() || ! $request->user()->hasPermission('attachments.read', $staffMember->facility_id)) {
            throw new HttpException(403, 'Permesso insufficiente per scaricare il documento dello staff.');
        }

        $attachment = $document->attachment()->firstOrFail();

        if ($attachment->security_status !== 'clean') {
            throw new HttpException(423, 'Documento non disponibile: verifica di sicurezza non completata o non superata.');
        }

        $summary = sprintf(
            '%s ha scaricato il documento staff %s di %s %s (%s).',
            $this->auditLogService->resolveActorDisplayName($request->user()),
            $attachment->original_name,
            $staffMember->first_name,
            $staffMember->last_name,
            $staffMember->employee_code
        );

        $this->auditLogService->record($request, [
            'facility_id' => $staffMember->facility_id,
            'action' => 'read',
            'resource_type' => 'staff_document_download',
            'resource_id' => (string) $document->id,
            'resource_label' => $attachment->original_name,
            'operation_summary' => $summary,
            'new_values_json' => [
                'staff_member_id' => $staffMember->id,
                'staff_document_id' => $document->id,
                'attachment_id' => $attachment->id,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return Storage::disk($attachment->disk)->download($attachment->path, $attachment->original_name);
    }
}
