<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\FacilityCertificationRequirement;
use App\Models\StaffMember;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffShiftEligibilityController extends Controller
{
    public function __construct(private readonly AuditLogService $audit = new AuditLogService()) {}

    public function show(Request $request, Facility $facility): JsonResponse
    {
        $requirements = FacilityCertificationRequirement::query()->where('facility_id', $facility->id)->where('is_required', true)->with('certificationType:id,name')->get();
        $staff = $facility->staffMembers()->where('status_code', 'ACTIVE')->with(['documents.documentType:id,name', 'certifications.certificationType:id,name'])->orderBy('last_name')->orderBy('first_name')->get();
        $rows = $staff->map(function (StaffMember $member) use ($requirements): array {
            $alerts = $member->documents->filter(fn ($document) => $document->expiry_status === 'expired')->map(fn ($document) => ['code' => 'staff_document_expired', 'severity' => 'warning', 'message' => 'Documento professionale scaduto: '.($document->documentType?->name ?? 'tipo non classificato').'.', 'reference_id' => $document->id]);
            foreach ($requirements->filter(fn ($requirement) => ! $requirement->qualification_code || $requirement->qualification_code === $member->qualification_code) as $requirement) {
                $matches = $member->certifications->where('staff_certification_type_id', $requirement->staff_certification_type_id);
                if ($matches->contains(fn ($item) => ! in_array($item->validity_status, ['expired', 'revoked'], true))) continue;
                $status = $matches->sortByDesc('expires_at')->first()?->validity_status;
                $code = $status === 'revoked' ? 'certification_revoked' : ($status === 'expired' ? 'certification_expired' : 'certification_missing');
                $alerts->push(['code' => $code, 'severity' => 'warning', 'message' => match ($code) { 'certification_expired' => 'Certificazione scaduta: ', 'certification_revoked' => 'Certificazione revocata: ', default => 'Certificazione richiesta assente: ' }.($requirement->certificationType?->name ?? 'tipo non classificato').'.', 'reference_id' => $requirement->id]);
            }
            return ['staff_member_id' => $member->id, 'employee_code' => $member->employee_code, 'display_name' => trim($member->last_name.' '.$member->first_name), 'qualification_code' => $member->qualification_code, 'can_assign' => true, 'requires_attention' => $alerts->isNotEmpty(), 'alerts' => $alerts->values()];
        })->values();
        $payload = ['facility' => $facility->only(['id','code','name']), 'evaluated_at' => now()->toIso8601String(), 'enforcement' => 'advisory', 'rows' => $rows];
        $this->audit->record($request, ['facility_id' => $facility->id, 'action' => 'read', 'resource_type' => 'staff_shift_eligibility', 'resource_label' => $facility->name, 'operation_summary' => $this->audit->resolveActorDisplayName($request->user()).' ha consultato il controllo consultivo di idoneità turni della struttura '.$facility->name.'.', 'new_values_json' => ['staff_count' => $rows->count(), 'attention_count' => $rows->where('requires_attention', true)->count(), 'enforcement' => 'advisory']]);
        $this->audit->markHandled($request);
        return response()->json($payload);
    }
}
