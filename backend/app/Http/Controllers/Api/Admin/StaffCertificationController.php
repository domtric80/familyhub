<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFacilityCertificationRequirementRequest;
use App\Http\Requests\Admin\StoreStaffMemberCertificationRequest;
use App\Models\Facility;
use App\Models\FacilityCertificationRequirement;
use App\Models\StaffDocument;
use App\Models\StaffMember;
use App\Models\StaffMemberCertification;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffCertificationController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService = new AuditLogService()) {}

    public function index(StaffMember $staffMember): JsonResponse
    {
        return response()->json($staffMember->certifications()->with(['certificationType', 'document.attachment', 'statusLookup'])->latest('id')->get());
    }

    public function store(StoreStaffMemberCertificationRequest $request, StaffMember $staffMember): JsonResponse
    {
        $this->assertDocumentBelongsToStaff($request, $staffMember);
        $certification = $staffMember->certifications()->create($request->validated());
        $this->auditCertification($request, 'create', $staffMember, $certification);

        return response()->json($this->loadCertification($certification), 201);
    }

    public function show(StaffMember $staffMember, StaffMemberCertification $certification): JsonResponse
    {
        $this->assertCertificationBelongsToStaff($staffMember, $certification);

        return response()->json($this->loadCertification($certification));
    }

    public function update(StoreStaffMemberCertificationRequest $request, StaffMember $staffMember, StaffMemberCertification $certification): JsonResponse
    {
        $this->assertCertificationBelongsToStaff($staffMember, $certification);
        $this->assertDocumentBelongsToStaff($request, $staffMember);
        $before = $this->snapshot($certification);
        $certification->update($request->validated());
        $certification = $this->loadCertification($certification);
        $this->auditCertification($request, 'update', $staffMember, $certification, $before);

        return response()->json($certification);
    }

    public function destroy(Request $request, StaffMember $staffMember, StaffMemberCertification $certification): JsonResponse
    {
        $this->assertCertificationBelongsToStaff($staffMember, $certification);
        $before = $this->snapshot($certification);
        $certification->delete();
        $this->auditCertification($request, 'delete', $staffMember, $certification, $before);

        return response()->json(status: 204);
    }

    public function indexRequirements(Facility $facility): JsonResponse
    {
        return response()->json($facility->certificationRequirements()->with(['certificationType', 'qualificationLookup'])->orderBy('id')->get());
    }

    public function storeRequirement(StoreFacilityCertificationRequirementRequest $request, Facility $facility): JsonResponse
    {
        $requirement = $facility->certificationRequirements()->create($request->validated() + ['is_required' => $request->boolean('is_required', true), 'alert_days' => $request->integer('alert_days', 30)]);
        $this->auditRequirement($request, 'create', $facility, $requirement);

        return response()->json($requirement->load(['certificationType', 'qualificationLookup']), 201);
    }

    public function updateRequirement(StoreFacilityCertificationRequirementRequest $request, Facility $facility, FacilityCertificationRequirement $requirement): JsonResponse
    {
        abort_unless($requirement->facility_id === $facility->id, 404);
        $before = $this->snapshot($requirement);
        $requirement->update($request->validated() + [
            'is_required' => $request->has('is_required') ? $request->boolean('is_required') : $requirement->is_required,
            'alert_days' => $request->has('alert_days') ? $request->integer('alert_days') : $requirement->alert_days,
        ]);
        $this->auditRequirement($request, 'update', $facility, $requirement, $before);

        return response()->json($requirement->fresh()->load(['certificationType', 'qualificationLookup']));
    }

    public function destroyRequirement(Request $request, Facility $facility, FacilityCertificationRequirement $requirement): JsonResponse
    {
        abort_unless($requirement->facility_id === $facility->id, 404);
        $before = $this->snapshot($requirement);
        $requirement->delete();
        $this->auditRequirement($request, 'delete', $facility, $requirement, $before);

        return response()->json(status: 204);
    }

    public function compliance(Facility $facility): JsonResponse
    {
        $requirements = $facility->certificationRequirements()->where('is_required', true)->with('certificationType')->get();
        $staff = $facility->staffMembers()->where('status_code', 'ACTIVE')->with(['certifications.certificationType'])->orderBy('last_name')->get();
        $rows = $staff->map(function (StaffMember $staffMember) use ($requirements): array {
            $applicable = $requirements->filter(fn (FacilityCertificationRequirement $requirement) => ! $requirement->qualification_code || $requirement->qualification_code === $staffMember->qualification_code);
            $items = $applicable->map(function (FacilityCertificationRequirement $requirement) use ($staffMember): array {
                $matching = $staffMember->certifications->where('staff_certification_type_id', $requirement->staff_certification_type_id);
                $certification = $matching->first(fn (StaffMemberCertification $item) => ! in_array($item->validity_status, ['expired', 'revoked'], true));
                $latestCertification = $matching->sortByDesc('expires_at')->first();
                $statusCertification = $certification ?? $latestCertification;

                return [
                    'requirement_id' => $requirement->id,
                    'certification_type' => $requirement->certificationType?->only(['id', 'code', 'name']),
                    'compliant' => (bool) $certification,
                    'certification_id' => $certification?->id,
                    'validity_status' => $statusCertification?->validity_status ?? 'missing',
                    'expires_at' => $statusCertification?->expires_at?->toDateString(),
                    'days_until_expiry' => $statusCertification?->days_until_expiry,
                ];
            })->values();

            return [
                'staff_member' => $staffMember->only(['id', 'employee_code', 'first_name', 'last_name', 'qualification_code']),
                'requirements' => $items,
                'is_compliant' => $items->every(fn (array $item) => $item['compliant']),
            ];
        })->values();

        $flattenedRows = $rows->flatMap(function (array $row): array {
            return collect($row['requirements'])->map(function (array $item) use ($row): array {
                $status = $item['compliant'] ? ($item['validity_status'] === 'valid' ? 'compliant' : $item['validity_status']) : $item['validity_status'];

                return [
                    'staff_member_id' => $row['staff_member']['id'],
                    'display_name' => trim($row['staff_member']['last_name'].' '.$row['staff_member']['first_name']),
                    'qualification_label' => $row['staff_member']['qualification_code'],
                    'certification_type_id' => $item['certification_type']['id'] ?? null,
                    'certification_type_name' => $item['certification_type']['name'] ?? null,
                    'requirement_id' => $item['requirement_id'],
                    'is_mandatory' => true,
                    'status' => $status,
                    'expiry_date' => $item['expires_at'],
                    'days_until_expiry' => $item['days_until_expiry'],
                ];
            })->all();
        })->values();

        return response()->json([
            'facility_id' => $facility->id,
            'summary' => ['staff_total' => $rows->count(), 'compliant' => $rows->where('is_compliant', true)->count(), 'non_compliant' => $rows->where('is_compliant', false)->count()],
            'staff' => $rows,
            'total' => $flattenedRows->count(),
            'compliant' => $flattenedRows->where('status', 'compliant')->count(),
            'non_compliant' => $flattenedRows->where('status', '!=', 'compliant')->count(),
            'rows' => $flattenedRows,
        ]);
    }

    private function assertCertificationBelongsToStaff(StaffMember $staffMember, StaffMemberCertification $certification): void { abort_unless($certification->staff_member_id === $staffMember->id, 404); }
    private function assertDocumentBelongsToStaff(Request $request, StaffMember $staffMember): void { if ($request->filled('staff_document_id')) abort_unless(StaffDocument::query()->whereKey($request->integer('staff_document_id'))->where('staff_member_id', $staffMember->id)->exists(), 422, 'Il documento deve appartenere allo stesso professionista.'); }
    private function loadCertification(StaffMemberCertification $certification): StaffMemberCertification { return $certification->fresh(['certificationType', 'document.attachment', 'statusLookup']); }
    private function snapshot($model): array { return $model->only(['staff_certification_type_id', 'staff_document_id', 'qualification_code', 'reference_number', 'issued_at', 'expires_at', 'status_code', 'is_required', 'alert_days', 'notes']); }
    private function auditCertification(Request $request, string $action, StaffMember $staffMember, StaffMemberCertification $certification, ?array $before = null): void { $certification->loadMissing('certificationType'); $this->auditLogService->record($request, ['facility_id' => $staffMember->facility_id, 'action' => $action, 'resource_type' => 'staff_member_certification', 'resource_id' => (string) $certification->id, 'resource_label' => $certification->certificationType?->name, 'operation_summary' => sprintf('%s ha %s la certificazione %s del professionista %s %s.', $this->auditLogService->resolveActorDisplayName($request->user()), $action === 'create' ? 'registrato' : ($action === 'update' ? 'aggiornato' : 'rimosso'), $certification->certificationType?->name, $staffMember->first_name, $staffMember->last_name), 'old_values_json' => $before, 'new_values_json' => $action === 'delete' ? null : $this->snapshot($certification)]); $this->auditLogService->markHandled($request); }
    private function auditRequirement(Request $request, string $action, Facility $facility, FacilityCertificationRequirement $requirement, ?array $before = null): void { $requirement->loadMissing('certificationType'); $this->auditLogService->record($request, ['facility_id' => $facility->id, 'action' => $action, 'resource_type' => 'facility_certification_requirement', 'resource_id' => (string) $requirement->id, 'resource_label' => $requirement->certificationType?->name, 'operation_summary' => sprintf('%s ha %s il requisito %s della struttura %s.', $this->auditLogService->resolveActorDisplayName($request->user()), $action === 'create' ? 'creato' : ($action === 'update' ? 'aggiornato' : 'rimosso'), $requirement->certificationType?->name, $facility->name), 'old_values_json' => $before, 'new_values_json' => $action === 'delete' ? null : $this->snapshot($requirement)]); $this->auditLogService->markHandled($request); }
}
