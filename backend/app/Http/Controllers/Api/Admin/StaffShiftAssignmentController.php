<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shifts\ShiftAssignmentWindow;
use App\Http\Requests\Shifts\StoreStaffShiftAssignmentRequest;
use App\Models\Facility;
use App\Models\StaffMember;
use App\Models\StaffShiftAssignment;
use App\Models\StaffShiftSubstitution;
use App\Models\StaffShiftTemplate;
use App\Models\StaffTimesheetEntry;
use App\Services\AuditLogService;
use App\Services\StaffTimesheetService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;

class StaffShiftAssignmentController extends Controller
{
    public function __construct(
        private readonly StaffTimesheetService $timesheetService = new StaffTimesheetService(),
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

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
            $staffMemberId = $request->integer('staff_member_id');
            $query->where(function ($builder) use ($staffMemberId): void {
                $builder
                    ->where(function ($subQuery) use ($staffMemberId): void {
                        $subQuery
                            ->where('staff_member_id', $staffMemberId)
                            ->whereDoesntHave('activeSubstitution');
                    })
                    ->orWhereHas('substitutions', function ($substitutionQuery) use ($staffMemberId): void {
                        $substitutionQuery
                            ->where('status', StaffShiftSubstitution::STATUS_ACTIVE)
                            ->where('replacement_staff_member_id', $staffMemberId);
                    });
            });
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

    public function month(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
        ]);

        $facilityId = (int) $validated['facility_id'];
        $monthStart = Carbon::createFromDate((int) $validated['year'], (int) $validated['month'], 1)->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $templates = StaffShiftTemplate::query()
            ->where('facility_id', $facilityId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $assignmentsQuery = StaffShiftAssignment::query()
            ->with($this->baseRelations())
            ->where('facility_id', $facilityId)
            ->whereBetween('shift_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->orderBy('shift_date')
            ->orderBy('starts_at');

        if (! empty($validated['staff_member_id'])) {
            $staffMemberId = (int) $validated['staff_member_id'];
            $assignmentsQuery->where(function ($builder) use ($staffMemberId): void {
                $builder
                    ->where(function ($subQuery) use ($staffMemberId): void {
                        $subQuery
                            ->where('staff_member_id', $staffMemberId)
                            ->whereDoesntHave('activeSubstitution');
                    })
                    ->orWhereHas('substitutions', function ($substitutionQuery) use ($staffMemberId): void {
                        $substitutionQuery
                            ->where('status', StaffShiftSubstitution::STATUS_ACTIVE)
                            ->where('replacement_staff_member_id', $staffMemberId);
                    });
            });
        }

        $assignments = $assignmentsQuery->get();
        $timesheetEntries = $this->timesheetEntriesByAssignmentId($assignments);
        $days = $this->buildMonthDays($monthStart, $monthEnd, $templates, $assignments, $timesheetEntries);

        return response()->json([
            'facility_id' => $facilityId,
            'staff_member_id' => $validated['staff_member_id'] ?? null,
            'year' => (int) $validated['year'],
            'month' => (int) $validated['month'],
            'month_start' => $monthStart->toDateString(),
            'month_end' => $monthEnd->toDateString(),
            'summary' => [
                'days_in_month' => $monthEnd->day,
                'total_assignments' => $assignments->count(),
                'planned_assignments_count' => $assignments->where('status', 'planned')->count(),
                'confirmed_assignments_count' => $assignments->where('status', 'confirmed')->count(),
                'completed_assignments_count' => $assignments->where('status', 'completed')->count(),
                'cancelled_assignments_count' => $assignments->where('status', 'cancelled')->count(),
                'days_with_coverage_gap_count' => $days->filter(fn (array $day): bool => ($day['summary']['coverage_gap_total'] ?? 0) > 0)->count(),
                'days_with_actual_gap_count' => $days->filter(fn (array $day): bool => ($day['summary']['actual_coverage_gap_total'] ?? 0) > 0)->count(),
                'days_with_anomalies_count' => $days->filter(fn (array $day): bool => ($day['summary']['anomaly_count'] ?? 0) > 0)->count(),
                'minimum_staff_required_total' => $days->sum(fn (array $day): int => (int) ($day['summary']['minimum_staff_required_total'] ?? 0)),
                'assigned_count_total' => $days->sum(fn (array $day): int => (int) ($day['summary']['assigned_count_total'] ?? 0)),
                'actual_completed_count_total' => $days->sum(fn (array $day): int => (int) ($day['summary']['actual_completed_count_total'] ?? 0)),
            ],
            'days' => $days->all(),
        ]);
    }

    public function exceptions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'types' => ['nullable', 'array'],
            'types.*' => ['string'],
        ]);

        $dateFrom = $request->date('date_from')?->startOfDay() ?? now()->startOfMonth();
        $dateTo = $request->date('date_to')?->endOfDay() ?? now()->endOfMonth();
        $requestedTypes = collect($validated['types'] ?? [])->values();
        $facility = Facility::query()->select(['id', 'name'])->findOrFail((int) $validated['facility_id']);

        $templates = StaffShiftTemplate::query()
            ->where('facility_id', (int) $validated['facility_id'])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $assignments = StaffShiftAssignment::query()
            ->with($this->baseRelations())
            ->where('facility_id', (int) $validated['facility_id'])
            ->whereBetween('shift_date', [$dateFrom->toDateString(), $dateTo->toDateString()])
            ->orderBy('shift_date')
            ->orderBy('starts_at')
            ->get();

        $timesheetEntries = $this->timesheetEntriesByAssignmentId($assignments);
        $items = collect();

        $days = collect();
        $cursor = $dateFrom->copy();
        while ($cursor->lte($dateTo)) {
            $days->push($cursor->copy()->toDateString());
            $cursor->addDay();
        }

        foreach ($days as $day) {
            foreach ($templates as $template) {
                $shiftAssignments = $this->assignmentsForDayAndTemplate($assignments, $day, $template->id);
                $serializedAssignments = $shiftAssignments
                    ->map(fn (StaffShiftAssignment $assignment): array => $this->serializeAssignment($assignment, $timesheetEntries->get($assignment->id)))
                    ->values();
                $completedCount = $serializedAssignments->filter(fn (array $assignment): bool => (bool) data_get($assignment, 'actual.completed'))->count();
                $plannedGap = max(0, (int) $template->minimum_staff_required - $shiftAssignments->count());
                $actualGap = max(0, (int) $template->minimum_staff_required - $completedCount);

                if ($plannedGap > 0) {
                    $items->push([
                        'type' => 'planned_gap',
                        'severity' => 'warning',
                        'shift_date' => $day,
                        'message' => sprintf(
                            'Copertura pianificata insufficiente per il turno %s: assegnati %d su %d richiesti.',
                            $template->name,
                            $shiftAssignments->count(),
                            $template->minimum_staff_required
                        ),
                        'facility' => [
                            'id' => $facility->id,
                            'name' => $facility->name,
                        ],
                        'shift_template' => [
                            'id' => $template->id,
                            'code' => $template->code,
                            'name' => $template->name,
                        ],
                        'shift_assignment_id' => null,
                        'coverage' => [
                            'minimum_staff_required' => $template->minimum_staff_required,
                            'assigned_count' => $shiftAssignments->count(),
                            'actual_completed_count' => $completedCount,
                            'planned_gap' => $plannedGap,
                            'actual_gap' => $actualGap,
                        ],
                        'anomaly_flags' => [],
                        'active_substitution' => false,
                    ]);
                }

                if ($actualGap > 0) {
                    $items->push([
                        'type' => 'actual_gap',
                        'severity' => 'critical',
                        'shift_date' => $day,
                        'message' => sprintf(
                            'Copertura effettiva insufficiente per il turno %s: completati %d su %d richiesti.',
                            $template->name,
                            $completedCount,
                            $template->minimum_staff_required
                        ),
                        'facility' => [
                            'id' => $facility->id,
                            'name' => $facility->name,
                        ],
                        'shift_template' => [
                            'id' => $template->id,
                            'code' => $template->code,
                            'name' => $template->name,
                        ],
                        'shift_assignment_id' => null,
                        'coverage' => [
                            'minimum_staff_required' => $template->minimum_staff_required,
                            'assigned_count' => $shiftAssignments->count(),
                            'actual_completed_count' => $completedCount,
                            'planned_gap' => $plannedGap,
                            'actual_gap' => $actualGap,
                        ],
                        'anomaly_flags' => [],
                        'active_substitution' => false,
                    ]);
                }
            }
        }

        foreach ($assignments as $assignment) {
            $serialized = $this->serializeAssignment($assignment, $timesheetEntries->get($assignment->id));
            $flags = collect(data_get($serialized, 'actual.anomaly_flags', []))->filter()->values()->all();

            if (! empty($flags)) {
                $items->push([
                    'type' => 'timesheet_anomaly',
                    'severity' => 'critical',
                    'shift_date' => $assignment->shift_date?->toDateString(),
                    'message' => sprintf(
                        'Anomalia sul turno %s del %s per %s.',
                        $assignment->shiftTemplate?->name ?? 'turno',
                        $assignment->shift_date?->format('Y-m-d'),
                        data_get($serialized, 'effective_staff_member.display_name', data_get($serialized, 'staff_member.display_name', 'operatore'))
                    ),
                    'facility' => [
                        'id' => $assignment->facility?->id,
                        'name' => $assignment->facility?->name,
                    ],
                    'shift_template' => $assignment->shiftTemplate ? [
                        'id' => $assignment->shiftTemplate->id,
                        'code' => $assignment->shiftTemplate->code,
                        'name' => $assignment->shiftTemplate->name,
                    ] : null,
                    'shift_assignment_id' => $assignment->id,
                    'coverage' => null,
                    'anomaly_flags' => $flags,
                    'active_substitution' => (bool) ($serialized['has_active_substitution'] ?? false),
                    'assignment' => $serialized,
                ]);
            }

            if (($serialized['has_active_substitution'] ?? false) === true) {
                $items->push([
                    'type' => 'active_substitution',
                    'severity' => 'info',
                    'shift_date' => $assignment->shift_date?->toDateString(),
                    'message' => sprintf(
                        'Sostituzione attiva sul turno %s del %s: %s copre %s.',
                        $assignment->shiftTemplate?->name ?? 'turno',
                        $assignment->shift_date?->format('Y-m-d'),
                        data_get($serialized, 'effective_staff_member.display_name', 'sostituto'),
                        data_get($serialized, 'staff_member.display_name', 'titolare')
                    ),
                    'facility' => [
                        'id' => $assignment->facility?->id,
                        'name' => $assignment->facility?->name,
                    ],
                    'shift_template' => $assignment->shiftTemplate ? [
                        'id' => $assignment->shiftTemplate->id,
                        'code' => $assignment->shiftTemplate->code,
                        'name' => $assignment->shiftTemplate->name,
                    ] : null,
                    'shift_assignment_id' => $assignment->id,
                    'coverage' => null,
                    'anomaly_flags' => [],
                    'active_substitution' => true,
                    'assignment' => $serialized,
                ]);
            }
        }

        if ($requestedTypes->isNotEmpty()) {
            $items = $items
                ->filter(fn (array $item): bool => $requestedTypes->contains((string) ($item['type'] ?? '')))
                ->values();
        } else {
            $items = $items->values();
        }

        return response()->json([
            'facility_id' => (int) $validated['facility_id'],
            'date_from' => $dateFrom->toDateString(),
            'date_to' => $dateTo->toDateString(),
            'summary' => [
                'items_total' => $items->count(),
                'planned_gap_count' => $items->where('type', 'planned_gap')->count(),
                'actual_gap_count' => $items->where('type', 'actual_gap')->count(),
                'timesheet_anomaly_count' => $items->where('type', 'timesheet_anomaly')->count(),
                'active_substitution_count' => $items->where('type', 'active_substitution')->count(),
            ],
            'items' => $items->all(),
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
            ->where('facility_id', $staffMember->facility_id)
            ->whereBetween('shift_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->orderBy('shift_date')
            ->orderBy('starts_at')
            ->get()
            ->filter(function (StaffShiftAssignment $assignment) use ($staffMember): bool {
                $effectiveStaffMemberId = $this->resolveEffectiveStaffMemberId($assignment);

                return (int) $effectiveStaffMemberId === (int) $staffMember->id;
            })
            ->values();

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

    public function myMonth(Request $request): JsonResponse
    {
        $user = $request->user();
        $staffMember = StaffMember::query()->where('user_id', $user?->id)->first();
        abort_unless($staffMember, 404, 'Nessun operatore collegato all utente autenticato.');

        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $monthStart = Carbon::createFromDate((int) $validated['year'], (int) $validated['month'], 1)->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $assignments = StaffShiftAssignment::query()
            ->with($this->baseRelations())
            ->where('facility_id', $staffMember->facility_id)
            ->whereBetween('shift_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->orderBy('shift_date')
            ->orderBy('starts_at')
            ->get()
            ->filter(function (StaffShiftAssignment $assignment) use ($staffMember): bool {
                return (int) $this->resolveEffectiveStaffMemberId($assignment) === (int) $staffMember->id;
            })
            ->values();

        $timesheetEntries = $this->timesheetEntriesByAssignmentId($assignments);
        $days = collect(range(1, $monthEnd->day))->map(function (int $dayNumber) use ($monthStart, $assignments, $timesheetEntries): array {
            $day = $monthStart->copy()->day($dayNumber)->toDateString();
            $dayAssignments = $assignments
                ->filter(fn (StaffShiftAssignment $assignment): bool => $assignment->shift_date?->toDateString() === $day)
                ->map(fn (StaffShiftAssignment $assignment): array => $this->serializeAssignment($assignment, $timesheetEntries->get($assignment->id)))
                ->values();

            return [
                'date' => $day,
                'is_weekend' => in_array($monthStart->copy()->day($dayNumber)->dayOfWeekIso, [6, 7], true),
                'assignments' => $dayAssignments->all(),
                'summary' => [
                    'assigned_count' => $dayAssignments->count(),
                    'completed_count' => $dayAssignments->filter(fn (array $assignment): bool => (bool) data_get($assignment, 'actual.completed'))->count(),
                    'anomaly_count' => $dayAssignments->filter(fn (array $assignment): bool => (bool) data_get($assignment, 'actual.has_anomaly'))->count(),
                    'planned_minutes_total' => $dayAssignments->sum(fn (array $assignment): int => (int) data_get($assignment, 'actual.planned_minutes', 0)),
                    'worked_minutes_total' => $dayAssignments->sum(fn (array $assignment): int => (int) data_get($assignment, 'actual.worked_minutes', 0)),
                ],
            ];
        })->values();

        return response()->json([
            'staff_member' => $staffMember->load('facility.organization', 'user'),
            'year' => (int) $validated['year'],
            'month' => (int) $validated['month'],
            'month_start' => $monthStart->toDateString(),
            'month_end' => $monthEnd->toDateString(),
            'summary' => [
                'days_in_month' => $monthEnd->day,
                'total_assignments' => $assignments->count(),
                'completed_assignments_count' => $assignments->filter(fn (StaffShiftAssignment $assignment) => $this->resolveTimesheetEntryForAssignment($assignment, $timesheetEntries->get($assignment->id))?->actual_ends_at !== null)->count(),
                'days_with_assignments_count' => $days->filter(fn (array $day): bool => ($day['summary']['assigned_count'] ?? 0) > 0)->count(),
                'days_with_anomalies_count' => $days->filter(fn (array $day): bool => ($day['summary']['anomaly_count'] ?? 0) > 0)->count(),
                'planned_minutes_total' => $days->sum(fn (array $day): int => (int) ($day['summary']['planned_minutes_total'] ?? 0)),
                'worked_minutes_total' => $days->sum(fn (array $day): int => (int) ($day['summary']['worked_minutes_total'] ?? 0)),
            ],
            'days' => $days->all(),
        ]);
    }

    public function submitMyShift(Request $request, StaffShiftAssignment $shiftAssignment): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:4000'],
        ]);

        $user = $request->user();
        $staffMember = StaffMember::query()->where('user_id', $user?->id)->first();
        abort_unless($staffMember, 404, 'Nessun operatore collegato all utente autenticato.');

        abort_unless(
            (int) $this->resolveEffectiveStaffMemberId($shiftAssignment->loadMissing($this->baseRelations())) === (int) $staffMember->id,
            403,
            'Permesso insufficiente per chiudere questo turno.'
        );

        $timesheetEntry = $this->resolveTimesheetEntryForAssignment($shiftAssignment);
        abort_unless($timesheetEntry, 404, 'Nessun consuntivo turno disponibile per questa assegnazione.');

        $this->timesheetService->abortIfMonthLocked(
            $timesheetEntry->facility_id,
            $timesheetEntry->work_date->toDateString(),
            'Il mese timesheet è bloccato: non è possibile inviare la chiusura turno.'
        );

        if (! in_array($timesheetEntry->status, [
            StaffTimesheetEntry::STATUS_DRAFT,
            StaffTimesheetEntry::STATUS_COMPUTED,
            StaffTimesheetEntry::STATUS_REJECTED,
        ], true)) {
            abort(422, 'Lo stato corrente non consente la chiusura/firma del turno.');
        }

        if (! $timesheetEntry->actual_ends_at) {
            abort(422, 'Impossibile chiudere un turno senza timbratura di uscita.');
        }

        $before = [
            'status' => $timesheetEntry->status,
            'submitted_at' => $timesheetEntry->submitted_at?->toIso8601String(),
            'submitted_by_user_id' => $timesheetEntry->submitted_by_user_id,
        ];

        if (array_key_exists('notes', $validated)) {
            $timesheetEntry->notes = $validated['notes'];
        }

        $timesheetEntry->forceFill([
            'status' => StaffTimesheetEntry::STATUS_SUBMITTED,
            'submitted_at' => now(),
            'submitted_by_user_id' => $user?->id,
            'approved_at' => null,
            'approved_by_user_id' => null,
        ])->save();

        $timesheetEntry->refresh()->load($this->timesheetService->baseRelations());

        $this->auditLogService->record($request, [
            'facility_id' => $timesheetEntry->facility_id,
            'action' => 'submit',
            'resource_type' => 'staff_shift_assignment',
            'resource_id' => (string) $shiftAssignment->id,
            'resource_label' => sprintf('Turno %s %s', $shiftAssignment->shift_date?->format('Y-m-d'), $shiftAssignment->shiftTemplate?->name ?? ''),
            'operation_summary' => sprintf(
                '%s ha chiuso e firmato operativamente il turno del %s.',
                $this->auditLogService->resolveActorDisplayName($user),
                $shiftAssignment->shift_date?->format('Y-m-d')
            ),
            'old_values_json' => $before,
            'new_values_json' => [
                'timesheet_entry_id' => $timesheetEntry->id,
                'status' => $timesheetEntry->status,
                'submitted_at' => $timesheetEntry->submitted_at?->toIso8601String(),
                'submitted_by_user_id' => $timesheetEntry->submitted_by_user_id,
                'notes' => $timesheetEntry->notes,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json([
            'message' => 'Turno chiuso e firmato con successo.',
            'assignment' => $this->serializeAssignment($shiftAssignment->fresh()->load($this->baseRelations())),
            'timesheet_entry' => $timesheetEntry,
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
            'activeSubstitution.originalStaffMember.user',
            'activeSubstitution.replacementStaffMember.user',
            'activeSubstitution.createdBy:id,first_name,last_name,email',
            'activeSubstitution.cancelledBy:id,first_name,last_name,email',
            'substitutions.originalStaffMember.user',
            'substitutions.replacementStaffMember.user',
            'substitutions.createdBy:id,first_name,last_name,email',
            'substitutions.cancelledBy:id,first_name,last_name,email',
        ];
    }

    private function assignmentsForDayAndTemplate($assignments, string $day, int $templateId)
    {
        return $assignments
            ->filter(fn (StaffShiftAssignment $assignment): bool => $assignment->shift_date?->toDateString() === $day)
            ->where('shift_template_id', $templateId)
            ->values();
    }

    private function buildMonthDays(Carbon $monthStart, Carbon $monthEnd, $templates, $assignments, $timesheetEntries)
    {
        return collect(range(1, $monthEnd->day))->map(function (int $dayNumber) use ($monthStart, $templates, $assignments, $timesheetEntries): array {
            $date = $monthStart->copy()->day($dayNumber);
            $day = $date->toDateString();

            $shiftBlocks = $templates->map(function (StaffShiftTemplate $template) use ($assignments, $day, $timesheetEntries): array {
                $shiftAssignments = $this->assignmentsForDayAndTemplate($assignments, $day, $template->id);
                $serializedAssignments = $shiftAssignments
                    ->map(fn (StaffShiftAssignment $assignment): array => $this->serializeAssignment($assignment, $timesheetEntries->get($assignment->id)))
                    ->values();
                $startedCount = $serializedAssignments->filter(fn (array $assignment): bool => (bool) data_get($assignment, 'actual.started'))->count();
                $completedCount = $serializedAssignments->filter(fn (array $assignment): bool => (bool) data_get($assignment, 'actual.completed'))->count();
                $anomalyCount = $serializedAssignments->filter(fn (array $assignment): bool => (bool) data_get($assignment, 'actual.has_anomaly'))->count();
                $coverageGap = max(0, $template->minimum_staff_required - $shiftAssignments->count());
                $actualCoverageGap = max(0, $template->minimum_staff_required - $completedCount);

                return [
                    'shift_template' => $template,
                    'minimum_staff_required' => $template->minimum_staff_required,
                    'assigned_count' => $shiftAssignments->count(),
                    'coverage_gap' => $coverageGap,
                    'actual_started_count' => $startedCount,
                    'actual_completed_count' => $completedCount,
                    'actual_coverage_gap' => $actualCoverageGap,
                    'anomaly_count' => $anomalyCount,
                    'assignments' => $serializedAssignments,
                ];
            })->values();

            return [
                'date' => $day,
                'day_of_week_iso' => $date->dayOfWeekIso,
                'is_weekend' => in_array($date->dayOfWeekIso, [6, 7], true),
                'shifts' => $shiftBlocks->all(),
                'summary' => [
                    'minimum_staff_required_total' => $shiftBlocks->sum('minimum_staff_required'),
                    'assigned_count_total' => $shiftBlocks->sum('assigned_count'),
                    'coverage_gap_total' => $shiftBlocks->sum('coverage_gap'),
                    'actual_started_count_total' => $shiftBlocks->sum('actual_started_count'),
                    'actual_completed_count_total' => $shiftBlocks->sum('actual_completed_count'),
                    'actual_coverage_gap_total' => $shiftBlocks->sum('actual_coverage_gap'),
                    'anomaly_count' => $shiftBlocks->sum('anomaly_count'),
                ],
            ];
        })->values();
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
            ->groupBy('shift_assignment_id');
    }

    private function serializeAssignment(StaffShiftAssignment $assignment, $timesheetEntries = null): array
    {
        $timesheetEntry = $this->resolveTimesheetEntryForAssignment($assignment, $timesheetEntries);
        $activeSubstitution = $this->resolveActiveSubstitution($assignment);
        $effectiveStaffMember = $activeSubstitution?->replacementStaffMember ?? $assignment->staffMember;
        $operational = $this->buildOperationalState($assignment, $timesheetEntry);

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
            'effective_staff_member' => $effectiveStaffMember ? [
                'id' => $effectiveStaffMember->id,
                'first_name' => $effectiveStaffMember->first_name,
                'last_name' => $effectiveStaffMember->last_name,
                'display_name' => $effectiveStaffMember->display_name,
            ] : null,
            'has_active_substitution' => $activeSubstitution !== null,
            'active_substitution' => $activeSubstitution ? [
                'id' => $activeSubstitution->id,
                'reason_code' => $activeSubstitution->reason_code,
                'reason_notes' => $activeSubstitution->reason_notes,
                'status' => $activeSubstitution->status,
                'effective_starts_at' => $activeSubstitution->effective_starts_at?->toIso8601String(),
                'effective_ends_at' => $activeSubstitution->effective_ends_at?->toIso8601String(),
                'original_staff_member' => $activeSubstitution->originalStaffMember ? [
                    'id' => $activeSubstitution->originalStaffMember->id,
                    'first_name' => $activeSubstitution->originalStaffMember->first_name,
                    'last_name' => $activeSubstitution->originalStaffMember->last_name,
                    'display_name' => $activeSubstitution->originalStaffMember->display_name,
                ] : null,
                'replacement_staff_member' => $activeSubstitution->replacementStaffMember ? [
                    'id' => $activeSubstitution->replacementStaffMember->id,
                    'first_name' => $activeSubstitution->replacementStaffMember->first_name,
                    'last_name' => $activeSubstitution->replacementStaffMember->last_name,
                    'display_name' => $activeSubstitution->replacementStaffMember->display_name,
                ] : null,
                'created_by' => $activeSubstitution->createdBy ? [
                    'id' => $activeSubstitution->createdBy->id,
                    'display_name' => trim(($activeSubstitution->createdBy->first_name ?? '').' '.($activeSubstitution->createdBy->last_name ?? '')),
                    'email' => $activeSubstitution->createdBy->email,
                ] : null,
            ] : null,
            'operational' => $operational,
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

    private function resolveTimesheetEntryForAssignment(StaffShiftAssignment $assignment, $timesheetEntries = null): ?StaffTimesheetEntry
    {
        $entries = collect($timesheetEntries instanceof Collection ? $timesheetEntries : []);

        if ($entries->isEmpty()) {
            $entries = StaffTimesheetEntry::query()
                ->where('shift_assignment_id', $assignment->id)
                ->orderByDesc('id')
                ->get();
        }

        $replacementStaffId = $this->resolveActiveSubstitution($assignment)?->replacement_staff_member_id;

        if ($replacementStaffId) {
            $replacementEntry = $entries
                ->where('staff_member_id', $replacementStaffId)
                ->sortByDesc('id')
                ->first();

            if ($replacementEntry) {
                return $replacementEntry;
            }
        }

        return $entries
            ->where('staff_member_id', $assignment->staff_member_id)
            ->sortByDesc('id')
            ->first()
            ?? $entries->sortByDesc('id')->first();
    }

    private function resolveEffectiveStaffMemberId(StaffShiftAssignment $assignment): int
    {
        return (int) ($this->resolveActiveSubstitution($assignment)?->replacement_staff_member_id ?? $assignment->staff_member_id);
    }

    private function resolveActiveSubstitution(StaffShiftAssignment $assignment): ?StaffShiftSubstitution
    {
        if ($assignment->relationLoaded('activeSubstitution') && $assignment->activeSubstitution) {
            return $assignment->activeSubstitution;
        }

        if ($assignment->relationLoaded('substitutions')) {
            return $assignment->substitutions
                ->where('status', StaffShiftSubstitution::STATUS_ACTIVE)
                ->sortByDesc('id')
                ->first();
        }

        return $assignment->activeSubstitution()->first();
    }

    private function buildOperationalState(StaffShiftAssignment $assignment, ?StaffTimesheetEntry $timesheetEntry): array
    {
        if ($assignment->status === 'cancelled') {
            return [
                'state' => 'cancelled',
                'label' => 'Annullato',
                'timesheet_status' => $timesheetEntry?->status,
                'submitted_at' => $timesheetEntry?->submitted_at?->toIso8601String(),
                'approved_at' => $timesheetEntry?->approved_at?->toIso8601String(),
                'locked_at' => $timesheetEntry?->locked_at?->toIso8601String(),
                'can_submit' => false,
                'has_open_anomalies' => false,
            ];
        }

        $flags = collect($timesheetEntry?->anomaly_flags_json ?? [])->filter()->values()->all();
        $timesheetStatus = $timesheetEntry?->status;

        $state = match (true) {
            $timesheetEntry?->locked_at !== null || $timesheetStatus === StaffTimesheetEntry::STATUS_LOCKED => 'locked',
            $timesheetStatus === StaffTimesheetEntry::STATUS_APPROVED => 'approved',
            $timesheetStatus === StaffTimesheetEntry::STATUS_SUBMITTED => 'signed',
            $timesheetEntry?->actual_ends_at !== null => 'closed',
            $timesheetEntry?->actual_starts_at !== null => 'in_progress',
            default => 'open',
        };

        $label = match ($state) {
            'locked' => 'Bloccato',
            'approved' => 'Approvato',
            'signed' => 'Firmato',
            'closed' => 'Chiuso',
            'in_progress' => 'In corso',
            default => 'Aperto',
        };

        return [
            'state' => $state,
            'label' => $label,
            'timesheet_status' => $timesheetStatus,
            'submitted_at' => $timesheetEntry?->submitted_at?->toIso8601String(),
            'approved_at' => $timesheetEntry?->approved_at?->toIso8601String(),
            'locked_at' => $timesheetEntry?->locked_at?->toIso8601String(),
            'can_submit' => $timesheetEntry !== null
                && $timesheetEntry->actual_ends_at !== null
                && in_array($timesheetStatus, [
                    StaffTimesheetEntry::STATUS_DRAFT,
                    StaffTimesheetEntry::STATUS_COMPUTED,
                    StaffTimesheetEntry::STATUS_REJECTED,
                ], true),
            'has_open_anomalies' => ! empty($flags) && ! in_array($timesheetStatus, [
                StaffTimesheetEntry::STATUS_APPROVED,
                StaffTimesheetEntry::STATUS_LOCKED,
            ], true),
        ];
    }
}
