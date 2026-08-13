<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shifts\StoreStaffShiftSubstitutionRequest;
use App\Models\StaffShiftAssignment;
use App\Models\StaffShiftSubstitution;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffShiftSubstitutionController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function index(StaffShiftAssignment $shiftAssignment): JsonResponse
    {
        return response()->json(
            $shiftAssignment->substitutions()
                ->with($this->relations())
                ->orderByDesc('id')
                ->get()
                ->map(fn (StaffShiftSubstitution $substitution): array => $this->serialize($substitution))
                ->values()
        );
    }

    public function store(StoreStaffShiftSubstitutionRequest $request, StaffShiftAssignment $shiftAssignment): JsonResponse
    {
        $substitution = StaffShiftSubstitution::query()->create([
            'facility_id' => $shiftAssignment->facility_id,
            'shift_assignment_id' => $shiftAssignment->id,
            'original_staff_member_id' => $shiftAssignment->staff_member_id,
            'replacement_staff_member_id' => $request->integer('replacement_staff_member_id'),
            'reason_code' => (string) $request->input('reason_code'),
            'reason_notes' => $request->input('reason_notes'),
            'effective_starts_at' => $request->date('effective_starts_at') ?? $shiftAssignment->starts_at,
            'effective_ends_at' => $request->date('effective_ends_at') ?? $shiftAssignment->ends_at,
            'status' => StaffShiftSubstitution::STATUS_ACTIVE,
            'created_by_user_id' => $request->user()?->id,
        ]);

        $loaded = $substitution->fresh()->load($this->relations());

        $this->auditLogService->record($request, [
            'facility_id' => $shiftAssignment->facility_id,
            'action' => 'create',
            'resource_type' => 'staff_shift_substitution',
            'resource_id' => (string) $loaded->id,
            'resource_label' => sprintf('Sostituzione turno %s', $shiftAssignment->shift_date?->format('Y-m-d')),
            'operation_summary' => sprintf(
                '%s ha registrato una sostituzione sul turno %s: %s sostituisce %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $shiftAssignment->shift_date?->format('Y-m-d'),
                trim(($loaded->replacementStaffMember->last_name ?? '').' '.($loaded->replacementStaffMember->first_name ?? '')),
                trim(($loaded->originalStaffMember->last_name ?? '').' '.($loaded->originalStaffMember->first_name ?? ''))
            ),
            'new_values_json' => [
                'shift_assignment_id' => $shiftAssignment->id,
                'original_staff_member_id' => $loaded->original_staff_member_id,
                'replacement_staff_member_id' => $loaded->replacement_staff_member_id,
                'reason_code' => $loaded->reason_code,
                'status' => $loaded->status,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->serialize($loaded), 201);
    }

    public function cancel(Request $request, StaffShiftAssignment $shiftAssignment, StaffShiftSubstitution $substitution): JsonResponse
    {
        abort_unless($substitution->shift_assignment_id === $shiftAssignment->id, 404, 'Sostituzione non trovata per il turno selezionato.');
        abort_if($substitution->status !== StaffShiftSubstitution::STATUS_ACTIVE, 422, 'La sostituzione non è più attiva.');

        $substitution->forceFill([
            'status' => StaffShiftSubstitution::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancelled_by_user_id' => $request->user()?->id,
        ])->save();

        $loaded = $substitution->fresh()->load($this->relations());

        $this->auditLogService->record($request, [
            'facility_id' => $shiftAssignment->facility_id,
            'action' => 'update',
            'resource_type' => 'staff_shift_substitution',
            'resource_id' => (string) $loaded->id,
            'resource_label' => sprintf('Sostituzione turno %s', $shiftAssignment->shift_date?->format('Y-m-d')),
            'operation_summary' => sprintf(
                '%s ha annullato la sostituzione del turno %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $shiftAssignment->shift_date?->format('Y-m-d')
            ),
            'old_values_json' => [
                'status' => StaffShiftSubstitution::STATUS_ACTIVE,
            ],
            'new_values_json' => [
                'status' => $loaded->status,
                'cancelled_at' => $loaded->cancelled_at?->toIso8601String(),
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->serialize($loaded));
    }

    private function relations(): array
    {
        return [
            'shiftAssignment.shiftTemplate',
            'originalStaffMember.user',
            'replacementStaffMember.user',
            'createdBy:id,first_name,last_name,email',
            'cancelledBy:id,first_name,last_name,email',
        ];
    }

    private function serialize(StaffShiftSubstitution $substitution): array
    {
        return [
            'id' => $substitution->id,
            'facility_id' => $substitution->facility_id,
            'shift_assignment_id' => $substitution->shift_assignment_id,
            'original_staff_member_id' => $substitution->original_staff_member_id,
            'replacement_staff_member_id' => $substitution->replacement_staff_member_id,
            'reason_code' => $substitution->reason_code,
            'reason_notes' => $substitution->reason_notes,
            'effective_starts_at' => $substitution->effective_starts_at?->toIso8601String(),
            'effective_ends_at' => $substitution->effective_ends_at?->toIso8601String(),
            'status' => $substitution->status,
            'cancelled_at' => $substitution->cancelled_at?->toIso8601String(),
            'shift_assignment' => $substitution->shiftAssignment ? [
                'id' => $substitution->shiftAssignment->id,
                'shift_date' => $substitution->shiftAssignment->shift_date?->toDateString(),
                'status' => $substitution->shiftAssignment->status,
                'shift_template' => $substitution->shiftAssignment->shiftTemplate ? [
                    'id' => $substitution->shiftAssignment->shiftTemplate->id,
                    'code' => $substitution->shiftAssignment->shiftTemplate->code,
                    'name' => $substitution->shiftAssignment->shiftTemplate->name,
                ] : null,
            ] : null,
            'original_staff_member' => $substitution->originalStaffMember ? [
                'id' => $substitution->originalStaffMember->id,
                'first_name' => $substitution->originalStaffMember->first_name,
                'last_name' => $substitution->originalStaffMember->last_name,
                'display_name' => $substitution->originalStaffMember->display_name,
            ] : null,
            'replacement_staff_member' => $substitution->replacementStaffMember ? [
                'id' => $substitution->replacementStaffMember->id,
                'first_name' => $substitution->replacementStaffMember->first_name,
                'last_name' => $substitution->replacementStaffMember->last_name,
                'display_name' => $substitution->replacementStaffMember->display_name,
            ] : null,
            'created_by' => $substitution->createdBy ? [
                'id' => $substitution->createdBy->id,
                'display_name' => trim(($substitution->createdBy->first_name ?? '').' '.($substitution->createdBy->last_name ?? '')),
                'email' => $substitution->createdBy->email,
            ] : null,
            'cancelled_by' => $substitution->cancelledBy ? [
                'id' => $substitution->cancelledBy->id,
                'display_name' => trim(($substitution->cancelledBy->first_name ?? '').' '.($substitution->cancelledBy->last_name ?? '')),
                'email' => $substitution->cancelledBy->email,
            ] : null,
            'created_at' => $substitution->created_at?->toIso8601String(),
            'updated_at' => $substitution->updated_at?->toIso8601String(),
        ];
    }
}
