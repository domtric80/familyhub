<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shifts\StoreStaffAttendanceEventRequest;
use App\Models\StaffAttendanceEvent;
use App\Models\StaffMember;
use App\Models\StaffShiftAssignment;
use App\Services\AuditLogService;
use App\Services\StaffTimesheetService;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffAttendanceEventController extends Controller
{
    public function __construct(
        private readonly StaffTimesheetService $timesheetService = new StaffTimesheetService(),
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function store(StoreStaffAttendanceEventRequest $request): JsonResponse
    {
        $staffMember = StaffMember::query()->where('user_id', $request->user()?->id)->firstOrFail();
        $assignment = $request->filled('shift_assignment_id')
            ? StaffShiftAssignment::query()->findOrFail($request->integer('shift_assignment_id'))
            : null;
        $occurredAt = Carbon::parse((string) $request->input('occurred_at'));
        $workDate = $this->timesheetService->resolveWorkDate(
            $request->integer('facility_id'),
            $staffMember->id,
            $assignment,
            (string) $request->input('event_type'),
            $occurredAt,
        );

        $event = StaffAttendanceEvent::query()->create([
            'facility_id' => $request->integer('facility_id'),
            'staff_member_id' => $staffMember->id,
            'shift_assignment_id' => $assignment?->id,
            'event_type' => $request->input('event_type'),
            'work_date' => $workDate,
            'occurred_at' => $occurredAt,
            'source_type' => $request->input('source_type', 'web'),
            'geo_latitude' => $request->input('geo_latitude'),
            'geo_longitude' => $request->input('geo_longitude'),
            'geo_accuracy_meters' => $request->input('geo_accuracy_meters'),
            'device_fingerprint' => $request->input('device_fingerprint'),
            'ip_address' => $request->ip(),
            'notes' => $request->input('notes'),
            'created_by_user_id' => $request->user()?->id,
        ]);

        $entry = $this->timesheetService->recomputeForWorkDate(
            $event->facility_id,
            $event->staff_member_id,
            $event->work_date->toDateString(),
            $event->shift_assignment_id,
        );

        $this->auditLogService->record($request, [
            'facility_id' => $event->facility_id,
            'action' => 'create',
            'resource_type' => 'staff_attendance_event',
            'resource_id' => (string) $event->id,
            'resource_label' => sprintf('%s %s', $staffMember->first_name, $staffMember->last_name),
            'operation_summary' => sprintf(
                '%s ha registrato la timbratura %s per il timesheet del %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $event->event_type,
                $event->work_date->format('Y-m-d')
            ),
            'new_values_json' => [
                'event_type' => $event->event_type,
                'work_date' => $event->work_date->toDateString(),
                'occurred_at' => $event->occurred_at?->toIso8601String(),
                'shift_assignment_id' => $event->shift_assignment_id,
                'timesheet_entry_id' => $entry->id,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json([
            'event' => $event->load([
                'facility.organization',
                'staffMember.user',
                'shiftAssignment.shiftTemplate',
                'createdBy:id,first_name,last_name,email',
            ]),
            'timesheet_entry' => $entry,
        ], 201);
    }

    public function today(Request $request): JsonResponse
    {
        $staffMember = StaffMember::query()->where('user_id', $request->user()?->id)->firstOrFail();
        $today = now()->toDateString();

        $events = StaffAttendanceEvent::query()
            ->with([
                'shiftAssignment.shiftTemplate',
                'createdBy:id,first_name,last_name,email',
            ])
            ->where('staff_member_id', $staffMember->id)
            ->whereDate('occurred_at', $today)
            ->orderBy('occurred_at')
            ->orderBy('id')
            ->get();

        return response()->json($events);
    }

    public function index(Request $request): JsonResponse
    {
        $staffMember = StaffMember::query()->where('user_id', $request->user()?->id)->firstOrFail();

        $query = StaffAttendanceEvent::query()
            ->with([
                'shiftAssignment.shiftTemplate',
                'createdBy:id,first_name,last_name,email',
            ])
            ->where('staff_member_id', $staffMember->id)
            ->orderBy('occurred_at')
            ->orderBy('id');

        if ($request->filled('timesheet_entry_id')) {
            $timesheetEntry = \App\Models\StaffTimesheetEntry::query()
                ->where('staff_member_id', $staffMember->id)
                ->findOrFail($request->integer('timesheet_entry_id'));

            $query
                ->where('facility_id', $timesheetEntry->facility_id)
                ->whereDate('work_date', $timesheetEntry->work_date)
                ->when(
                    $timesheetEntry->shift_assignment_id,
                    fn ($builder) => $builder->where(function ($subQuery) use ($timesheetEntry): void {
                        $subQuery
                            ->where('shift_assignment_id', $timesheetEntry->shift_assignment_id)
                            ->orWhereNull('shift_assignment_id');
                    }),
                );
        }

        return response()->json($query->get());
    }
}
