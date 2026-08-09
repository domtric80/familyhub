<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaffTimesheetAdjustment;
use App\Models\StaffTimesheetEntry;
use App\Services\AuditLogService;
use App\Services\StaffTimesheetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            'status' => StaffTimesheetAdjustment::STATUS_APPROVED,
            'created_by_user_id' => $request->user()?->id,
            'reviewed_by_user_id' => $request->user()?->id,
            'reviewed_at' => now(),
            'review_notes' => 'Rettifica approvata contestualmente alla creazione.',
        ]);

        $lifecycle = [
            'status' => $timesheetEntry->status,
            'submitted_at' => $timesheetEntry->submitted_at,
            'submitted_by_user_id' => $timesheetEntry->submitted_by_user_id,
            'approved_at' => $timesheetEntry->approved_at,
            'approved_by_user_id' => $timesheetEntry->approved_by_user_id,
            'locked_at' => $timesheetEntry->locked_at,
        ];

        $recomputed = $this->timesheetService->recomputeForWorkDate(
            $timesheetEntry->facility_id,
            $timesheetEntry->staff_member_id,
            $timesheetEntry->work_date->toDateString(),
            $timesheetEntry->shift_assignment_id,
        );

        if (! in_array($lifecycle['status'], [
            StaffTimesheetEntry::STATUS_DRAFT,
            StaffTimesheetEntry::STATUS_COMPUTED,
        ], true)) {
            $recomputed->forceFill($lifecycle)->save();
        }

        $recomputed->refresh()->load($this->timesheetService->baseRelations());

        $this->auditLogService->record($request, [
            'facility_id' => $timesheetEntry->facility_id,
            'action' => 'create',
            'resource_type' => 'staff_timesheet_adjustment',
            'resource_id' => (string) $adjustment->id,
            'resource_label' => sprintf('Rettifica timesheet %s', $timesheetEntry->work_date->format('Y-m-d')),
            'operation_summary' => sprintf(
                '%s ha creato una rettifica timesheet %s (%+d minuti) per il %s.',
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
                'worked_minutes' => $recomputed->worked_minutes,
                'ordinary_minutes' => $recomputed->ordinary_minutes,
                'overtime_minutes' => $recomputed->overtime_minutes,
                'absence_minutes' => $recomputed->absence_minutes,
                'variance_minutes' => $recomputed->variance_minutes,
                'status' => $recomputed->status,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($recomputed->load($this->timesheetService->baseRelations()), 201);
    }

    public function reject(Request $request, StaffTimesheetEntry $timesheetEntry): JsonResponse
    {
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
        ]);

        $dateFrom = sprintf('%04d-%02d-01', $validated['year'], $validated['month']);
        $dateTo = date('Y-m-t', strtotime($dateFrom));

        $entries = StaffTimesheetEntry::query()
            ->with([
                'facility:id,name',
                'staffMember:id,first_name,last_name,employee_code',
                'shiftAssignment.shiftTemplate:id,name,code',
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

        $filename = sprintf('timesheet_%d_%04d_%02d.csv', $validated['facility_id'], $validated['year'], $validated['month']);

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
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->streamDownload(function () use ($entries): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, [
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
            ], ';');

            foreach ($entries as $entry) {
                fputcsv($handle, [
                    $entry->id,
                    $entry->work_date?->format('Y-m-d'),
                    $entry->facility?->name,
                    trim(($entry->staffMember?->first_name ?? '') . ' ' . ($entry->staffMember?->last_name ?? '')),
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
                ], ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
