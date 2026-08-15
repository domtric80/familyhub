<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Approaches\RenewMinorApproachAuthorizationRequest;
use App\Http\Requests\Approaches\SignMinorApproachSuspensionRequest;
use App\Http\Requests\Approaches\StoreMinorApproachRequest;
use App\Http\Requests\Approaches\UpdateMinorApproachRequest;
use App\Models\ContactType;
use App\Models\Minor;
use App\Models\MinorApproach;
use App\Models\StaffMember;
use App\Models\StaffQualification;
use App\Services\AuditLogService;
use App\Services\MinorAccessService;
use App\Services\MinorHistoryService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MinorApproachController extends Controller
{
    public function __construct(
        private readonly MinorHistoryService $minorHistoryService,
        private readonly AuditLogService $auditLogService = new AuditLogService(),
        private readonly MinorAccessService $minorAccessService = new MinorAccessService(),
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = MinorApproach::query()
            ->with($this->baseRelations())
            ->orderByDesc('planned_start_at')
            ->orderByDesc('id');

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('minor_id')) {
            $query->where('minor_id', $request->integer('minor_id'));
        }

        if ($request->filled('approach_type_id')) {
            $query->where('approach_type_id', $request->integer('approach_type_id'));
        }

        if ($request->filled('minor_contact_id')) {
            $contactId = $request->integer('minor_contact_id');
            $query->where(function (Builder $innerQuery) use ($contactId): void {
                $innerQuery
                    ->where('minor_contact_id', $contactId)
                    ->orWhereHas('minorContacts', fn (Builder $contactQuery) => $contactQuery->whereKey($contactId));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }

        if ($request->user()) {
            $query->whereHas('minor', fn (Builder $minorQuery) => $this->minorAccessService->scopeVisibleMinorsForUser($minorQuery, $request->user()));
        }

        $items = $query->get();

        if ($request->filled('authorization_status')) {
            $authorizationStatus = (string) $request->input('authorization_status');
            $items = $items->filter(fn (MinorApproach $approach): bool => $this->resolveAuthorizationStatus($approach) === $authorizationStatus)->values();
        }

        return response()->json(
            $items->map(fn (MinorApproach $approach) => $this->serializeApproach($approach, $request))
        );
    }

    public function trend(Request $request): JsonResponse
    {
        $query = MinorApproach::query()
            ->with(['approachType:id,code,name', 'minor:id,first_name,last_name']);

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
        $reactionScores = config('approaches.reaction_levels', []);
        $today = now()->startOfDay();

        return response()->json([
            'summary' => [
                'total' => $items->count(),
                'planned' => $items->where('status', MinorApproach::STATUS_PLANNED)->count(),
                'in_progress' => $items->where('status', MinorApproach::STATUS_IN_PROGRESS)->count(),
                'completed' => $items->where('status', MinorApproach::STATUS_COMPLETED)->count(),
                'suspended' => $items->where('status', MinorApproach::STATUS_SUSPENDED)->count(),
                'cancelled' => $items->where('status', MinorApproach::STATUS_CANCELLED)->count(),
                'authorization_expiring' => $items->filter(function (MinorApproach $approach) use ($today): bool {
                    if (! $approach->authorization_expires_at) {
                        return false;
                    }

                    $threshold = $approach->authorization_expires_at->copy()->subDays((int) ($approach->authorization_renewal_alert_days ?: config('approaches.default_authorization_renewal_alert_days', 30)));

                    return $approach->authorization_expires_at->gte($today) && $today->gte($threshold);
                })->count(),
                'authorization_expired' => $items->filter(fn (MinorApproach $approach): bool => $approach->authorization_expires_at?->lt($today) ?? false)->count(),
            ],
            'monthly_series' => $items
                ->groupBy(fn (MinorApproach $approach) => optional($approach->planned_start_at)?->format('Y-m'))
                ->filter(fn ($group, $month) => filled($month))
                ->map(function ($group, string $month) use ($reactionScores): array {
                    $postScores = $group
                        ->map(fn (MinorApproach $approach) => $reactionScores[$approach->post_reaction_level] ?? null)
                        ->filter(fn ($value) => $value !== null)
                        ->values();

                    return [
                        'month' => $month,
                        'total' => $group->count(),
                        'avg_post_reaction_score' => $postScores->isEmpty() ? null : round($postScores->avg(), 2),
                    ];
                })
                ->values(),
            'totals_by_approach_type' => $items
                ->groupBy(fn (MinorApproach $approach) => $approach->approachType?->code ?: 'unknown')
                ->map(function ($group, string $code): array {
                    $first = $group->first();

                    return [
                        'approach_type_code' => $code,
                        'approach_type_name' => $first?->approachType?->name,
                        'total' => $group->count(),
                    ];
                })
                ->values(),
            'upcoming_authorization_renewals' => $items
                ->filter(fn (MinorApproach $approach): bool => in_array($this->resolveAuthorizationStatus($approach), ['expiring', 'expired'], true))
                ->sortBy(fn (MinorApproach $approach) => $approach->authorization_expires_at?->timestamp ?? PHP_INT_MAX)
                ->take(10)
                ->values()
                ->map(fn (MinorApproach $approach): array => [
                    'id' => $approach->id,
                    'minor_id' => $approach->minor_id,
                    'minor_label' => trim(($approach->minor?->first_name ?? '').' '.($approach->minor?->last_name ?? '')),
                    'title' => $approach->title,
                    'authorization_reference' => $approach->authorization_reference,
                    'authorization_status' => $this->resolveAuthorizationStatus($approach),
                    'authorization_expires_at' => optional($approach->authorization_expires_at)?->toDateString(),
                    'authorization_days_until_expiry' => $this->authorizationDaysUntilExpiry($approach),
                ])
                ->all(),
            'reaction_distribution' => collect(['pre', 'during', 'post'])
                ->flatMap(function (string $phase) use ($items): array {
                    $column = "{$phase}_reaction_level";

                    return $items
                        ->groupBy($column)
                        ->filter(fn ($group, $level) => filled($level))
                        ->map(fn ($group, $level): array => [
                            'phase' => $phase,
                            'level' => $level,
                            'total' => $group->count(),
                        ])
                        ->values()
                        ->all();
                })
                ->values(),
        ]);
    }

    public function store(StoreMinorApproachRequest $request): JsonResponse
    {
        $minor = Minor::query()->with('facility')->findOrFail($request->integer('minor_id'));
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $minor, 'minor_approaches.create'), 403, 'Creazione avvicinamento non consentita per questo minore.');

        $approach = MinorApproach::query()->create([
            ...$request->validated(),
            'facility_id' => $minor->facility_id,
            'status' => $request->input('status', MinorApproach::STATUS_PLANNED),
            'authorization_renewal_alert_days' => $request->integer('authorization_renewal_alert_days') ?: (int) config('approaches.default_authorization_renewal_alert_days', 30),
            'suspended_by_user_id' => $this->resolveSuspendedByUserId($request),
            'created_by_user_id' => $request->user()?->id,
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $this->syncApproachContacts($approach, $request->input('participants', []));
        $this->syncApproachStaffParticipants($approach, $request->input('staff_participants', []));

        $loaded = $this->loadApproach($approach);

        $this->minorHistoryService->record($minor, 'minor_approach_created', $request->user(), [
            'minor_approach_id' => $loaded->id,
            'title' => $loaded->title,
            'status' => $loaded->status,
            'operation_summary' => sprintf(
                '%s ha creato un avvicinamento per il minore %s %s: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $minor->first_name,
                $minor->last_name,
                $loaded->title
            ),
        ]);

        $this->auditLogService->record($request, [
            'facility_id' => $minor->facility_id,
            'minor_id' => $minor->id,
            'action' => 'create',
            'resource_type' => 'minor_approach',
            'resource_id' => (string) $loaded->id,
            'resource_label' => $loaded->title,
            'operation_summary' => sprintf(
                '%s ha creato l\'avvicinamento #%d del minore %s %s: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $loaded->id,
                $minor->first_name,
                $minor->last_name,
                $loaded->title
            ),
            'new_values_json' => [
                'status' => $loaded->status,
                'approach_type_id' => $loaded->approach_type_id,
                'minor_contact_id' => $loaded->minor_contact_id,
                'minor_contact_ids' => $loaded->minorContacts->pluck('id')->values()->all(),
                'supervising_staff_member_id' => $loaded->supervising_staff_member_id,
                'staff_participants' => $loaded->staffParticipants->map(fn ($item) => [
                    'staff_member_id' => $item->staff_member_id,
                    'qualification_code' => $item->qualification_code,
                ])->values()->all(),
                'authorization_reference' => $loaded->authorization_reference,
                'authorization_minor_document_id' => $loaded->authorization_minor_document_id,
                'authorization_expires_at' => optional($loaded->authorization_expires_at)?->toDateString(),
                'post_reaction_level' => $loaded->post_reaction_level,
                'has_reserved_notes' => $this->hasReservedNotes($loaded),
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->serializeApproach($loaded, $request), 201);
    }

    public function show(MinorApproach $approach): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor(request()->user(), $approach->minor, 'minor_approaches.read'), 403, 'Accesso avvicinamento non consentito.');

        $loaded = $this->loadApproach($approach);
        $this->auditReservedNotesRead(request(), $loaded);

        return response()->json($this->serializeApproach($loaded, request()));
    }

    public function update(UpdateMinorApproachRequest $request, MinorApproach $approach): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $approach->minor, 'minor_approaches.update'), 403, 'Aggiornamento avvicinamento non consentito.');

        $before = $this->loadApproach($approach);

        $approach->update([
            ...$request->validated(),
            'authorization_renewal_alert_days' => $request->has('authorization_renewal_alert_days')
                ? $request->integer('authorization_renewal_alert_days')
                : ($approach->authorization_renewal_alert_days ?: (int) config('approaches.default_authorization_renewal_alert_days', 30)),
            'suspended_by_user_id' => $this->resolveSuspendedByUserId($request, $approach),
            'updated_by_user_id' => $request->user()?->id,
        ]);

        if ($request->exists('participants') || $request->exists('minor_contact_ids') || $request->exists('minor_contact_id')) {
            $this->syncApproachContacts($approach, $request->input('participants', []));
        }

        if ($request->exists('staff_participants') || $request->exists('supervising_staff_member_id')) {
            $this->syncApproachStaffParticipants($approach, $request->input('staff_participants', []));
        }

        $loaded = $this->loadApproach($approach->fresh());

        $this->minorHistoryService->record($loaded->minor, 'minor_approach_updated', $request->user(), [
            'minor_approach_id' => $loaded->id,
            'status_before' => $before->status,
            'status_after' => $loaded->status,
            'operation_summary' => sprintf(
                '%s ha aggiornato l\'avvicinamento #%d del minore %s %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $loaded->id,
                $loaded->minor->first_name,
                $loaded->minor->last_name
            ),
        ]);

        $this->auditLogService->record($request, [
            'facility_id' => $loaded->facility_id,
            'minor_id' => $loaded->minor_id,
            'action' => 'update',
            'resource_type' => 'minor_approach',
            'resource_id' => (string) $loaded->id,
            'resource_label' => $loaded->title,
            'operation_summary' => sprintf(
                '%s ha aggiornato l\'avvicinamento #%d del minore %s %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $loaded->id,
                $loaded->minor->first_name,
                $loaded->minor->last_name
            ),
            'old_values_json' => [
                'status' => $before->status,
                'minor_contact_id' => $before->minor_contact_id,
                'minor_contact_ids' => $before->minorContacts->pluck('id')->values()->all(),
                'supervising_staff_member_id' => $before->supervising_staff_member_id,
                'staff_participants' => $before->staffParticipants->map(fn ($item) => [
                    'staff_member_id' => $item->staff_member_id,
                    'qualification_code' => $item->qualification_code,
                ])->values()->all(),
                'authorization_reference' => $before->authorization_reference,
                'authorization_minor_document_id' => $before->authorization_minor_document_id,
                'authorization_expires_at' => optional($before->authorization_expires_at)?->toDateString(),
                'post_reaction_level' => $before->post_reaction_level,
                'suspended_at' => optional($before->suspended_at)?->toIso8601String(),
            ],
            'new_values_json' => [
                'status' => $loaded->status,
                'minor_contact_id' => $loaded->minor_contact_id,
                'minor_contact_ids' => $loaded->minorContacts->pluck('id')->values()->all(),
                'supervising_staff_member_id' => $loaded->supervising_staff_member_id,
                'staff_participants' => $loaded->staffParticipants->map(fn ($item) => [
                    'staff_member_id' => $item->staff_member_id,
                    'qualification_code' => $item->qualification_code,
                ])->values()->all(),
                'authorization_reference' => $loaded->authorization_reference,
                'authorization_minor_document_id' => $loaded->authorization_minor_document_id,
                'authorization_expires_at' => optional($loaded->authorization_expires_at)?->toDateString(),
                'post_reaction_level' => $loaded->post_reaction_level,
                'suspended_at' => optional($loaded->suspended_at)?->toIso8601String(),
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->serializeApproach($loaded, $request));
    }


public function renewAuthorization(RenewMinorApproachAuthorizationRequest $request, MinorApproach $approach): JsonResponse
{
    abort_unless($this->minorAccessService->canAccessMinor($request->user(), $approach->minor, 'minor_approaches.update'), 403, 'Rinnovo provvedimento non consentito.');

    $before = $this->loadApproach($approach);

    $approach->update([
        'authorization_reference' => $request->input('authorization_reference'),
        'authorization_minor_document_id' => $request->input('authorization_minor_document_id'),
        'authorization_issued_at' => $request->input('authorization_issued_at'),
        'authorization_expires_at' => $request->input('authorization_expires_at'),
        'authorization_renewal_alert_days' => $request->integer('authorization_renewal_alert_days') ?: (int) config('approaches.default_authorization_renewal_alert_days', 30),
        'updated_by_user_id' => $request->user()?->id,
    ]);

    $loaded = $this->loadApproach($approach->fresh());

    $this->minorHistoryService->record($loaded->minor, 'minor_approach_authorization_renewed', $request->user(), [
        'minor_approach_id' => $loaded->id,
        'authorization_reference_before' => $before->authorization_reference,
        'authorization_reference_after' => $loaded->authorization_reference,
        'authorization_expires_at_before' => optional($before->authorization_expires_at)?->toDateString(),
        'authorization_expires_at_after' => optional($loaded->authorization_expires_at)?->toDateString(),
        'operation_summary' => sprintf(
            '%s ha rinnovato il provvedimento autorizzativo dell\'avvicinamento #%d del minore %s %s.',
            $this->auditLogService->resolveActorDisplayName($request->user()),
            $loaded->id,
            $loaded->minor->first_name,
            $loaded->minor->last_name
        ),
    ]);

    $this->auditLogService->record($request, [
        'facility_id' => $loaded->facility_id,
        'minor_id' => $loaded->minor_id,
        'action' => 'update',
        'resource_type' => 'minor_approach_authorization',
        'resource_id' => (string) $loaded->id,
        'resource_label' => $loaded->title,
        'operation_summary' => sprintf(
            '%s ha rinnovato il provvedimento autorizzativo dell\'avvicinamento #%d del minore %s %s.',
            $this->auditLogService->resolveActorDisplayName($request->user()),
            $loaded->id,
            $loaded->minor->first_name,
            $loaded->minor->last_name
        ),
        'old_values_json' => [
            'authorization_reference' => $before->authorization_reference,
            'authorization_minor_document_id' => $before->authorization_minor_document_id,
            'authorization_issued_at' => optional($before->authorization_issued_at)?->toDateString(),
            'authorization_expires_at' => optional($before->authorization_expires_at)?->toDateString(),
            'authorization_renewal_alert_days' => $before->authorization_renewal_alert_days,
        ],
        'new_values_json' => [
            'authorization_reference' => $loaded->authorization_reference,
            'authorization_minor_document_id' => $loaded->authorization_minor_document_id,
            'authorization_issued_at' => optional($loaded->authorization_issued_at)?->toDateString(),
            'authorization_expires_at' => optional($loaded->authorization_expires_at)?->toDateString(),
            'authorization_renewal_alert_days' => $loaded->authorization_renewal_alert_days,
            'authorization_status' => $this->resolveAuthorizationStatus($loaded),
        ],
    ]);
    $this->auditLogService->markHandled($request);

    return response()->json($this->serializeApproach($loaded, $request));
}

public function signSuspension(SignMinorApproachSuspensionRequest $request, MinorApproach $approach): JsonResponse
{
    abort_unless($this->minorAccessService->canAccessMinor($request->user(), $approach->minor, 'minor_approaches.update'), 403, 'Firma sospensione non consentita per questo minore.');
    abort_unless($this->canUserSignSuspension($request->user()), 403, 'Solo i ruoli responsabili possono firmare la sospensione.');

    if ((string) $approach->status !== MinorApproach::STATUS_SUSPENDED) {
        return response()->json(['message' => 'L\'avvicinamento deve essere in stato sospeso prima della firma.'], 422);
    }

    if (blank($approach->suspension_reason) && blank($request->input('suspension_reason'))) {
        return response()->json(['message' => 'La motivazione della sospensione è obbligatoria prima della firma.'], 422);
    }

    $before = $this->loadApproach($approach);

    $approach->update([
        'status' => MinorApproach::STATUS_SUSPENDED,
        'suspension_reason' => $request->input('suspension_reason', $approach->suspension_reason),
        'suspended_at' => $request->input('suspended_at', optional($approach->suspended_at)->toIso8601String() ?: now()->toIso8601String()),
        'suspended_by_user_id' => $request->user()?->id,
        'suspension_signed_at' => now(),
        'updated_by_user_id' => $request->user()?->id,
    ]);

    $loaded = $this->loadApproach($approach->fresh());

    $this->minorHistoryService->record($loaded->minor, 'minor_approach_suspension_signed', $request->user(), [
        'minor_approach_id' => $loaded->id,
        'operation_summary' => sprintf(
            '%s ha firmato la sospensione dell\'avvicinamento #%d del minore %s %s.',
            $this->auditLogService->resolveActorDisplayName($request->user()),
            $loaded->id,
            $loaded->minor->first_name,
            $loaded->minor->last_name
        ),
    ]);

    $this->auditLogService->record($request, [
        'facility_id' => $loaded->facility_id,
        'minor_id' => $loaded->minor_id,
        'action' => 'update',
        'resource_type' => 'minor_approach_suspension',
        'resource_id' => (string) $loaded->id,
        'resource_label' => $loaded->title,
        'operation_summary' => sprintf(
            '%s ha firmato la sospensione dell\'avvicinamento #%d del minore %s %s.',
            $this->auditLogService->resolveActorDisplayName($request->user()),
            $loaded->id,
            $loaded->minor->first_name,
            $loaded->minor->last_name
        ),
        'old_values_json' => [
            'status' => $before->status,
            'suspension_reason' => $before->suspension_reason,
            'suspended_at' => optional($before->suspended_at)?->toIso8601String(),
            'suspension_signed_at' => optional($before->suspension_signed_at)?->toIso8601String(),
        ],
        'new_values_json' => [
            'status' => $loaded->status,
            'suspension_reason' => $loaded->suspension_reason,
            'suspended_at' => optional($loaded->suspended_at)?->toIso8601String(),
            'suspension_signed_at' => optional($loaded->suspension_signed_at)?->toIso8601String(),
        ],
    ]);
    $this->auditLogService->markHandled($request);

    return response()->json($this->serializeApproach($loaded, $request));
}

public function destroy(MinorApproach $approach): JsonResponse
{

        abort_unless($this->minorAccessService->canAccessMinor(request()->user(), $approach->minor, 'minor_approaches.delete'), 403, 'Eliminazione avvicinamento non consentita.');

        $loaded = $this->loadApproach($approach);
        $loaded->delete();

        $this->minorHistoryService->record($loaded->minor, 'minor_approach_deleted', request()->user(), [
            'minor_approach_id' => $loaded->id,
        ]);

        return response()->json(status: 204);
    }

    private function loadApproach(MinorApproach $approach): MinorApproach
    {
        return $approach->load($this->baseRelations());
    }

    private function baseRelations(): array
    {
        return [
            'facility.organization',
            'minor.minorStatus',
            'approachType',
            'minorContact.contactType',
            'minorContacts.contactType',
            'authorizationMinorDocument.documentType',
            'authorizationMinorDocument.attachment',
            'supervisingStaffMember',
            'staffParticipants.staffMember.qualificationLookup',
            'staffParticipants.qualificationLookup',
            'suspendedBy:id,first_name,last_name,email',
            'createdBy:id,first_name,last_name,email',
            'updatedBy:id,first_name,last_name,email',
        ];
    }

    private function serializeApproach(MinorApproach $approach, Request $request): array
    {
        $data = $approach->toArray();
        $canViewPsychologistNotes = $request->user()?->hasRoleIn(config('approaches.reserved_psychologist_roles', [])) ?? false;
        $canViewCoordinatorNotes = $request->user()?->hasRoleIn(config('approaches.reserved_coordinator_roles', [])) ?? false;

        if (! $canViewPsychologistNotes) {
            $data['reserved_psychologist_notes'] = null;
        }

        if (! $canViewCoordinatorNotes) {
            $data['reserved_coordinator_notes'] = null;
        }

        $data['authorization_status'] = $this->resolveAuthorizationStatus($approach);
        $data['authorization_needs_renewal'] = $data['authorization_status'] === 'expiring';
        $data['authorization_days_until_expiry'] = $this->authorizationDaysUntilExpiry($approach);
        $data['authorization_is_expired'] = $data['authorization_status'] === 'expired';
        $data['can_renew_authorization'] = $request->user()
            ? $this->minorAccessService->canAccessMinor($request->user(), $approach->minor, 'minor_approaches.update')
            : false;
        $data['can_view_reserved_psychologist_notes'] = $canViewPsychologistNotes;
        $data['can_view_reserved_coordinator_notes'] = $canViewCoordinatorNotes;
        $data['has_reserved_notes'] = $this->hasReservedNotes($approach);
        $data['suspension_is_signed'] = filled($approach->suspension_signed_at);
        $data['can_sign_suspension'] = $request->user()
            ? ($this->minorAccessService->canAccessMinor($request->user(), $approach->minor, 'minor_approaches.update') && $this->canUserSignSuspension($request->user()))
            : false;
        $data['minor_contact_ids'] = $approach->minorContacts->pluck('id')->values()->all();
        $data['minor_contacts_count'] = $approach->minorContacts->count();
        $participantRoleIds = $approach->minorContacts
            ->map(fn ($contact) => (int) ($contact->pivot?->contact_type_id ?: $contact->contact_type_id ?: 0))
            ->filter(fn (int $value) => $value > 0)
            ->unique()
            ->values();
        $participantRoleMap = ContactType::query()
            ->whereIn('id', $participantRoleIds)
            ->get()
            ->keyBy('id');
        $data['participants'] = $approach->minorContacts
            ->map(function ($contact) use ($participantRoleMap): array {
                $roleId = $contact->pivot?->contact_type_id ?: $contact->contact_type_id;

                return [
                    'minor_contact_id' => $contact->id,
                    'contact_type_id' => $roleId,
                    'contact_type' => $roleId ? $participantRoleMap->get($roleId)?->toArray() : null,
                    'contact' => $contact->toArray(),
                    'sort_order' => (int) ($contact->pivot?->sort_order ?? 0),
                ];
            })
            ->values()
            ->all();
        $staffQualificationCodes = $approach->staffParticipants
            ->map(fn ($participant) => $participant->qualification_code ?: $participant->staffMember?->qualification_code)
            ->filter()
            ->unique()
            ->values();
        $staffQualificationMap = StaffQualification::query()
            ->whereIn('code', $staffQualificationCodes)
            ->get()
            ->keyBy('code');
        $data['staff_participants'] = $approach->staffParticipants
            ->map(function ($participant) use ($staffQualificationMap): array {
                $qualificationCode = $participant->qualification_code ?: $participant->staffMember?->qualification_code;

                return [
                    'staff_member_id' => $participant->staff_member_id,
                    'qualification_code' => $qualificationCode,
                    'qualification' => $qualificationCode ? $staffQualificationMap->get($qualificationCode)?->toArray() : null,
                    'staff_member' => $participant->staffMember?->toArray(),
                    'sort_order' => (int) $participant->sort_order,
                ];
            })
            ->values()
            ->all();
        $data['staff_participants_count'] = $approach->staffParticipants->count();

        if (! $data['minor_contact_id'] && $approach->minorContacts->isNotEmpty()) {
            $data['minor_contact_id'] = $approach->minorContacts->first()->id;
            $data['minor_contact'] = $approach->minorContacts->first()->toArray();
        }

        return $data;
    }

    private function hasReservedNotes(MinorApproach $approach): bool
    {
        return filled($approach->reserved_psychologist_notes) || filled($approach->reserved_coordinator_notes);
    }

    private function authorizationDaysUntilExpiry(MinorApproach $approach): ?int
    {
        if (! $approach->authorization_expires_at) {
            return null;
        }

        return now()->startOfDay()->diffInDays($approach->authorization_expires_at->copy()->startOfDay(), false);
    }

    private function canUserSignSuspension($user): bool
    {
        return $user?->hasRoleIn(config('approaches.reserved_coordinator_roles', [])) ?? false;
    }

    private function auditReservedNotesRead(Request $request, MinorApproach $approach): void
    {
        if (! $this->hasReservedNotes($approach)) {
            return;
        }

        $canViewPsychologistNotes = $request->user()?->hasRoleIn(config('approaches.reserved_psychologist_roles', [])) ?? false;
        $canViewCoordinatorNotes = $request->user()?->hasRoleIn(config('approaches.reserved_coordinator_roles', [])) ?? false;

        if (! $canViewPsychologistNotes && ! $canViewCoordinatorNotes) {
            return;
        }

        $this->auditLogService->record($request, [
            'facility_id' => $approach->facility_id,
            'minor_id' => $approach->minor_id,
            'action' => 'read',
            'resource_type' => 'minor_approach_reserved_notes',
            'resource_id' => (string) $approach->id,
            'resource_label' => $approach->title,
            'operation_summary' => sprintf(
                '%s ha consultato le note riservate dell\'avvicinamento #%d del minore %s %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $approach->id,
                $approach->minor->first_name,
                $approach->minor->last_name
            ),
            'new_values_json' => [
                'can_view_reserved_psychologist_notes' => $canViewPsychologistNotes,
                'can_view_reserved_coordinator_notes' => $canViewCoordinatorNotes,
                'has_reserved_notes' => true,
            ],
        ]);
        $this->auditLogService->markHandled($request);
    }

    private function resolveAuthorizationStatus(MinorApproach $approach): ?string
    {
        if (! $approach->authorization_expires_at) {
            return null;
        }

        $today = now()->startOfDay();
        $expiresAt = Carbon::parse($approach->authorization_expires_at)->startOfDay();

        if ($expiresAt->lt($today)) {
            return 'expired';
        }

        $threshold = $expiresAt->copy()->subDays((int) ($approach->authorization_renewal_alert_days ?: config('approaches.default_authorization_renewal_alert_days', 30)));

        if ($today->gte($threshold)) {
            return 'expiring';
        }

        return 'active';
    }

    private function resolveSuspendedByUserId(Request $request, ?MinorApproach $approach = null): ?int
    {
        if ($request->filled('suspended_by_user_id')) {
            return $request->integer('suspended_by_user_id');
        }

        if ((string) $request->input('status') === MinorApproach::STATUS_SUSPENDED || $request->filled('suspension_reason')) {
            return $request->user()?->id;
        }

        return $approach?->suspended_by_user_id;
    }

    private function syncApproachContacts(MinorApproach $approach, array $participants): void
    {
        $participants = collect($participants)
            ->map(function ($row): array {
                return [
                    'minor_contact_id' => (int) ($row['minor_contact_id'] ?? 0),
                    'contact_type_id' => isset($row['contact_type_id']) ? (int) $row['contact_type_id'] : null,
                ];
            })
            ->filter(fn (array $row) => $row['minor_contact_id'] > 0)
            ->unique(fn (array $row) => (string) $row['minor_contact_id'])
            ->values();

        $contactTypeByContactId = $approach->minor()
            ->firstOrFail()
            ->contacts()
            ->whereIn('id', $participants->pluck('minor_contact_id'))
            ->get(['id', 'contact_type_id'])
            ->pluck('contact_type_id', 'id');

        $approach->minorContacts()->sync(
            $participants
                ->mapWithKeys(fn (array $participant, int $index) => [
                    $participant['minor_contact_id'] => [
                        'sort_order' => $index,
                        'contact_type_id' => $participant['contact_type_id'] ?: $contactTypeByContactId[$participant['minor_contact_id']] ?? null,
                    ],
                ])
                ->all()
        );

        $approach->minor_contact_id = $participants->first()['minor_contact_id'] ?? null;
        $approach->saveQuietly();
    }

    private function syncApproachStaffParticipants(MinorApproach $approach, array $staffParticipants): void
    {
        $staffParticipants = collect($staffParticipants)
            ->map(fn ($row) => [
                'staff_member_id' => (int) ($row['staff_member_id'] ?? 0),
                'qualification_code' => isset($row['qualification_code']) ? (string) $row['qualification_code'] : null,
            ])
            ->filter(fn (array $row) => $row['staff_member_id'] > 0)
            ->unique(fn (array $row) => (string) $row['staff_member_id'])
            ->values();

        $qualificationByStaffId = StaffMember::query()
            ->whereIn('id', $staffParticipants->pluck('staff_member_id'))
            ->get(['id', 'qualification_code'])
            ->pluck('qualification_code', 'id');

        $approach->staffParticipants()->delete();

        foreach ($staffParticipants as $index => $staffParticipant) {
            $approach->staffParticipants()->create([
                'staff_member_id' => $staffParticipant['staff_member_id'],
                'qualification_code' => $staffParticipant['qualification_code'] ?: $qualificationByStaffId[$staffParticipant['staff_member_id']] ?? null,
                'sort_order' => $index,
            ]);
        }

        if ($staffParticipants->isNotEmpty()) {
            $approach->supervising_staff_member_id = $staffParticipants->first()['staff_member_id'];
            $approach->saveQuietly();
        }
    }
}
