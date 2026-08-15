<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\FacilityCertificationRequirement;
use App\Models\StaffDocument;
use App\Models\StaffMember;
use App\Models\StaffMemberCertification;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffHrDashboardController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService = new AuditLogService())
    {
    }

    public function show(Request $request): JsonResponse
    {
        $facilityId = $request->filled('facility_id') ? $request->integer('facility_id') : null;
        $facility = $facilityId ? Facility::query()->findOrFail($facilityId) : null;
        $today = now()->startOfDay();
        $alertDays = (int) config('staff_documents.expiry_alert_days', 30);

        $staffQuery = StaffMember::query()->with(['facility:id,name', 'skills:id,code,name', 'languages:id,code,name', 'certifications']);
        if ($facilityId) {
            $staffQuery->where('facility_id', $facilityId);
        }

        $staff = $staffQuery->orderBy('last_name')->orderBy('first_name')->get();
        $activeStaff = $staff->where('status_code', 'ACTIVE')->values();
        $documentsQuery = StaffDocument::query()->with(['staffMember:id,facility_id,employee_code,first_name,last_name', 'staffMember.facility:id,name', 'documentType:id,code,name'])->whereNotNull('expiry_date');
        $certificationsQuery = StaffMemberCertification::query()->with(['staffMember:id,facility_id,employee_code,first_name,last_name', 'staffMember.facility:id,name', 'certificationType:id,code,name'])->whereNotNull('expires_at');

        if ($facilityId) {
            $documentsQuery->whereHas('staffMember', fn ($query) => $query->where('facility_id', $facilityId));
            $certificationsQuery->whereHas('staffMember', fn ($query) => $query->where('facility_id', $facilityId));
        }

        $documents = $documentsQuery->get()->each->append(['expiry_status', 'days_until_expiry']);
        $certifications = $certificationsQuery->get()->each->append(['validity_status', 'days_until_expiry']);
        $requirements = $facilityId
            ? FacilityCertificationRequirement::query()->where('facility_id', $facilityId)->where('is_required', true)->with('certificationType')->get()
            : collect();
        $complianceAlerts = $facility ? $this->buildComplianceAlerts($activeStaff, $requirements) : collect();

        $kpis = [
            'staff_total' => $staff->count(),
            'staff_active' => $activeStaff->count(),
            'staff_without_user_account' => $activeStaff->whereNull('user_id')->count(),
            'staff_without_skills' => $activeStaff->filter(fn (StaffMember $item) => $item->skills->isEmpty())->count(),
            'staff_without_languages' => $activeStaff->filter(fn (StaffMember $item) => $item->languages->isEmpty())->count(),
            'documents_expired' => $documents->where('expiry_status', 'expired')->count(),
            'documents_expiring' => $documents->where('expiry_status', 'expiring')->count(),
            'certifications_expired' => $certifications->where('validity_status', 'expired')->count(),
            'certifications_expiring' => $certifications->where('validity_status', 'expiring')->count(),
            'certification_requirements_missing' => $complianceAlerts->count(),
        ];
        $kpis += [
            'total_staff' => $kpis['staff_total'], 'active_staff' => $kpis['staff_active'], 'staff_without_account' => $kpis['staff_without_user_account'], 'missing_requirements' => $kpis['certification_requirements_missing'],
        ];

        $payload = [
            'generated_at' => now()->toIso8601String(),
            'facility' => $facility?->only(['id', 'code', 'name']),
            'kpis' => $kpis,
            'alerts' => [
                'documents' => $documents->filter(fn (StaffDocument $item) => in_array($item->expiry_status, ['expired', 'expiring'], true))->sortBy('expiry_date')->take(20)->map(fn (StaffDocument $item) => [
                    'kind' => 'staff_document', 'id' => $item->id, 'status' => $item->expiry_status, 'days_until_expiry' => $item->days_until_expiry,
                    'expires_at' => optional($item->expiry_date)->toDateString(), 'document_type' => $item->documentType?->only(['id', 'code', 'name']),
                    'staff_member' => $item->staffMember?->only(['id', 'employee_code', 'first_name', 'last_name']),
                    'staff_member_id' => $item->staffMember?->id, 'display_name' => $this->staffDisplayName($item->staffMember),
                    'facility_name' => $item->staffMember?->facility?->name, 'document_type_name' => $item->documentType?->name,
                    'expiry_date' => optional($item->expiry_date)->toDateString(),
                ])->values(),
                'certifications' => $certifications->filter(fn (StaffMemberCertification $item) => in_array($item->validity_status, ['expired', 'expiring', 'revoked'], true))->sortBy('expires_at')->take(20)->map(fn (StaffMemberCertification $item) => [
                    'kind' => 'staff_certification', 'id' => $item->id, 'status' => $item->validity_status, 'days_until_expiry' => $item->days_until_expiry,
                    'expires_at' => optional($item->expires_at)->toDateString(), 'certification_type' => $item->certificationType?->only(['id', 'code', 'name']),
                    'staff_member' => $item->staffMember?->only(['id', 'employee_code', 'first_name', 'last_name']),
                    'staff_member_id' => $item->staffMember?->id, 'display_name' => $this->staffDisplayName($item->staffMember),
                    'facility_name' => $item->staffMember?->facility?->name, 'certification_type_name' => $item->certificationType?->name,
                    'expiry_date' => optional($item->expires_at)->toDateString(),
                ])->values(),
                'missing_requirements' => $complianceAlerts->take(20)->values(),
            ],
            'configuration' => ['document_expiry_alert_days' => $alertDays, 'scope' => $facility ? 'facility' : 'all_facilities'],
        ];

        $this->auditLogService->record($request, [
            'facility_id' => $facilityId,
            'action' => 'read',
            'resource_type' => 'staff_hr_dashboard',
            'resource_label' => $facility?->name ?? 'tutte le strutture',
            'operation_summary' => sprintf('%s ha consultato la dashboard HR%s.', $this->auditLogService->resolveActorDisplayName($request->user()), $facility ? ' della struttura '.$facility->name : ''),
            'new_values_json' => ['facility_id' => $facilityId, 'kpis' => $payload['kpis']],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($payload);
    }

    private function buildComplianceAlerts($staff, $requirements)
    {
        return $staff->flatMap(function (StaffMember $staffMember) use ($requirements) {
            return $requirements
                ->filter(fn (FacilityCertificationRequirement $item) => ! $item->qualification_code || $item->qualification_code === $staffMember->qualification_code)
                ->filter(function (FacilityCertificationRequirement $requirement) use ($staffMember): bool {
                    return ! $staffMember->certifications->contains(fn (StaffMemberCertification $certification) => $certification->staff_certification_type_id === $requirement->staff_certification_type_id && ! in_array($certification->validity_status, ['expired', 'revoked'], true));
                })
                ->map(fn (FacilityCertificationRequirement $requirement) => [
                    'kind' => 'missing_certification_requirement', 'requirement_id' => $requirement->id,
                    'certification_type' => $requirement->certificationType?->only(['id', 'code', 'name']),
                    'staff_member' => $staffMember->only(['id', 'employee_code', 'first_name', 'last_name', 'qualification_code']),
                    'staff_member_id' => $staffMember->id, 'display_name' => $this->staffDisplayName($staffMember),
                    'facility_name' => $staffMember->facility?->name, 'certification_type_name' => $requirement->certificationType?->name,
                    'status' => 'missing', 'expiry_date' => null, 'days_until_expiry' => null,
                ]);
        });
    }

    private function staffDisplayName(?StaffMember $staffMember): ?string
    {
        return $staffMember ? trim($staffMember->last_name.' '.$staffMember->first_name) : null;
    }
}
