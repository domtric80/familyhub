<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shifts\ShiftAssignmentWindow;
use App\Http\Requests\Shifts\StoreStaffShiftAssignmentRequest;
use App\Models\StaffMember;
use App\Models\StaffShiftAssignment;
use App\Models\StaffShiftTemplate;
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

        return response()->json($query->get());
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

        $days = collect(range(0, 6))->map(function (int $offset) use ($weekStart, $templates, $assignments): array {
            $day = $weekStart->copy()->addDays($offset)->toDateString();

            return [
                'date' => $day,
                'shifts' => $templates->map(function (StaffShiftTemplate $template) use ($assignments, $day): array {
                    $shiftAssignments = $this->assignmentsForDayAndTemplate($assignments, $day, $template->id);

                    return [
                        'shift_template' => $template,
                        'minimum_staff_required' => $template->minimum_staff_required,
                        'assigned_count' => $shiftAssignments->count(),
                        'coverage_gap' => max(0, $template->minimum_staff_required - $shiftAssignments->count()),
                        'assignments' => $shiftAssignments,
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

        return response()->json($this->loadAssignment($assignment), 201);
    }

    public function show(StaffShiftAssignment $shiftAssignment): JsonResponse
    {
        return response()->json($this->loadAssignment($shiftAssignment));
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

        return response()->json($this->loadAssignment($shiftAssignment->fresh()));
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

        return response()->json([
            'staff_member' => $staffMember->load('facility.organization', 'user'),
            'week_start' => $weekStart->toDateString(),
            'week_end' => $weekEnd->toDateString(),
            'assignments' => $assignments,
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
}
