<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StaffMember;
use App\Models\StaffTimesheetEntry;
use App\Services\AuditLogService;
use App\Services\StaffTimesheetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffTimesheetController extends Controller
{
    public function __construct(
        private readonly StaffTimesheetService $timesheetService = new StaffTimesheetService(),
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function me(Request $request): JsonResponse
    {
        $staffMember = StaffMember::query()->where('user_id', $request->user()?->id)->first();
        abort_unless($staffMember, 404, 'Nessun operatore collegato all utente autenticato.');

        $query = StaffTimesheetEntry::query()
            ->with($this->timesheetService->baseRelations())
            ->where('staff_member_id', $staffMember->id)
            ->orderByDesc('work_date')
            ->orderByDesc('id');

        if ($request->filled('date_from')) {
            $query->whereDate('work_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('work_date', '<=', $request->input('date_to'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }

        return response()->json([
            'staff_member' => $staffMember->load('facility.organization', 'user', 'qualificationLookup'),
            'items' => $query->get(),
        ]);
    }

    public function submit(Request $request, StaffTimesheetEntry $timesheetEntry): JsonResponse
    {
        $staffMember = StaffMember::query()->where('user_id', $request->user()?->id)->firstOrFail();
        abort_unless((int) $timesheetEntry->staff_member_id === (int) $staffMember->id, 403, 'Permesso insufficiente per inviare questa entry.');

        if (! in_array($timesheetEntry->status, [
            StaffTimesheetEntry::STATUS_DRAFT,
            StaffTimesheetEntry::STATUS_COMPUTED,
            StaffTimesheetEntry::STATUS_REJECTED,
        ], true)) {
            abort(422, 'Lo stato corrente non consente l invio del timesheet.');
        }

        if (! $timesheetEntry->actual_ends_at) {
            abort(422, 'Impossibile inviare un timesheet senza timbratura di uscita.');
        }

        $before = [
            'status' => $timesheetEntry->status,
            'submitted_at' => $timesheetEntry->submitted_at?->toIso8601String(),
            'submitted_by_user_id' => $timesheetEntry->submitted_by_user_id,
        ];

        $timesheetEntry->forceFill([
            'status' => StaffTimesheetEntry::STATUS_SUBMITTED,
            'submitted_at' => now(),
            'submitted_by_user_id' => $request->user()?->id,
            'approved_at' => null,
            'approved_by_user_id' => null,
        ])->save();

        $timesheetEntry->refresh()->load($this->timesheetService->baseRelations());

        $this->auditLogService->record($request, [
            'facility_id' => $timesheetEntry->facility_id,
            'action' => 'submit',
            'resource_type' => 'staff_timesheet_entry',
            'resource_id' => (string) $timesheetEntry->id,
            'resource_label' => sprintf('%s %s - %s', $staffMember->first_name, $staffMember->last_name, $timesheetEntry->work_date->format('Y-m-d')),
            'operation_summary' => sprintf(
                '%s ha inviato il timesheet del %s per approvazione.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $timesheetEntry->work_date->format('Y-m-d')
            ),
            'old_values_json' => $before,
            'new_values_json' => [
                'status' => $timesheetEntry->status,
                'submitted_at' => $timesheetEntry->submitted_at?->toIso8601String(),
                'submitted_by_user_id' => $timesheetEntry->submitted_by_user_id,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($timesheetEntry);
    }
}
