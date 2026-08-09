<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaffTimesheetAdjustment;
use App\Models\StaffTimesheetEntry;
use App\Models\StaffTimesheetMonthLock;
use App\Services\AuditLogService;
use App\Services\StaffTimesheetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StaffTimesheetController extends Controller
{
    public function __construct(
        private readonly StaffTimesheetService $timesheetService = new StaffTimesheetService(),
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = StaffTimesheetEntry::query()
            ->with($this->timesheetService->baseRelations())
            ->orderByDesc('work_date')
            ->orderByDesc('id');

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->integer('staff_member_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('work_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('work_date', '<=', $request->input('date_to'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }

        return response()->json($query->get());
    }

    public function adjustmentQueue(Request $request): JsonResponse
    {
        $query = StaffTimesheetAdjustment::query()
            ->with([
                'createdBy:id,first_name,last_name,email',
                'reviewedBy:id,first_name,last_name,email',
                'timesheetEntry.facility:id,name',
                'timesheetEntry.staffMember:id,first_name,last_name,display_name,employee_code',
                'timesheetEntry.shiftAssignment.shiftTemplate:id,name,code',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }

        if ($request->filled('adjustment_type')) {
            $query->where('adjustment_type', (string) $request->input('adjustment_type'));
        }

        if ($request->filled('facility_id')) {
            $facilityId = $request->integer('facility_id');
            $query->whereHas('timesheetEntry', fn ($subQuery) => $subQuery->where('facility_id', $facilityId));
        }

        if ($request->filled('staff_member_id')) {
            $staffMemberId = $request->integer('staff_member_id');
            $query->whereHas('timesheetEntry', fn ($subQuery) => $subQuery->where('staff_member_id', $staffMemberId));
        }

        if ($request->filled('date_from')) {
            $dateFrom = (string) $request->input('date_from');
            $query->whereHas('timesheetEntry', fn ($subQuery) => $subQuery->whereDate('work_date', '>=', $dateFrom));
        }

        if ($request->filled('date_to')) {
            $dateTo = (string) $request->input('date_to');
            $query->whereHas('timesheetEntry', fn ($subQuery) => $subQuery->whereDate('work_date', '<=', $dateTo));
        }

        $items = $query->get()->map(fn (StaffTimesheetAdjustment $adjustment) => [
            'id' => $adjustment->id,
            'timesheet_entry_id' => $adjustment->timesheet_entry_id,
            'adjustment_type' => $adjustment->adjustment_type,
            'delta_minutes' => $adjustment->delta_minutes,
            'reason' => $adjustment->reason,
            'status' => $adjustment->status,
            'created_at' => $adjustment->created_at?->toIso8601String(),
            'reviewed_at' => $adjustment->reviewed_at?->toIso8601String(),
            'review_notes' => $adjustment->review_notes,
            'created_by' => $adjustment->createdBy ? [
                'id' => $adjustment->createdBy->id,
                'first_name' => $adjustment->createdBy->first_name,
                'last_name' => $adjustment->createdBy->last_name,
                'email' => $adjustment->createdBy->email,
            ] : null,
            'reviewed_by' => $adjustment->reviewedBy ? [
                'id' => $adjustment->reviewedBy->id,
                'first_name' => $adjustment->reviewedBy->first_name,
                'last_name' => $adjustment->reviewedBy->last_name,
                'email' => $adjustment->reviewedBy->email,
            ] : null,
            'timesheet_entry' => $adjustment->timesheetEntry ? [
                'id' => $adjustment->timesheetEntry->id,
                'work_date' => $adjustment->timesheetEntry->work_date?->toDateString(),
                'status' => $adjustment->timesheetEntry->status,
                'worked_minutes' => $adjustment->timesheetEntry->worked_minutes,
                'planned_minutes' => $adjustment->timesheetEntry->planned_minutes,
                'variance_minutes' => $adjustment->timesheetEntry->variance_minutes,
                'facility' => $adjustment->timesheetEntry->facility ? [
                    'id' => $adjustment->timesheetEntry->facility->id,
                    'name' => $adjustment->timesheetEntry->facility->name,
                ] : null,
                'staff_member' => $adjustment->timesheetEntry->staffMember ? [
                    'id' => $adjustment->timesheetEntry->staffMember->id,
                    'first_name' => $adjustment->timesheetEntry->staffMember->first_name,
                    'last_name' => $adjustment->timesheetEntry->staffMember->last_name,
                    'display_name' => $adjustment->timesheetEntry->staffMember->display_name,
                    'employee_code' => $adjustment->timesheetEntry->staffMember->employee_code,
                ] : null,
                'shift_assignment' => $adjustment->timesheetEntry->shiftAssignment ? [
                    'id' => $adjustment->timesheetEntry->shiftAssignment->id,
                    'shift_template' => $adjustment->timesheetEntry->shiftAssignment->shiftTemplate ? [
                        'id' => $adjustment->timesheetEntry->shiftAssignment->shiftTemplate->id,
                        'name' => $adjustment->timesheetEntry->shiftAssignment->shiftTemplate->name,
                        'code' => $adjustment->timesheetEntry->shiftAssignment->shiftTemplate->code,
                    ] : null,
                ] : null,
            ] : null,
        ])->values();

        return response()->json($items);
    }

    public function adjustmentKpis(Request $request): JsonResponse
    {
        $baseQuery = StaffTimesheetAdjustment::query();

        if ($request->filled('facility_id')) {
            $facilityId = $request->integer('facility_id');
            $baseQuery->whereHas('timesheetEntry', fn ($subQuery) => $subQuery->where('facility_id', $facilityId));
        }

        if ($request->filled('staff_member_id')) {
            $staffMemberId = $request->integer('staff_member_id');
            $baseQuery->whereHas('timesheetEntry', fn ($subQuery) => $subQuery->where('staff_member_id', $staffMemberId));
        }

        if ($request->filled('date_from')) {
            $dateFrom = (string) $request->input('date_from');
            $baseQuery->whereHas('timesheetEntry', fn ($subQuery) => $subQuery->whereDate('work_date', '>=', $dateFrom));
        }

        if ($request->filled('date_to')) {
            $dateTo = (string) $request->input('date_to');
            $baseQuery->whereHas('timesheetEntry', fn ($subQuery) => $subQuery->whereDate('work_date', '<=', $dateTo));
        }

        $rows = $baseQuery->get();

        $reviewedRows = $rows->filter(fn (StaffTimesheetAdjustment $row) => $row->reviewed_at !== null);
        $averageReviewHours = $reviewedRows->isEmpty()
            ? null
            : round($reviewedRows->avg(function (StaffTimesheetAdjustment $row): float {
                return $row->created_at?->diffInMinutes($row->reviewed_at) / 60 ?? 0;
            }), 2);

        return response()->json([
            'pending_count' => $rows->where('status', StaffTimesheetAdjustment::STATUS_PENDING)->count(),
            'approved_count' => $rows->where('status', StaffTimesheetAdjustment::STATUS_APPROVED)->count(),
            'rejected_count' => $rows->where('status', StaffTimesheetAdjustment::STATUS_REJECTED)->count(),
            'average_review_hours' => $averageReviewHours,
        ]);
    }

    public function dashboardSummary(Request $request): JsonResponse
    {
        $entriesQuery = StaffTimesheetEntry::query()
            ->with([
                'facility:id,name',
                'staffMember:id,first_name,last_name,display_name,employee_code',
                'shiftAssignment.shiftTemplate:id,name,code',
            ]);

        if ($request->filled('facility_id')) {
            $entriesQuery->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('staff_member_id')) {
            $entriesQuery->where('staff_member_id', $request->integer('staff_member_id'));
        }

        if ($request->filled('date_from')) {
            $entriesQuery->whereDate('work_date', '>=', (string) $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $entriesQuery->whereDate('work_date', '<=', (string) $request->input('date_to'));
        }

        $entries = $entriesQuery
            ->orderByDesc('work_date')
            ->orderByDesc('id')
            ->get();

        $entryIds = $entries->pluck('id');

        $adjustments = StaffTimesheetAdjustment::query()
            ->with([
                'createdBy:id,first_name,last_name,email',
                'reviewedBy:id,first_name,last_name,email',
                'timesheetEntry.facility:id,name',
                'timesheetEntry.staffMember:id,first_name,last_name,display_name,employee_code',
            ])
            ->whereIn('timesheet_entry_id', $entryIds)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        $openAnomalies = $entries
            ->filter(fn (StaffTimesheetEntry $entry) => ! empty($entry->anomaly_flags_json) && in_array($entry->status, [
                StaffTimesheetEntry::STATUS_DRAFT,
                StaffTimesheetEntry::STATUS_COMPUTED,
                StaffTimesheetEntry::STATUS_SUBMITTED,
                StaffTimesheetEntry::STATUS_REJECTED,
            ], true))
            ->values();

        $topOvertimeEntries = $entries
            ->filter(fn (StaffTimesheetEntry $entry) => (int) $entry->overtime_minutes > 0)
            ->sortByDesc(fn (StaffTimesheetEntry $entry) => (int) $entry->overtime_minutes)
            ->take(8)
            ->values();

        $absenceReconciliations = $adjustments
            ->where('adjustment_type', 'absence_reconciliation')
            ->where('status', StaffTimesheetAdjustment::STATUS_APPROVED)
            ->values();

        $pendingAdjustments = $adjustments
            ->where('status', StaffTimesheetAdjustment::STATUS_PENDING)
            ->values();

        return response()->json([
            'summary' => [
                'entries_total' => $entries->count(),
                'submitted_entries_count' => $entries->where('status', StaffTimesheetEntry::STATUS_SUBMITTED)->count(),
                'approved_or_locked_entries_count' => $entries->filter(
                    fn (StaffTimesheetEntry $entry) => in_array($entry->status, [
                        StaffTimesheetEntry::STATUS_APPROVED,
                        StaffTimesheetEntry::STATUS_LOCKED,
                    ], true)
                )->count(),
                'open_anomalies_count' => $openAnomalies->count(),
                'overtime_minutes_total' => (int) $entries->sum('overtime_minutes'),
                'absence_reconciliations_count' => $absenceReconciliations->count(),
                'absence_reconciled_minutes_total' => (int) $absenceReconciliations->sum('delta_minutes'),
                'pending_adjustments_count' => $pendingAdjustments->count(),
            ],
            'open_anomalies' => $openAnomalies->take(8)->map(fn (StaffTimesheetEntry $entry) => [
                'id' => $entry->id,
                'work_date' => $entry->work_date?->toDateString(),
                'status' => $entry->status,
                'variance_minutes' => $entry->variance_minutes,
                'overtime_minutes' => $entry->overtime_minutes,
                'absence_minutes' => $entry->absence_minutes,
                'anomaly_flags' => array_values($entry->anomaly_flags_json ?? []),
                'facility' => $entry->facility ? [
                    'id' => $entry->facility->id,
                    'name' => $entry->facility->name,
                ] : null,
                'staff_member' => $entry->staffMember ? [
                    'id' => $entry->staffMember->id,
                    'first_name' => $entry->staffMember->first_name,
                    'last_name' => $entry->staffMember->last_name,
                    'display_name' => $entry->staffMember->display_name,
                    'employee_code' => $entry->staffMember->employee_code,
                ] : null,
            ])->values(),
            'top_overtime_entries' => $topOvertimeEntries->map(fn (StaffTimesheetEntry $entry) => [
                'id' => $entry->id,
                'work_date' => $entry->work_date?->toDateString(),
                'status' => $entry->status,
                'worked_minutes' => $entry->worked_minutes,
                'planned_minutes' => $entry->planned_minutes,
                'overtime_minutes' => $entry->overtime_minutes,
                'facility' => $entry->facility ? [
                    'id' => $entry->facility->id,
                    'name' => $entry->facility->name,
                ] : null,
                'staff_member' => $entry->staffMember ? [
                    'id' => $entry->staffMember->id,
                    'first_name' => $entry->staffMember->first_name,
                    'last_name' => $entry->staffMember->last_name,
                    'display_name' => $entry->staffMember->display_name,
                    'employee_code' => $entry->staffMember->employee_code,
                ] : null,
                'shift_template' => $entry->shiftAssignment?->shiftTemplate ? [
                    'id' => $entry->shiftAssignment->shiftTemplate->id,
                    'name' => $entry->shiftAssignment->shiftTemplate->name,
                    'code' => $entry->shiftAssignment->shiftTemplate->code,
                ] : null,
            ])->values(),
            'absence_reconciliations' => $absenceReconciliations->take(8)->map(fn (StaffTimesheetAdjustment $adjustment) => [
                'id' => $adjustment->id,
                'timesheet_entry_id' => $adjustment->timesheet_entry_id,
                'delta_minutes' => $adjustment->delta_minutes,
                'reason' => $adjustment->reason,
                'reviewed_at' => $adjustment->reviewed_at?->toIso8601String(),
                'timesheet_entry' => $adjustment->timesheetEntry ? [
                    'id' => $adjustment->timesheetEntry->id,
                    'work_date' => $adjustment->timesheetEntry->work_date?->toDateString(),
                    'facility' => $adjustment->timesheetEntry->facility ? [
                        'id' => $adjustment->timesheetEntry->facility->id,
                        'name' => $adjustment->timesheetEntry->facility->name,
                    ] : null,
                    'staff_member' => $adjustment->timesheetEntry->staffMember ? [
                        'id' => $adjustment->timesheetEntry->staffMember->id,
                        'first_name' => $adjustment->timesheetEntry->staffMember->first_name,
                        'last_name' => $adjustment->timesheetEntry->staffMember->last_name,
                        'display_name' => $adjustment->timesheetEntry->staffMember->display_name,
                        'employee_code' => $adjustment->timesheetEntry->staffMember->employee_code,
                    ] : null,
                ] : null,
            ])->values(),
            'pending_adjustments' => $pendingAdjustments->take(8)->map(fn (StaffTimesheetAdjustment $adjustment) => [
                'id' => $adjustment->id,
                'timesheet_entry_id' => $adjustment->timesheet_entry_id,
                'adjustment_type' => $adjustment->adjustment_type,
                'delta_minutes' => $adjustment->delta_minutes,
                'reason' => $adjustment->reason,
                'status' => $adjustment->status,
                'created_at' => $adjustment->created_at?->toIso8601String(),
                'timesheet_entry' => $adjustment->timesheetEntry ? [
                    'id' => $adjustment->timesheetEntry->id,
                    'work_date' => $adjustment->timesheetEntry->work_date?->toDateString(),
                    'facility' => $adjustment->timesheetEntry->facility ? [
                        'id' => $adjustment->timesheetEntry->facility->id,
                        'name' => $adjustment->timesheetEntry->facility->name,
                    ] : null,
                    'staff_member' => $adjustment->timesheetEntry->staffMember ? [
                        'id' => $adjustment->timesheetEntry->staffMember->id,
                        'first_name' => $adjustment->timesheetEntry->staffMember->first_name,
                        'last_name' => $adjustment->timesheetEntry->staffMember->last_name,
                        'display_name' => $adjustment->timesheetEntry->staffMember->display_name,
                        'employee_code' => $adjustment->timesheetEntry->staffMember->employee_code,
                    ] : null,
                ] : null,
            ])->values(),
        ]);
    }

    public function monthLocks(Request $request): JsonResponse
    {
        $query = StaffTimesheetMonthLock::query()
            ->with([
                'facility:id,name',
                'lockedBy:id,first_name,last_name,email',
                'unlockedBy:id,first_name,last_name,email',
            ])
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->orderByDesc('id');

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        return response()->json($query->get()->map(
            fn (StaffTimesheetMonthLock $lock) => $this->serializeMonthLock($lock)
        )->values());
    }

    public function lockMonth(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $dateFrom = sprintf('%04d-%02d-01', $validated['year'], $validated['month']);
        $dateTo = Carbon::parse($dateFrom)->endOfMonth()->toDateString();

        $entries = StaffTimesheetEntry::query()
            ->where('facility_id', $validated['facility_id'])
            ->whereBetween('work_date', [$dateFrom, $dateTo])
            ->get();

        abort_if($entries->isEmpty(), 422, 'Nessuna entry timesheet presente per il periodo selezionato.');
        abort_if(
            $entries->contains(fn (StaffTimesheetEntry $entry) => $entry->status !== StaffTimesheetEntry::STATUS_APPROVED && $entry->status !== StaffTimesheetEntry::STATUS_LOCKED),
            422,
            'Tutte le entry del periodo devono essere approvate prima del lock mensile.'
        );

        $pendingAdjustments = StaffTimesheetAdjustment::query()
            ->whereIn('timesheet_entry_id', $entries->pluck('id'))
            ->where('status', StaffTimesheetAdjustment::STATUS_PENDING)
            ->count();

        abort_if($pendingAdjustments > 0, 422, 'Sono presenti rettifiche pendenti: completare la revisione prima del lock mensile.');

        $lock = StaffTimesheetMonthLock::query()->firstOrNew([
            'facility_id' => $validated['facility_id'],
            'year' => $validated['year'],
            'month' => $validated['month'],
        ]);

        abort_if($lock->exists && $lock->isActive(), 422, 'Il periodo selezionato è già bloccato.');

        $lock->fill([
            'locked_at' => now(),
            'locked_by_user_id' => $request->user()?->id,
            'unlocked_at' => null,
            'unlocked_by_user_id' => null,
            'notes' => $validated['notes'] ?? null,
        ])->save();

        StaffTimesheetEntry::query()
            ->whereIn('id', $entries->pluck('id'))
            ->update([
                'status' => StaffTimesheetEntry::STATUS_LOCKED,
                'locked_at' => now(),
            ]);

        $this->auditLogService->record($request, [
            'facility_id' => (int) $validated['facility_id'],
            'action' => 'lock',
            'resource_type' => 'staff_timesheet_month_lock',
            'resource_id' => (string) $lock->id,
            'resource_label' => sprintf('Lock timesheet %04d-%02d', $validated['year'], $validated['month']),
            'operation_summary' => sprintf(
                '%s ha bloccato il mese timesheet %04d-%02d.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $validated['year'],
                $validated['month']
            ),
            'new_values_json' => [
                'facility_id' => (int) $validated['facility_id'],
                'year' => (int) $validated['year'],
                'month' => (int) $validated['month'],
                'entries_locked' => $entries->count(),
                'notes' => $validated['notes'] ?? null,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json([
            'message' => 'Lock mensile eseguito con successo.',
            'lock' => $this->serializeMonthLock(
                $lock->fresh(['facility:id,name', 'lockedBy:id,first_name,last_name,email'])
            ),
            'entries_locked' => $entries->count(),
        ], 201);
    }

    public function unlockMonth(Request $request, StaffTimesheetMonthLock $monthLock): JsonResponse
    {
        abort_if(! $monthLock->isActive(), 422, 'Il periodo selezionato non risulta attualmente bloccato.');

        $dateFrom = sprintf('%04d-%02d-01', $monthLock->year, $monthLock->month);
        $dateTo = Carbon::parse($dateFrom)->endOfMonth()->toDateString();

        $entries = StaffTimesheetEntry::query()
            ->where('facility_id', $monthLock->facility_id)
            ->whereBetween('work_date', [$dateFrom, $dateTo])
            ->where('status', StaffTimesheetEntry::STATUS_LOCKED)
            ->get();

        $monthLock->forceFill([
            'unlocked_at' => now(),
            'unlocked_by_user_id' => $request->user()?->id,
        ])->save();

        StaffTimesheetEntry::query()
            ->whereIn('id', $entries->pluck('id'))
            ->update([
                'status' => StaffTimesheetEntry::STATUS_APPROVED,
                'locked_at' => null,
            ]);

        $this->auditLogService->record($request, [
            'facility_id' => $monthLock->facility_id,
            'action' => 'unlock',
            'resource_type' => 'staff_timesheet_month_lock',
            'resource_id' => (string) $monthLock->id,
            'resource_label' => sprintf('Lock timesheet %04d-%02d', $monthLock->year, $monthLock->month),
            'operation_summary' => sprintf(
                '%s ha riaperto il mese timesheet %04d-%02d.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $monthLock->year,
                $monthLock->month
            ),
            'new_values_json' => [
                'facility_id' => $monthLock->facility_id,
                'year' => $monthLock->year,
                'month' => $monthLock->month,
                'entries_unlocked' => $entries->count(),
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json([
            'message' => 'Lock mensile riaperto con successo.',
            'lock' => $this->serializeMonthLock(
                $monthLock->fresh(['facility:id,name', 'lockedBy:id,first_name,last_name,email', 'unlockedBy:id,first_name,last_name,email'])
            ),
            'entries_unlocked' => $entries->count(),
        ]);
    }

    public function show(StaffTimesheetEntry $timesheetEntry): JsonResponse
    {
        $loaded = $timesheetEntry->load($this->timesheetService->baseRelations());

        $events = $timesheetEntry->attendanceEvents()
            ->where('facility_id', $timesheetEntry->facility_id)
            ->whereDate('work_date', $timesheetEntry->work_date)
            ->when(
                $timesheetEntry->shift_assignment_id,
                fn ($query) => $query->where(function ($subQuery) use ($timesheetEntry): void {
                    $subQuery
                        ->where('shift_assignment_id', $timesheetEntry->shift_assignment_id)
                        ->orWhereNull('shift_assignment_id');
                }),
            )
            ->with([
                'createdBy:id,first_name,last_name,email',
                'shiftAssignment.shiftTemplate',
            ])
            ->orderBy('occurred_at')
            ->orderBy('id')
            ->get();

        $loaded->setRelation('attendanceEvents', $events);

        return response()->json($loaded);
    }

    public function approve(Request $request, StaffTimesheetEntry $timesheetEntry): JsonResponse
    {
        if (! in_array($timesheetEntry->status, [
            StaffTimesheetEntry::STATUS_SUBMITTED,
            StaffTimesheetEntry::STATUS_COMPUTED,
        ], true)) {
            abort(422, 'Lo stato corrente non consente l approvazione del timesheet.');
        }

        $before = [
            'status' => $timesheetEntry->status,
            'approved_at' => $timesheetEntry->approved_at?->toIso8601String(),
            'approved_by_user_id' => $timesheetEntry->approved_by_user_id,
        ];

        $timesheetEntry->forceFill([
            'status' => StaffTimesheetEntry::STATUS_APPROVED,
            'approved_at' => now(),
            'approved_by_user_id' => $request->user()?->id,
        ])->save();

        $timesheetEntry->refresh();

        $this->auditLogService->record($request, [
            'facility_id' => $timesheetEntry->facility_id,
            'action' => 'approve',
            'resource_type' => 'staff_timesheet_entry',
            'resource_id' => (string) $timesheetEntry->id,
            'resource_label' => sprintf('Timesheet %s', $timesheetEntry->work_date->format('Y-m-d')),
            'operation_summary' => sprintf(
                '%s ha approvato il timesheet del %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $timesheetEntry->work_date->format('Y-m-d')
            ),
            'old_values_json' => $before,
            'new_values_json' => [
                'status' => $timesheetEntry->status,
                'approved_at' => $timesheetEntry->approved_at?->toIso8601String(),
                'approved_by_user_id' => $timesheetEntry->approved_by_user_id,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return $this->show($timesheetEntry);
    }

    public function addAdjustment(Request $request, StaffTimesheetEntry $timesheetEntry): JsonResponse
    {
        $this->timesheetService->abortIfMonthLocked(
            $timesheetEntry->facility_id,
            $timesheetEntry->work_date->toDateString(),
            'Il mese timesheet è bloccato e non accetta rettifiche.'
        );

        $validated = $request->validate([
            'adjustment_type' => ['required', 'string', 'in:' . implode(',', StaffTimesheetEntry::ADJUSTMENT_TYPES)],
            'delta_minutes' => ['required', 'integer', 'between:-720,720', 'not_in:0'],
            'reason' => ['required', 'string', 'max:5000'],
        ]);

        abort_if(
            $timesheetEntry->status === StaffTimesheetEntry::STATUS_LOCKED,
            422,
            'Il timesheet è bloccato e non accetta rettifiche.'
        );

        $before = [
            'worked_minutes' => $timesheetEntry->worked_minutes,
            'ordinary_minutes' => $timesheetEntry->ordinary_minutes,
            'overtime_minutes' => $timesheetEntry->overtime_minutes,
            'absence_minutes' => $timesheetEntry->absence_minutes,
            'variance_minutes' => $timesheetEntry->variance_minutes,
            'status' => $timesheetEntry->status,
        ];

        $adjustment = StaffTimesheetAdjustment::query()->create([
            'timesheet_entry_id' => $timesheetEntry->id,
            'adjustment_type' => $validated['adjustment_type'],
            'delta_minutes' => (int) $validated['delta_minutes'],
            'reason' => trim((string) $validated['reason']),
            'status' => StaffTimesheetAdjustment::STATUS_PENDING,
            'created_by_user_id' => $request->user()?->id,
        ]);

        $this->auditLogService->record($request, [
            'facility_id' => $timesheetEntry->facility_id,
            'action' => 'create',
            'resource_type' => 'staff_timesheet_adjustment',
            'resource_id' => (string) $adjustment->id,
            'resource_label' => sprintf('Rettifica timesheet %s', $timesheetEntry->work_date->format('Y-m-d')),
            'operation_summary' => sprintf(
                '%s ha richiesto una rettifica timesheet %s (%+d minuti) per il %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $validated['adjustment_type'],
                (int) $validated['delta_minutes'],
                $timesheetEntry->work_date->format('Y-m-d')
            ),
            'old_values_json' => $before,
            'new_values_json' => [
                'adjustment' => [
                    'id' => $adjustment->id,
                    'adjustment_type' => $adjustment->adjustment_type,
                    'delta_minutes' => $adjustment->delta_minutes,
                    'status' => $adjustment->status,
                    'reason' => $adjustment->reason,
                ],
                'worked_minutes' => $timesheetEntry->worked_minutes,
                'ordinary_minutes' => $timesheetEntry->ordinary_minutes,
                'overtime_minutes' => $timesheetEntry->overtime_minutes,
                'absence_minutes' => $timesheetEntry->absence_minutes,
                'variance_minutes' => $timesheetEntry->variance_minutes,
                'status' => $timesheetEntry->status,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->show($timesheetEntry)->getData(true), 201);
    }

    public function approveAdjustment(
        Request $request,
        StaffTimesheetEntry $timesheetEntry,
        StaffTimesheetAdjustment $adjustment,
    ): JsonResponse {
        $this->timesheetService->abortIfMonthLocked(
            $timesheetEntry->facility_id,
            $timesheetEntry->work_date->toDateString(),
            'Il mese timesheet è bloccato e non consente approvazioni rettifica.'
        );

        abort_unless(
            $adjustment->timesheet_entry_id === $timesheetEntry->id,
            404,
            'Rettifica non trovata per il timesheet selezionato.'
        );

        abort_if(
            $adjustment->status !== StaffTimesheetAdjustment::STATUS_PENDING,
            422,
            'Solo le rettifiche in attesa possono essere approvate.'
        );

        $validated = $request->validate([
            'review_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $before = [
            'adjustment_status' => $adjustment->status,
            'worked_minutes' => $timesheetEntry->worked_minutes,
            'ordinary_minutes' => $timesheetEntry->ordinary_minutes,
            'overtime_minutes' => $timesheetEntry->overtime_minutes,
            'absence_minutes' => $timesheetEntry->absence_minutes,
            'variance_minutes' => $timesheetEntry->variance_minutes,
            'status' => $timesheetEntry->status,
        ];

        $adjustment->forceFill([
            'status' => StaffTimesheetAdjustment::STATUS_APPROVED,
            'reviewed_by_user_id' => $request->user()?->id,
            'reviewed_at' => now(),
            'review_notes' => trim((string) ($validated['review_notes'] ?? '')),
        ])->save();

        $recomputed = $this->recomputeEntryPreservingLifecycle($timesheetEntry);

        $this->auditLogService->record($request, [
            'facility_id' => $timesheetEntry->facility_id,
            'action' => 'approve',
            'resource_type' => 'staff_timesheet_adjustment',
            'resource_id' => (string) $adjustment->id,
            'resource_label' => sprintf('Rettifica timesheet %s', $timesheetEntry->work_date->format('Y-m-d')),
            'operation_summary' => sprintf(
                '%s ha approvato la rettifica timesheet %s (%+d minuti) per il %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $adjustment->adjustment_type,
                $adjustment->delta_minutes,
                $timesheetEntry->work_date->format('Y-m-d')
            ),
            'old_values_json' => $before,
            'new_values_json' => [
                'adjustment_status' => $adjustment->status,
                'review_notes' => $adjustment->review_notes,
                'worked_minutes' => $recomputed->worked_minutes,
                'ordinary_minutes' => $recomputed->ordinary_minutes,
                'overtime_minutes' => $recomputed->overtime_minutes,
                'absence_minutes' => $recomputed->absence_minutes,
                'variance_minutes' => $recomputed->variance_minutes,
                'status' => $recomputed->status,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return $this->show($recomputed);
    }

    public function rejectAdjustment(
        Request $request,
        StaffTimesheetEntry $timesheetEntry,
        StaffTimesheetAdjustment $adjustment,
    ): JsonResponse {
        $this->timesheetService->abortIfMonthLocked(
            $timesheetEntry->facility_id,
            $timesheetEntry->work_date->toDateString(),
            'Il mese timesheet è bloccato e non consente rifiuti rettifica.'
        );

        abort_unless(
            $adjustment->timesheet_entry_id === $timesheetEntry->id,
            404,
            'Rettifica non trovata per il timesheet selezionato.'
        );

        abort_if(
            $adjustment->status !== StaffTimesheetAdjustment::STATUS_PENDING,
            422,
            'Solo le rettifiche in attesa possono essere rifiutate.'
        );

        $validated = $request->validate([
            'review_notes' => ['required', 'string', 'max:5000'],
        ]);

        $adjustment->forceFill([
            'status' => StaffTimesheetAdjustment::STATUS_REJECTED,
            'reviewed_by_user_id' => $request->user()?->id,
            'reviewed_at' => now(),
            'review_notes' => trim((string) $validated['review_notes']),
        ])->save();

        $this->auditLogService->record($request, [
            'facility_id' => $timesheetEntry->facility_id,
            'action' => 'reject',
            'resource_type' => 'staff_timesheet_adjustment',
            'resource_id' => (string) $adjustment->id,
            'resource_label' => sprintf('Rettifica timesheet %s', $timesheetEntry->work_date->format('Y-m-d')),
            'operation_summary' => sprintf(
                '%s ha rifiutato la rettifica timesheet %s (%+d minuti) per il %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $adjustment->adjustment_type,
                $adjustment->delta_minutes,
                $timesheetEntry->work_date->format('Y-m-d')
            ),
            'old_values_json' => [
                'adjustment_status' => StaffTimesheetAdjustment::STATUS_PENDING,
            ],
            'new_values_json' => [
                'adjustment_status' => $adjustment->status,
                'review_notes' => $adjustment->review_notes,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return $this->show($timesheetEntry);
    }

    public function reject(Request $request, StaffTimesheetEntry $timesheetEntry): JsonResponse
    {
        $this->timesheetService->abortIfMonthLocked(
            $timesheetEntry->facility_id,
            $timesheetEntry->work_date->toDateString(),
            'Il mese timesheet è bloccato: non è possibile rifiutare la entry.'
        );

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:5000'],
        ]);

        if (! in_array($timesheetEntry->status, [
            StaffTimesheetEntry::STATUS_SUBMITTED,
            StaffTimesheetEntry::STATUS_COMPUTED,
            StaffTimesheetEntry::STATUS_APPROVED,
        ], true)) {
            abort(422, 'Lo stato corrente non consente il rifiuto del timesheet.');
        }

        $before = [
            'status' => $timesheetEntry->status,
            'notes' => $timesheetEntry->notes,
        ];

        $existingNotes = trim((string) $timesheetEntry->notes);
        $reasonBlock = sprintf(
            '[%s] Rifiutato da %s: %s',
            now()->format('Y-m-d H:i'),
            $this->auditLogService->resolveActorDisplayName($request->user()),
            trim((string) $validated['reason'])
        );

        $timesheetEntry->forceFill([
            'status' => StaffTimesheetEntry::STATUS_REJECTED,
            'notes' => $existingNotes !== '' ? ($existingNotes . PHP_EOL . $reasonBlock) : $reasonBlock,
            'approved_at' => null,
            'approved_by_user_id' => null,
        ])->save();

        $timesheetEntry->refresh();

        $this->auditLogService->record($request, [
            'facility_id' => $timesheetEntry->facility_id,
            'action' => 'reject',
            'resource_type' => 'staff_timesheet_entry',
            'resource_id' => (string) $timesheetEntry->id,
            'resource_label' => sprintf('Timesheet %s', $timesheetEntry->work_date->format('Y-m-d')),
            'operation_summary' => sprintf(
                '%s ha rifiutato il timesheet del %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $timesheetEntry->work_date->format('Y-m-d')
            ),
            'old_values_json' => $before,
            'new_values_json' => [
                'status' => $timesheetEntry->status,
                'notes' => $timesheetEntry->notes,
                'reason' => $validated['reason'],
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return $this->show($timesheetEntry);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'format' => ['required', 'in:csv'],
            'preset' => ['nullable', 'in:payroll,review,labor_consultant'],
        ]);

        $dateFrom = sprintf('%04d-%02d-01', $validated['year'], $validated['month']);
        $dateTo = date('Y-m-t', strtotime($dateFrom));
        $preset = (string) ($validated['preset'] ?? 'payroll');

        $entries = StaffTimesheetEntry::query()
            ->with([
                'facility:id,name',
                'staffMember:id,first_name,last_name,employee_code,qualification_code',
                'staffMember.qualificationLookup:code,name',
                'shiftAssignment.shiftTemplate:id,name,code',
                'submittedBy:id,first_name,last_name,email',
                'approvedBy:id,first_name,last_name,email',
                'adjustments.createdBy:id,first_name,last_name,email',
                'adjustments.reviewedBy:id,first_name,last_name,email',
            ])
            ->where('facility_id', $validated['facility_id'])
            ->whereBetween('work_date', [$dateFrom, $dateTo])
            ->whereIn('status', [
                StaffTimesheetEntry::STATUS_APPROVED,
                StaffTimesheetEntry::STATUS_LOCKED,
            ])
            ->orderBy('work_date')
            ->orderBy('id')
            ->get();

        abort_if($entries->isEmpty(), 404, 'Nessuna entry approvata o bloccata per il periodo selezionato.');

        $filename = sprintf(
            'timesheet_%s_%d_%04d_%02d.csv',
            $preset,
            $validated['facility_id'],
            $validated['year'],
            $validated['month']
        );

        $this->auditLogService->record($request, [
            'facility_id' => (int) $validated['facility_id'],
            'action' => 'export',
            'resource_type' => 'staff_timesheet_entry',
            'resource_id' => 'month:' . $validated['year'] . '-' . str_pad((string) $validated['month'], 2, '0', STR_PAD_LEFT),
            'resource_label' => $filename,
            'operation_summary' => sprintf(
                '%s ha esportato il CSV timesheet %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $filename
            ),
            'new_values_json' => [
                'facility_id' => (int) $validated['facility_id'],
                'year' => (int) $validated['year'],
                'month' => (int) $validated['month'],
                'rows' => $entries->count(),
                'preset' => $preset,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->streamDownload(function () use ($entries, $preset): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, $this->timesheetExportHeaders($preset), ';');

            foreach ($entries as $entry) {
                fputcsv($handle, $this->timesheetExportRow($entry, $preset), ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function recomputeEntryPreservingLifecycle(StaffTimesheetEntry $timesheetEntry): StaffTimesheetEntry
    {
        $lifecycle = [
            'status' => $timesheetEntry->status,
            'submitted_at' => $timesheetEntry->submitted_at,
            'submitted_by_user_id' => $timesheetEntry->submitted_by_user_id,
            'approved_at' => $timesheetEntry->approved_at,
            'approved_by_user_id' => $timesheetEntry->approved_by_user_id,
            'locked_at' => $timesheetEntry->locked_at,
            'notes' => $timesheetEntry->notes,
        ];

        $recomputed = $this->timesheetService->recomputeForWorkDate(
            $timesheetEntry->facility_id,
            $timesheetEntry->staff_member_id,
            $timesheetEntry->work_date->toDateString(),
            $timesheetEntry->shift_assignment_id,
        );

        $recomputed->forceFill($lifecycle)->save();

        return $recomputed->refresh()->load($this->timesheetService->baseRelations());
    }

    private function serializeMonthLock(StaffTimesheetMonthLock $lock): array
    {
        return [
            'id' => $lock->id,
            'facility_id' => $lock->facility_id,
            'year' => $lock->year,
            'month' => $lock->month,
            'is_locked' => $lock->isActive(),
            'locked_at' => $lock->locked_at?->toIso8601String(),
            'unlocked_at' => $lock->unlocked_at?->toIso8601String(),
            'notes' => $lock->notes,
            'facility' => $lock->facility ? [
                'id' => $lock->facility->id,
                'name' => $lock->facility->name,
            ] : null,
            'locked_by' => $lock->lockedBy ? [
                'id' => $lock->lockedBy->id,
                'first_name' => $lock->lockedBy->first_name,
                'last_name' => $lock->lockedBy->last_name,
                'email' => $lock->lockedBy->email,
            ] : null,
            'unlocked_by' => $lock->unlockedBy ? [
                'id' => $lock->unlockedBy->id,
                'first_name' => $lock->unlockedBy->first_name,
                'last_name' => $lock->unlockedBy->last_name,
                'email' => $lock->unlockedBy->email,
            ] : null,
        ];
    }

    private function timesheetExportHeaders(string $preset): array
    {
        return match ($preset) {
            'review' => [
                'entry_id',
                'work_date',
                'facility',
                'staff_member',
                'employee_code',
                'shift_template',
                'status',
                'submitted_at',
                'submitted_by',
                'approved_at',
                'approved_by',
                'locked_at',
                'anomalies',
                'requested_adjustments_count',
                'pending_adjustments_count',
                'approved_adjustments_count',
                'rejected_adjustments_count',
                'approved_adjustments_minutes',
                'adjustments_detail',
                'notes',
            ],
            'labor_consultant' => [
                'entry_id',
                'work_date',
                'facility',
                'staff_member',
                'employee_code',
                'qualification',
                'shift_template',
                'planned_minutes',
                'worked_minutes',
                'break_minutes',
                'ordinary_minutes',
                'overtime_minutes',
                'night_minutes',
                'absence_minutes',
                'variance_minutes',
                'status',
                'approved_adjustments_minutes',
                'adjustments_detail',
                'submitted_at',
                'approved_at',
                'locked_at',
            ],
            default => [
                'entry_id',
                'work_date',
                'facility',
                'staff_member',
                'employee_code',
                'shift_template',
                'planned_minutes',
                'worked_minutes',
                'break_minutes',
                'ordinary_minutes',
                'overtime_minutes',
                'night_minutes',
                'absence_minutes',
                'variance_minutes',
                'status',
                'approved_adjustments_minutes',
                'approved_adjustments_count',
                'pending_adjustments_count',
            ],
        };
    }

    private function timesheetExportRow(StaffTimesheetEntry $entry, string $preset): array
    {
        $staffName = trim(($entry->staffMember?->first_name ?? '') . ' ' . ($entry->staffMember?->last_name ?? ''));
        $approvedAdjustments = $entry->adjustments->where('status', StaffTimesheetAdjustment::STATUS_APPROVED)->values();
        $pendingAdjustments = $entry->adjustments->where('status', StaffTimesheetAdjustment::STATUS_PENDING)->values();
        $rejectedAdjustments = $entry->adjustments->where('status', StaffTimesheetAdjustment::STATUS_REJECTED)->values();
        $approvedAdjustmentMinutes = (int) $approvedAdjustments->sum('delta_minutes');
        $requestedAdjustmentsCount = $entry->adjustments->count();
        $adjustmentsDetail = $entry->adjustments
            ->map(function (StaffTimesheetAdjustment $adjustment): string {
                $reviewChunk = $adjustment->reviewed_at
                    ? sprintf(
                        'review:%s by %s',
                        $adjustment->reviewed_at->format('Y-m-d H:i'),
                        trim(($adjustment->reviewedBy?->first_name ?? '') . ' ' . ($adjustment->reviewedBy?->last_name ?? ''))
                    )
                    : 'review:-';

                return sprintf(
                    '#%d %s %+dmin [%s] req:%s note:%s %s',
                    $adjustment->id,
                    $adjustment->adjustment_type,
                    $adjustment->delta_minutes,
                    $adjustment->status,
                    $adjustment->created_at?->format('Y-m-d H:i') ?? '-',
                    preg_replace('/\s+/', ' ', trim((string) $adjustment->reason)),
                    $reviewChunk
                );
            })
            ->implode(' | ');

        return match ($preset) {
            'review' => [
                $entry->id,
                $entry->work_date?->format('Y-m-d'),
                $entry->facility?->name,
                $staffName,
                $entry->staffMember?->employee_code,
                $entry->shiftAssignment?->shiftTemplate?->name,
                $entry->status,
                $entry->submitted_at?->format('Y-m-d H:i'),
                trim(($entry->submittedBy?->first_name ?? '') . ' ' . ($entry->submittedBy?->last_name ?? '')),
                $entry->approved_at?->format('Y-m-d H:i'),
                trim(($entry->approvedBy?->first_name ?? '') . ' ' . ($entry->approvedBy?->last_name ?? '')),
                $entry->locked_at?->format('Y-m-d H:i'),
                implode(',', $entry->anomaly_flags_json ?? []),
                $requestedAdjustmentsCount,
                $pendingAdjustments->count(),
                $approvedAdjustments->count(),
                $rejectedAdjustments->count(),
                $approvedAdjustmentMinutes,
                $adjustmentsDetail,
                preg_replace('/\s+/', ' ', trim((string) $entry->notes)),
            ],
            'labor_consultant' => [
                $entry->id,
                $entry->work_date?->format('Y-m-d'),
                $entry->facility?->name,
                $staffName,
                $entry->staffMember?->employee_code,
                $entry->staffMember?->qualification_label,
                $entry->shiftAssignment?->shiftTemplate?->name,
                $entry->planned_minutes,
                $entry->worked_minutes,
                $entry->break_minutes,
                $entry->ordinary_minutes,
                $entry->overtime_minutes,
                $entry->night_minutes,
                $entry->absence_minutes,
                $entry->variance_minutes,
                $entry->status,
                $approvedAdjustmentMinutes,
                $adjustmentsDetail,
                $entry->submitted_at?->format('Y-m-d H:i'),
                $entry->approved_at?->format('Y-m-d H:i'),
                $entry->locked_at?->format('Y-m-d H:i'),
            ],
            default => [
                $entry->id,
                $entry->work_date?->format('Y-m-d'),
                $entry->facility?->name,
                $staffName,
                $entry->staffMember?->employee_code,
                $entry->shiftAssignment?->shiftTemplate?->name,
                $entry->planned_minutes,
                $entry->worked_minutes,
                $entry->break_minutes,
                $entry->ordinary_minutes,
                $entry->overtime_minutes,
                $entry->night_minutes,
                $entry->absence_minutes,
                $entry->variance_minutes,
                $entry->status,
                $approvedAdjustmentMinutes,
                $approvedAdjustments->count(),
                $pendingAdjustments->count(),
            ],
        };
    }
}
