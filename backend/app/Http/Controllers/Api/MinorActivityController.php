<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Activities\StoreMinorActivityRequest;
use App\Http\Requests\Activities\UpdateMinorActivityRequest;
use App\Models\Minor;
use App\Models\MinorActivity;
use App\Services\AuditLogService;
use App\Services\MinorAccessService;
use App\Services\MinorHistoryService;
use App\Services\MinorPeiHistoryService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MinorActivityController extends Controller
{
    public function __construct(
        private readonly MinorHistoryService $minorHistoryService,
        private readonly MinorPeiHistoryService $minorPeiHistoryService = new MinorPeiHistoryService(),
        private readonly AuditLogService $auditLogService = new AuditLogService(),
        private readonly MinorAccessService $minorAccessService = new MinorAccessService(),
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = MinorActivity::query()
            ->with($this->baseRelations())
            ->orderByDesc('planned_start_at')
            ->orderByDesc('id');

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('minor_id')) {
            $query->where('minor_id', $request->integer('minor_id'));
        }

        if ($request->filled('activity_type_id')) {
            $query->where('activity_type_id', $request->integer('activity_type_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }

        if ($request->filled('attendance_status')) {
            $query->where('attendance_status', (string) $request->input('attendance_status'));
        }

        if ($request->filled('support_level')) {
            $query->where('support_level', (string) $request->input('support_level'));
        }

        if ($request->has('follow_up_required')) {
            $query->where('follow_up_required', $request->boolean('follow_up_required'));
        }

        if ($request->filled('pei_objective_id')) {
            $query->where('pei_objective_id', $request->integer('pei_objective_id'));
        }

        if ($request->user()) {
            $query->whereHas('minor', fn (Builder $minorQuery) => $this->minorAccessService->scopeVisibleMinorsForUser($minorQuery, $request->user()));
        }

        return response()->json($query->get());
    }

    public function summary(Request $request): JsonResponse
    {
        $query = MinorActivity::query();

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('minor_id')) {
            $query->where('minor_id', $request->integer('minor_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('planned_start_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('planned_start_at', '<=', $request->date('date_to'));
        }

        if ($request->user()) {
            $query->whereHas('minor', fn (Builder $minorQuery) => $this->minorAccessService->scopeVisibleMinorsForUser($minorQuery, $request->user()));
        }

        $items = $query->get();

        return response()->json([
            'summary' => [
                'total' => $items->count(),
                'planned' => $items->where('status', MinorActivity::STATUS_PLANNED)->count(),
                'in_progress' => $items->where('status', MinorActivity::STATUS_IN_PROGRESS)->count(),
                'completed' => $items->where('status', MinorActivity::STATUS_COMPLETED)->count(),
                'cancelled' => $items->where('status', MinorActivity::STATUS_CANCELLED)->count(),
                'follow_up_required' => $items->where('follow_up_required', true)->count(),
                'transport_required' => $items->where('requires_transport', true)->count(),
                'pei_linked' => $items->whereNotNull('pei_objective_id')->count(),
            ],
            'attendance_breakdown' => $items
                ->groupBy('attendance_status')
                ->filter(fn ($group, $status) => filled($status))
                ->map(fn ($group, $status): array => [
                    'attendance_status' => $status,
                    'total' => $group->count(),
                ])
                ->values(),
        ]);
    }

    public function store(StoreMinorActivityRequest $request): JsonResponse
    {
        $minor = Minor::query()->findOrFail($request->integer('minor_id'));
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $minor, 'minor_activities.create'), 403, 'Creazione attività non consentita per questo minore.');

        $activity = MinorActivity::query()->create([
            ...$request->validated(),
            'facility_id' => $minor->facility_id,
            'status' => $request->input('status', MinorActivity::STATUS_PLANNED),
            'attendance_status' => $request->input('attendance_status', 'present'),
            'requires_transport' => $request->boolean('requires_transport', false),
            'follow_up_required' => $request->boolean('follow_up_required', false),
            'created_by_user_id' => $request->user()?->id,
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $loaded = $this->loadActivity($activity);

        $this->minorHistoryService->record($minor, 'minor_activity_created', $request->user(), [
            'minor_activity_id' => $loaded->id,
            'title' => $loaded->title,
            'status' => $loaded->status,
            'pei_objective_id' => $loaded->pei_objective_id,
        ]);

        if ($loaded->peiObjective) {
            $this->minorPeiHistoryService->recordObjectiveProgress(
                $loaded->peiObjective,
                $request->user(),
                sprintf('Attività collegata: %s [%s].', $loaded->title, $loaded->status),
                'minor_activity',
                (string) $loaded->id,
                $loaded->title,
            );
        }

        $this->auditLogService->record($request, [
            'facility_id' => $minor->facility_id,
            'minor_id' => $minor->id,
            'action' => 'create',
            'resource_type' => 'minor_activity',
            'resource_id' => (string) $loaded->id,
            'resource_label' => $loaded->title,
            'operation_summary' => sprintf(
                '%s ha creato l\'attività #%d del minore %s %s: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $loaded->id,
                $minor->first_name,
                $minor->last_name,
                $loaded->title
            ),
            'new_values_json' => [
                'status' => $loaded->status,
                'attendance_status' => $loaded->attendance_status,
                'support_level' => $loaded->support_level,
                'follow_up_required' => $loaded->follow_up_required,
                'pei_objective_id' => $loaded->pei_objective_id,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($loaded, 201);
    }

    public function show(MinorActivity $activity): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor(request()->user(), $activity->minor, 'minor_activities.read'), 403, 'Accesso attività non consentito.');

        return response()->json($this->loadActivity($activity));
    }

    public function update(UpdateMinorActivityRequest $request, MinorActivity $activity): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $activity->minor, 'minor_activities.update'), 403, 'Aggiornamento attività non consentito.');

        $minor = Minor::query()->findOrFail($request->integer('minor_id'));
        $before = $this->loadActivity($activity);

        $activity->update([
            ...$request->validated(),
            'facility_id' => $minor->facility_id,
            'attendance_status' => $request->input('attendance_status', $activity->attendance_status ?: 'present'),
            'requires_transport' => $request->boolean('requires_transport', false),
            'follow_up_required' => $request->boolean('follow_up_required', false),
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $loaded = $this->loadActivity($activity->fresh());

        $this->minorHistoryService->record($loaded->minor, 'minor_activity_updated', $request->user(), [
            'minor_activity_id' => $loaded->id,
            'status' => $loaded->status,
            'pei_objective_id' => $loaded->pei_objective_id,
        ]);

        if ($loaded->peiObjective) {
            $this->minorPeiHistoryService->recordObjectiveProgress(
                $loaded->peiObjective,
                $request->user(),
                sprintf('Attività aggiornata: %s [%s].', $loaded->title, $loaded->status),
                'minor_activity',
                (string) $loaded->id,
                $loaded->title,
            );
        }

        $this->auditLogService->record($request, [
            'facility_id' => $loaded->facility_id,
            'minor_id' => $loaded->minor_id,
            'action' => 'update',
            'resource_type' => 'minor_activity',
            'resource_id' => (string) $loaded->id,
            'resource_label' => $loaded->title,
            'operation_summary' => sprintf(
                '%s ha aggiornato l\'attività #%d del minore %s %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $loaded->id,
                $loaded->minor->first_name,
                $loaded->minor->last_name
            ),
            'old_values_json' => [
                'status' => $before->status,
                'attendance_status' => $before->attendance_status,
                'support_level' => $before->support_level,
                'follow_up_required' => $before->follow_up_required,
                'pei_objective_id' => $before->pei_objective_id,
            ],
            'new_values_json' => [
                'status' => $loaded->status,
                'attendance_status' => $loaded->attendance_status,
                'support_level' => $loaded->support_level,
                'follow_up_required' => $loaded->follow_up_required,
                'pei_objective_id' => $loaded->pei_objective_id,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($loaded);
    }

    public function destroy(MinorActivity $activity): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor(request()->user(), $activity->minor, 'minor_activities.delete'), 403, 'Eliminazione attività non consentita.');

        $minor = $activity->minor;
        $activityId = $activity->id;
        $activity->delete();

        if ($minor) {
            $this->minorHistoryService->record($minor, 'minor_activity_deleted', request()->user(), [
                'minor_activity_id' => $activityId,
            ]);
        }

        return response()->json(status: 204);
    }

    private function loadActivity(MinorActivity $activity): MinorActivity
    {
        return $activity->load($this->baseRelations());
    }

    private function baseRelations(): array
    {
        return [
            'facility.organization',
            'minor.minorStatus',
            'activityType',
            'responsibleStaffMember',
            'peiObjective.pei',
            'createdBy:id,first_name,last_name,email',
            'updatedBy:id,first_name,last_name,email',
        ];
    }
}
