<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exits\StoreMinorExitRequest;
use App\Http\Requests\Exits\TransitionMinorExitRequest;
use App\Http\Requests\Exits\UpdateMinorExitRequest;
use App\Models\Minor;
use App\Models\MinorExit;
use App\Models\MinorExitAccompanier;
use App\Models\StaffMember;
use App\Services\AuditLogService;
use App\Services\MinorAccessService;
use App\Services\MinorHistoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MinorExitController extends Controller
{
    public function __construct(
        private readonly MinorHistoryService $minorHistoryService,
        private readonly AuditLogService $auditLogService = new AuditLogService(),
        private readonly MinorAccessService $minorAccessService = new MinorAccessService(),
    )
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = MinorExit::query()
            ->with([
                'facility.organization',
                'minor.minorStatus',
                'exitType',
                'authorizedBy:id,first_name,last_name,email',
                'createdBy:id,first_name,last_name,email',
                'updatedBy:id,first_name,last_name,email',
            ])
            ->orderByDesc('planned_exit_at')
            ->orderByDesc('id');

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('minor_id')) {
            $query->where('minor_id', $request->integer('minor_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }

        if ($request->filled('exit_type_id')) {
            $query->where('exit_type_id', $request->integer('exit_type_id'));
        }

        if ($request->filled('follow_up_required')) {
            $query->where('follow_up_required', $request->boolean('follow_up_required'));
        }

        if ($request->filled('return_condition')) {
            $query->where('return_condition', (string) $request->input('return_condition'));
        }

        if ($request->user()) {
            $query->whereHas('minor', fn ($minorQuery) => $this->minorAccessService->scopeVisibleMinorsForUser($minorQuery, $request->user()));
        }

        return response()->json($query->get());
    }

    public function summary(Request $request): JsonResponse
    {
        $query = MinorExit::query();

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('minor_id')) {
            $query->where('minor_id', $request->integer('minor_id'));
        }

        if ($request->user()) {
            $query->whereHas('minor', fn ($minorQuery) => $this->minorAccessService->scopeVisibleMinorsForUser($minorQuery, $request->user()));
        }

        $items = $query->get([
            'id',
            'status',
            'expected_return_at',
            'actual_return_at',
            'follow_up_required',
            'return_condition',
        ]);

        return response()->json([
            'summary' => [
                'total' => $items->count(),
                'planned' => $items->where('status', MinorExit::STATUS_PLANNED)->count(),
                'out' => $items->where('status', MinorExit::STATUS_OUT)->count(),
                'returned' => $items->where('status', MinorExit::STATUS_RETURNED)->count(),
                'cancelled' => $items->where('status', MinorExit::STATUS_CANCELLED)->count(),
                'overdue_open' => $items->filter(fn (MinorExit $exit) => $exit->is_overdue)->count(),
                'follow_up_required' => $items->where('follow_up_required', true)->count(),
                'delayed_returns' => $items->where('return_condition', 'delayed')->count(),
                'critical_returns' => $items->where('return_condition', 'critical')->count(),
            ],
        ]);
    }

    public function accompanierOptions(Request $request): JsonResponse
    {
        $minor = Minor::query()
            ->with(['contacts.contactType', 'facility.organization'])
            ->findOrFail($request->integer('minor_id'));

        abort_unless(
            $this->minorAccessService->canAccessMinor($request->user(), $minor, 'minor_exits.read'),
            403,
            'Accesso alle opzioni accompagnatori non consentito per questo minore.'
        );

        $staffMembers = StaffMember::query()
            ->where('facility_id', $minor->facility_id)
            ->where(function ($query): void {
                $query->whereNull('status')
                    ->orWhere('status', 'active');
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get([
                'id',
                'facility_id',
                'user_id',
                'employee_code',
                'first_name',
                'last_name',
                'qualification',
                'status',
            ]);

        return response()->json([
            'minor' => [
                'id' => $minor->id,
                'internal_code' => $minor->internal_code,
                'first_name' => $minor->first_name,
                'last_name' => $minor->last_name,
                'facility_id' => $minor->facility_id,
            ],
            'facility' => $minor->facility
                ? [
                    'id' => $minor->facility->id,
                    'code' => $minor->facility->code,
                    'name' => $minor->facility->name,
                ]
                : null,
            'staff_members' => $staffMembers,
            'minor_contacts' => $minor->contacts->map(fn ($contact) => [
                'id' => $contact->id,
                'first_name' => $contact->first_name,
                'last_name' => $contact->last_name,
                'contact_type' => $contact->contactType
                    ? [
                        'id' => $contact->contactType->id,
                        'code' => $contact->contactType->code,
                        'name' => $contact->contactType->name,
                    ]
                    : null,
                'phone' => $contact->phone,
                'email' => $contact->email,
                'notes' => $contact->notes,
            ])->values(),
        ]);
    }

    public function store(StoreMinorExitRequest $request): JsonResponse
    {
        $minor = Minor::query()->findOrFail($request->integer('minor_id'));
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $minor, 'minor_exits.create'), 403, 'Creazione uscita non consentita per questo minore.');

        $exit = DB::transaction(function () use ($request, $minor) {
            $validated = $request->validated();
            $accompaniers = $validated['accompaniers'] ?? [];
            unset($validated['accompaniers']);

            $exit = MinorExit::query()->create([
                ...$validated,
                'facility_id' => $minor->facility_id,
                'status' => MinorExit::STATUS_PLANNED,
                'accompanied_by' => $this->buildLegacyAccompaniedBy($accompaniers, $validated['accompanied_by'] ?? null),
                'created_by_user_id' => $request->user()?->id,
                'updated_by_user_id' => $request->user()?->id,
            ]);

            $this->syncAccompaniers($exit, $accompaniers);

            return $exit;
        });

        $accompanierPayload = $this->buildAccompaniersAuditPayload($exit);
        $accompanierSummary = $this->buildAccompaniersSummaryText($accompanierPayload);

        $this->minorHistoryService->record($minor, 'minor_exit_created', $request->user(), [
            'minor_exit_id' => $exit->id,
            'status' => $exit->status,
            'destination' => $exit->destination,
            'accompaniers' => $accompanierPayload,
            'operation_summary' => sprintf(
                '%s ha creato un\'uscita per %s %s verso %s. Accompagnatori: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $minor->first_name,
                $minor->last_name,
                $exit->destination,
                $accompanierSummary
            ),
        ]);

        $this->auditLogService->record($request, [
            'facility_id' => $minor->facility_id,
            'minor_id' => $minor->id,
            'action' => 'create',
            'resource_type' => 'minor_exit',
            'resource_id' => (string) $exit->id,
            'resource_label' => $exit->destination,
            'operation_summary' => sprintf(
                '%s ha creato l\'uscita #%d del minore %s %s verso %s. Accompagnatori: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $exit->id,
                $minor->first_name,
                $minor->last_name,
                $exit->destination,
                $accompanierSummary
            ),
            'new_values_json' => [
                'minor_exit_id' => $exit->id,
                'destination' => $exit->destination,
                'status' => $exit->status,
                'return_condition' => $exit->return_condition,
                'follow_up_required' => $exit->follow_up_required,
                'accompaniers' => $accompanierPayload,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->loadExit($exit), 201);
    }

    public function show(MinorExit $exit): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor(request()->user(), $exit->minor, 'minor_exits.read'), 403, 'Accesso uscita non consentito.');

        return response()->json($this->loadExit($exit));
    }

    public function update(UpdateMinorExitRequest $request, MinorExit $exit): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $exit->minor, 'minor_exits.update'), 403, 'Aggiornamento uscita non consentito.');

        $beforePayload = $this->buildAccompaniersAuditPayload($this->loadExit($exit));

        $exit = DB::transaction(function () use ($request, $exit) {
            $validated = $request->validated();
            $accompaniers = $validated['accompaniers'] ?? null;
            unset($validated['accompaniers']);

            $exit->update([
                ...$validated,
                'accompanied_by' => $this->buildLegacyAccompaniedBy($accompaniers, $validated['accompanied_by'] ?? $exit->accompanied_by),
                'updated_by_user_id' => $request->user()?->id,
            ]);

            if (is_array($accompaniers)) {
                $this->syncAccompaniers($exit, $accompaniers);
            }

            return $exit->fresh();
        });

        $exit = $this->loadExit($exit);
        $afterPayload = $this->buildAccompaniersAuditPayload($exit);
        $beforeSummary = $this->buildAccompaniersSummaryText($beforePayload);
        $afterSummary = $this->buildAccompaniersSummaryText($afterPayload);

        $this->minorHistoryService->record($exit->minor, 'minor_exit_updated', $request->user(), [
            'minor_exit_id' => $exit->id,
            'status' => $exit->status,
            'accompaniers_before' => $beforePayload,
            'accompaniers_after' => $afterPayload,
            'operation_summary' => sprintf(
                '%s ha aggiornato l\'uscita #%d del minore %s %s. Accompagnatori prima: %s. Accompagnatori dopo: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $exit->id,
                $exit->minor->first_name,
                $exit->minor->last_name,
                $beforeSummary,
                $afterSummary
            ),
        ]);

        $this->auditLogService->record($request, [
            'facility_id' => $exit->facility_id,
            'minor_id' => $exit->minor_id,
            'action' => 'update',
            'resource_type' => 'minor_exit',
            'resource_id' => (string) $exit->id,
            'resource_label' => $exit->destination,
            'operation_summary' => sprintf(
                '%s ha aggiornato l\'uscita #%d del minore %s %s. Accompagnatori prima: %s. Accompagnatori dopo: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $exit->id,
                $exit->minor->first_name,
                $exit->minor->last_name,
                $beforeSummary,
                $afterSummary
            ),
            'old_values_json' => [
                'accompaniers' => $beforePayload,
            ],
            'new_values_json' => [
                'accompaniers' => $afterPayload,
                'status' => $exit->status,
                'return_condition' => $exit->return_condition,
                'follow_up_required' => $exit->follow_up_required,
                'destination' => $exit->destination,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->loadExit($exit));
    }

    public function markOut(TransitionMinorExitRequest $request, MinorExit $exit): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $exit->minor, 'minor_exits.update'), 403, 'Transizione uscita non consentita.');

        $exit->update([
            'status' => MinorExit::STATUS_OUT,
            'actual_exit_at' => $request->input('actual_exit_at') ?: now(),
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $this->minorHistoryService->record($exit->minor, 'minor_exit_marked_out', $request->user(), [
            'minor_exit_id' => $exit->id,
            'actual_exit_at' => optional($exit->actual_exit_at)->toIso8601String(),
        ]);

        $this->auditLogService->record($request, [
            'facility_id' => $exit->facility_id,
            'minor_id' => $exit->minor_id,
            'action' => 'update',
            'resource_type' => 'minor_exit',
            'resource_id' => (string) $exit->id,
            'resource_label' => $exit->destination,
            'operation_summary' => sprintf(
                '%s ha registrato l\'uscita #%d del minore %s %s come partita alle %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $exit->id,
                $exit->minor->first_name,
                $exit->minor->last_name,
                optional($exit->actual_exit_at)?->format('d/m/Y H:i')
            ),
            'new_values_json' => [
                'status' => $exit->status,
                'actual_exit_at' => optional($exit->actual_exit_at)->toIso8601String(),
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->loadExit($exit));
    }

    public function markReturned(TransitionMinorExitRequest $request, MinorExit $exit): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $exit->minor, 'minor_exits.update'), 403, 'Transizione uscita non consentita.');

        $actualReturnAt = $request->input('actual_return_at') ?: now();

        $exit->update([
            'status' => MinorExit::STATUS_RETURNED,
            'actual_return_at' => $actualReturnAt,
            'return_condition' => $request->input('return_condition', $exit->return_condition),
            'follow_up_required' => $request->boolean('follow_up_required', $exit->follow_up_required),
            'follow_up_notes' => $request->input('follow_up_notes', $exit->follow_up_notes),
            'outcome_notes' => $request->input('outcome_notes', $exit->outcome_notes),
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $this->minorHistoryService->record($exit->minor, 'minor_exit_returned', $request->user(), [
            'minor_exit_id' => $exit->id,
            'actual_return_at' => optional($exit->actual_return_at)->toIso8601String(),
        ]);

        $this->auditLogService->record($request, [
            'facility_id' => $exit->facility_id,
            'minor_id' => $exit->minor_id,
            'action' => 'update',
            'resource_type' => 'minor_exit',
            'resource_id' => (string) $exit->id,
            'resource_label' => $exit->destination,
            'operation_summary' => sprintf(
                '%s ha registrato il rientro dell\'uscita #%d del minore %s %s. Esito rientro: %s. Follow-up: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $exit->id,
                $exit->minor->first_name,
                $exit->minor->last_name,
                $exit->return_condition ?: 'non indicato',
                $exit->follow_up_required ? 'richiesto' : 'non richiesto'
            ),
            'new_values_json' => [
                'status' => $exit->status,
                'actual_return_at' => optional($exit->actual_return_at)->toIso8601String(),
                'return_condition' => $exit->return_condition,
                'follow_up_required' => $exit->follow_up_required,
                'follow_up_notes' => $exit->follow_up_notes,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->loadExit($exit));
    }

    public function cancel(TransitionMinorExitRequest $request, MinorExit $exit): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $exit->minor, 'minor_exits.update'), 403, 'Cancellazione uscita non consentita.');

        $exit->update([
            'status' => MinorExit::STATUS_CANCELLED,
            'cancellation_reason' => $request->input('cancellation_reason'),
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $this->minorHistoryService->record($exit->minor, 'minor_exit_cancelled', $request->user(), [
            'minor_exit_id' => $exit->id,
            'reason' => $exit->cancellation_reason,
        ]);

        $this->auditLogService->record($request, [
            'facility_id' => $exit->facility_id,
            'minor_id' => $exit->minor_id,
            'action' => 'update',
            'resource_type' => 'minor_exit',
            'resource_id' => (string) $exit->id,
            'resource_label' => $exit->destination,
            'operation_summary' => sprintf(
                '%s ha annullato l\'uscita #%d del minore %s %s. Motivo: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $exit->id,
                $exit->minor->first_name,
                $exit->minor->last_name,
                $exit->cancellation_reason ?: 'non indicato'
            ),
            'new_values_json' => [
                'status' => $exit->status,
                'cancellation_reason' => $exit->cancellation_reason,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->loadExit($exit));
    }

    public function destroy(MinorExit $exit): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor(request()->user(), $exit->minor, 'minor_exits.delete'), 403, 'Eliminazione uscita non consentita.');

        $minor = $exit->minor;
        $exitId = $exit->id;
        $exit->delete();

        if ($minor) {
            $this->minorHistoryService->record($minor, 'minor_exit_deleted', request()->user(), [
                'minor_exit_id' => $exitId,
            ]);
        }

        return response()->json(status: 204);
    }

    private function loadExit(MinorExit $exit): MinorExit
    {
        return $exit->load([
            'facility.organization',
            'minor.minorStatus',
            'exitType',
            'accompaniers.staffMember',
            'accompaniers.minorContact.contactType',
            'authorizedBy:id,first_name,last_name,email',
            'createdBy:id,first_name,last_name,email',
            'updatedBy:id,first_name,last_name,email',
        ]);
    }

    private function buildAccompaniersAuditPayload(MinorExit $exit): array
    {
        $loadedExit = $exit->relationLoaded('accompaniers') ? $exit : $this->loadExit($exit);

        return $loadedExit->accompaniers
            ->map(fn (MinorExitAccompanier $accompanier) => [
                'person_type' => $accompanier->person_type,
                'display_name' => $accompanier->displayName(),
                'staff_member_id' => $accompanier->staff_member_id,
                'minor_contact_id' => $accompanier->minor_contact_id,
                'external_name' => $accompanier->external_name,
                'notes' => $accompanier->notes,
            ])
            ->values()
            ->all();
    }

    private function buildAccompaniersSummaryText(array $accompaniers): string
    {
        if ($accompaniers === []) {
            return 'nessuno';
        }

        return collect($accompaniers)
            ->map(function (array $accompanier): string {
                $label = $accompanier['display_name'] ?: 'senza nome';
                $type = match ($accompanier['person_type']) {
                    MinorExitAccompanier::TYPE_STAFF_MEMBER => 'staff',
                    MinorExitAccompanier::TYPE_MINOR_CONTACT => 'contatto minore',
                    MinorExitAccompanier::TYPE_EXTERNAL => 'esterno',
                    default => 'sconosciuto',
                };

                return sprintf('%s [%s]', $label, $type);
            })
            ->implode(', ');
    }

    private function syncAccompaniers(MinorExit $exit, array $accompaniers): void
    {
        $exit->accompaniers()->delete();

        foreach ($accompaniers as $accompanier) {
            $exit->accompaniers()->create([
                'person_type' => data_get($accompanier, 'person_type'),
                'staff_member_id' => data_get($accompanier, 'staff_member_id'),
                'minor_contact_id' => data_get($accompanier, 'minor_contact_id'),
                'external_name' => data_get($accompanier, 'external_name'),
                'notes' => data_get($accompanier, 'notes'),
            ]);
        }
    }

    private function buildLegacyAccompaniedBy(?array $accompaniers, ?string $fallback): ?string
    {
        if (! is_array($accompaniers) || $accompaniers === []) {
            return $fallback;
        }

        $items = collect($accompaniers)
            ->map(function (array $accompanier): ?string {
                return match (data_get($accompanier, 'person_type')) {
                    MinorExitAccompanier::TYPE_STAFF_MEMBER => $this->resolveStaffMemberName((int) data_get($accompanier, 'staff_member_id')),
                    MinorExitAccompanier::TYPE_MINOR_CONTACT => $this->resolveMinorContactName((int) data_get($accompanier, 'minor_contact_id')),
                    MinorExitAccompanier::TYPE_EXTERNAL => trim((string) data_get($accompanier, 'external_name', '')) ?: null,
                    default => null,
                };
            })
            ->filter()
            ->values();

        return $items->isNotEmpty() ? $items->implode(', ') : $fallback;
    }

    private function resolveStaffMemberName(int $staffMemberId): ?string
    {
        if ($staffMemberId <= 0) {
            return null;
        }

        $staffMember = \App\Models\StaffMember::query()->find($staffMemberId);

        return $staffMember
            ? trim(sprintf('%s %s', $staffMember->first_name, $staffMember->last_name))
            : null;
    }

    private function resolveMinorContactName(int $minorContactId): ?string
    {
        if ($minorContactId <= 0) {
            return null;
        }

        $minorContact = \App\Models\MinorContact::query()->find($minorContactId);

        return $minorContact
            ? trim(sprintf('%s %s', $minorContact->first_name, $minorContact->last_name))
            : null;
    }
}
