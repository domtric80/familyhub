<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shifts\ShiftAssignmentWindow;
use App\Http\Requests\Shifts\StoreStaffShiftAssignmentRequest;
use App\Models\StaffMember;
use App\Models\StaffShiftAssignment;
use App\Models\StaffShiftTemplate;
use App\Models\StaffTimesheetEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class StaffShiftAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StaffShiftAssignment::query()
            ->with($this->baseRelations())
            ->orderBy('shift_date')
            ->orderBy('starts_at');

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->integer('staff_member_id'));
        }

        if ($request->filled('shift_template_id')) {
            $query->where('shift_template_id', $request->integer('shift_template_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('shift_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('shift_date', '<=', $request->input('date_to'));
        }

        $assignments = $query->get();
        $timesheetEntries = $this->timesheetEntriesByAssignmentId($assignments);

        return response()->json(
            $assignments->map(
                fn (StaffShiftAssignment $assignment): array => $this->serializeAssignment($assignment, $timesheetEntries->get($assignment->id))
            )->values()
        );
    }

    public function week(Request $request): JsonResponse
    {
        $facilityId = $request->integer('facility_id');
        $weekStart = $request->date('week_start')?->startOfDay() ?? now()->startOfWeek();
        $weekEnd = $weekStart->copy()->addDays(6);

        $templates = StaffShiftTemplate::query()
            ->where('facility_id', $facilityId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $assignments = StaffShiftAssignment::query()
            ->with($this->baseRelations())
            ->where('facility_id', $facilityId)
            ->whereBetween('shift_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->orderBy('shift_date')
            ->orderBy('starts_at')
            ->get();

        $timesheetEntries = $this->timesheetEntriesByAssignmentId($assignments);

        $days = collect(range(0, 6))->map(function (int $offset) use ($weekStart, $templates, $assignments, $timesheetEntries): array {
            $day = $weekStart->copy()->addDays($offset)->toDateString();

            return [
                'date' => $day,
                'shifts' => $templates->map(function (StaffShiftTemplate $template) use ($assignments, $day, $timesheetEntries): array {
                    $shiftAssignments = $this->assignmentsForDayAndTemplate($assignments, $day, $template->id);
                    $serializedAssignments = $shiftAssignments
                        ->map(fn (StaffShiftAssignment $assignment): array => $this->serializeAssignment($assignment, $timesheetEntries->get($assignment->id)))
                        ->values();
                    $startedCount = $serializedAssignments->filter(fn (array $assignment): bool => (bool) data_get($assignment, 'actual.started'))->count();
                    $completedCount = $serializedAssignments->filter(fn (array $assignment): bool => (bool) data_get($assignment, 'actual.completed'))->count();
                    $anomalyCount = $serializedAssignments->filter(fn (array $assignment): bool => (bool) data_get($assignment, 'actual.has_anomaly'))->count();

                    return [
                        'shift_template' => $template,
                        'minimum_staff_required' => $template->minimum_staff_required,
                        'assigned_count' => $shiftAssignments->count(),
                        'coverage_gap' => max(0, $template->minimum_staff_required - $shiftAssignments->count()),
                        'actual_started_count' => $startedCount,
                        'actual_completed_count' => $completedCount,
                        'actual_coverage_gap' => max(0, $template->minimum_staff_required - $completedCount),
                        'anomaly_count' => $anomalyCount,
                        'assignments' => $serializedAssignments,
                    ];
                })->values(),
            ];
        })->values();

        return response()->json([
            'facility_id' => $facilityId,
            'week_start' => $weekStart->toDateString(),
            'week_end' => $weekEnd->toDateString(),
            'days' => $days,
        ]);
    }

    public function store(StoreStaffShiftAssignmentRequest $request): JsonResponse
    {
        $template = StaffShiftTemplate::query()->findOrFail($request->integer('shift_template_id'));
        [$startsAt, $endsAt] = ShiftAssignmentWindow::fromTemplate($template, (string) $request->input('shift_date'));

        $assignment = StaffShiftAssignment::query()->create([
            ...$request->validated(),
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'status' => $request->input('status', 'planned'),
            'assigned_by_user_id' => $request->user()?->id,
        ]);

        $loadedAssignment = $this->loadAssignment($assignment);

        return response()->json($this->serializeAssignment($loadedAssignment), 201);
    }

    public function show(StaffShiftAssignment $shiftAssignment): JsonResponse
    {
        $assignment = $this->loadAssignment($shiftAssignment);

        return response()->json($this->serializeAssignment($assignment));
    }

    public function update(StoreStaffShiftAssignmentRequest $request, StaffShiftAssignment $shiftAssignment): JsonResponse
    {
        $template = StaffShiftTemplate::query()->findOrFail($request->integer('shift_template_id'));
        [$startsAt, $endsAt] = ShiftAssignmentWindow::fromTemplate($template, (string) $request->input('shift_date'));

        $shiftAssignment->update([
            ...$request->validated(),
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'status' => $request->input('status', $shiftAssignment->status),
            'assigned_by_user_id' => $request->user()?->id,
        ]);

        $assignment = $this->loadAssignment($shiftAssignment->fresh());

        return response()->json($this->serializeAssignment($assignment));
    }

    public function destroy(StaffShiftAssignment $shiftAssignment): JsonResponse
    {
        $shiftAssignment->delete();

        return response()->json([
            'message' => 'Assegnazione turno eliminata.',
        ], Response::HTTP_OK);
    }

    public function myWeek(Request $request): JsonResponse
    {
        $user = $request->user();
        $staffMember = StaffMember::query()->where('user_id', $user?->id)->first();
        abort_unless($staffMember, 404, 'Nessun operatore collegato all utente autenticato.');

        $weekStart = $request->date('week_start')?->startOfDay() ?? now()->startOfWeek();
        $weekEnd = $weekStart->copy()->addDays(6);

        $assignments = StaffShiftAssignment::query()
            ->with($this->baseRelations())
            ->where('staff_member_id', $staffMember->id)
            ->whereBetween('shift_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->orderBy('shift_date')
            ->orderBy('starts_at')
            ->get();

        $timesheetEntries = $this->timesheetEntriesByAssignmentId($assignments);

        return response()->json([
            'staff_member' => $staffMember->load('facility.organization', 'user'),
            'week_start' => $weekStart->toDateString(),
            'week_end' => $weekEnd->toDateString(),
            'assignments' => $assignments->map(
                fn (StaffShiftAssignment $assignment): array => $this->serializeAssignment($assignment, $timesheetEntries->get($assignment->id))
            )->values(),
        ]);
    }

    private function loadAssignment(StaffShiftAssignment $assignment): StaffShiftAssignment
    {
        return $assignment->load($this->baseRelations());
    }

    private function baseRelations(): array
    {
        return [
            'facility.organization',
            'shiftTemplate',
            'staffMember.user',
            'staffMember.qualificationLookup',
            'assignedBy:id,first_name,last_name,email',
        ];
    }

    private function assignmentsForDayAndTemplate($assignments, string $day, int $templateId)
    {
        return $assignments
            ->filter(fn (StaffShiftAssignment $assignment): bool => $assignment->shift_date?->toDateString() === $day)
            ->where('shift_template_id', $templateId)
            ->values();
    }

    private function timesheetEntriesByAssignmentId($assignments)
    {
        $assignmentIds = $assignments->pluck('id')->filter()->values();

        if ($assignmentIds->isEmpty()) {
            return collect();
        }

        return StaffTimesheetEntry::query()
            ->whereIn('shift_assignment_id', $assignmentIds)
            ->orderByDesc('id')
            ->get()
            ->unique('shift_assignment_id')
            ->keyBy('shift_assignment_id');
    }

    private function serializeAssignment(StaffShiftAssignment $assignment, ?StaffTimesheetEntry $timesheetEntry = null): array
    {
        $timesheetEntry ??= StaffTimesheetEntry::query()
            ->where('shift_assignment_id', $assignment->id)
            ->latest('id')
            ->first();

        $flags = collect($timesheetEntry?->anomaly_flags_json ?? [])->values()->all();

        return [
            'id' => $assignment->id,
            'facility_id' => $assignment->facility_id,
            'shift_template_id' => $assignment->shift_template_id,
            'staff_member_id' => $assignment->staff_member_id,
            'shift_date' => $assignment->shift_date?->toDateString(),
            'starts_at' => $assignment->starts_at?->toIso8601String(),
            'ends_at' => $assignment->ends_at?->toIso8601String(),
            'status' => $assignment->status,
            'notes' => $assignment->notes,
            'facility' => $assignment->facility ? [
                'id' => $assignment->facility->id,
                'name' => $assignment->facility->name,
            ] : null,
            'shift_template' => $assignment->shiftTemplate,
            'staff_member' => $assignment->staffMember ? [
                'id' => $assignment->staffMember->id,
                'first_name' => $assignment->staffMember->first_name,
                'last_name' => $assignment->staffMember->last_name,
                'display_name' => $assignment->staffMember->display_name,
            ] : null,
            'actual' => [
                'timesheet_entry_id' => $timesheetEntry?->id,
                'status' => $timesheetEntry?->status,
                'started' => $timesheetEntry?->actual_starts_at !== null,
                'completed' => $timesheetEntry?->actual_ends_at !== null,
                'planned_start' => $timesheetEntry?->planned_starts_at?->toIso8601String(),
                'planned_end' => $timesheetEntry?->planned_ends_at?->toIso8601String(),
                'actual_start' => $timesheetEntry?->actual_starts_at?->toIso8601String(),
                'actual_end' => $timesheetEntry?->actual_ends_at?->toIso8601String(),
                'planned_minutes' => $timesheetEntry?->planned_minutes,
                'worked_minutes' => $timesheetEntry?->worked_minutes,
                'break_minutes' => $timesheetEntry?->break_minutes,
                'ordinary_minutes' => $timesheetEntry?->ordinary_minutes,
                'overtime_minutes' => $timesheetEntry?->overtime_minutes,
                'absence_minutes' => $timesheetEntry?->absence_minutes,
                'variance_minutes' => $timesheetEntry?->variance_minutes,
                'has_anomaly' => ! empty($flags),
                'anomaly_flags' => $flags,
            ],
        ];
    }
}
