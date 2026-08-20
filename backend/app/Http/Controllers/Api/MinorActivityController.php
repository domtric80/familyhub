<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Activities\StoreMinorActivityRequest;
use App\Http\Requests\Activities\StoreMinorActivityMediaRequest;
use App\Http\Requests\Activities\UpdateMinorActivityRequest;
use App\Http\Requests\Activities\StoreMinorActivityReminderRequest;
use App\Models\Minor;
use App\Models\MinorActivity;
use App\Models\MinorActivityMedia;
use App\Models\MinorActivityReminder;
use App\Models\MinorDocument;
use App\Models\User;
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

    public function calendar(Request $request): JsonResponse
    {
        $data = $request->validate(['date_from' => ['required', 'date'], 'date_to' => ['required', 'date', 'after_or_equal:date_from'], 'facility_id' => ['nullable', 'integer', 'exists:facilities,id'], 'minor_id' => ['nullable', 'integer', 'exists:minors,id']]);
        $from = $request->date('date_from')->startOfDay();
        $to = $request->date('date_to')->endOfDay();
        abort_if($from->diffInDays($to) > 62, 422, 'Il calendario può coprire al massimo 62 giorni.');
        $query = MinorActivity::query()->with($this->baseRelations())->whereBetween('planned_start_at', [$from, $to])->when($data['facility_id'] ?? null, fn ($builder, $id) => $builder->where('facility_id', $id))->when($data['minor_id'] ?? null, fn ($builder, $id) => $builder->where('minor_id', $id))->orderBy('planned_start_at');
        $query->whereHas('minor', fn (Builder $minorQuery) => $this->minorAccessService->scopeVisibleMinorsForUser($minorQuery, $request->user()));
        return response()->json($query->get());
    }

    public function listReminders(MinorActivity $activity): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor(request()->user(), $activity->minor, 'minor_activities.update'), 403, 'Gestione promemoria non consentita.');
        return response()->json($activity->reminders()->with('recipient:id,first_name,last_name,email')->orderBy('remind_at')->get());
    }

    public function storeReminder(StoreMinorActivityReminderRequest $request, MinorActivity $activity): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $activity->minor, 'minor_activities.update'), 403, 'Gestione promemoria non consentita.');
        abort_if(! $activity->planned_start_at || $request->date('remind_at')->greaterThanOrEqualTo($activity->planned_start_at), 422, 'Il promemoria deve precedere l’inizio previsto dell’attività.');
        $recipient = User::query()->findOrFail($request->integer('recipient_user_id'));
        abort_unless($recipient->is_active && $this->minorAccessService->canAccessMinor($recipient, $activity->minor, 'minor_activities.read'), 403, 'Il destinatario non è autorizzato ad accedere al minore.');
        $reminder = $activity->reminders()->create([...$request->validated(), 'created_by_user_id' => $request->user()->id]);
        $this->auditReminder($request, 'create', $activity, $reminder, 'ha creato un promemoria attività');
        return response()->json($reminder->load('recipient:id,first_name,last_name,email'), 201);
    }

    public function myReminders(Request $request): JsonResponse
    {
        $query = MinorActivityReminder::query()->where('recipient_user_id', $request->user()->id)->with(['activity' => fn ($builder) => $builder->with($this->baseRelations())])->whereHas('activity.minor', fn (Builder $minorQuery) => $this->minorAccessService->scopeVisibleMinorsForUser($minorQuery, $request->user()));
        if ($request->boolean('pending_only', true)) $query->whereNull('acknowledged_at');
        return response()->json($query->orderBy('remind_at')->get());
    }

    public function destroyReminder(Request $request, MinorActivity $activity, MinorActivityReminder $reminder): JsonResponse
    {
        abort_unless($reminder->minor_activity_id === $activity->id, 404);
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $activity->minor, 'minor_activities.update'), 403, 'Gestione promemoria non consentita.');
        abort_if($reminder->acknowledged_at, 409, 'Un promemoria già confermato non può essere eliminato.');
        $this->auditReminder($request, 'delete', $activity, $reminder, 'ha eliminato un promemoria attività');
        $reminder->delete();
        return response()->json(status: 204);
    }

    public function acknowledgeReminder(Request $request, MinorActivity $activity, MinorActivityReminder $reminder): JsonResponse
    {
        abort_unless($reminder->minor_activity_id === $activity->id && $reminder->recipient_user_id === $request->user()->id, 404);
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $activity->minor, 'minor_activities.read'), 403, 'Accesso promemoria non consentito.');
        $alreadyAcknowledged = (bool) $reminder->acknowledged_at;
        if (! $alreadyAcknowledged) { $reminder->update(['acknowledged_at' => now()]); $this->auditReminder($request, 'acknowledge', $activity, $reminder, 'ha confermato un promemoria attività'); }
        return response()->json(['reminder_id' => $reminder->id, 'acknowledged_at' => $reminder->fresh()->acknowledged_at, 'already_acknowledged' => $alreadyAcknowledged]);
    }

    public function listMedia(Request $request, MinorActivity $activity): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $activity->minor, 'minor_activities.read'), 403, 'Accesso ai media dell’attività non consentito.');

        $items = $activity->media()
            ->with($this->mediaRelations())
            ->orderByDesc('captured_at')
            ->orderByDesc('id')
            ->get()
            ->filter(fn (MinorActivityMedia $media): bool => $this->canAccessMediaDocuments($request, $activity, $media))
            ->map(fn (MinorActivityMedia $media): array => $this->serializeMedia($request, $activity, $media));

        return response()->json($items);
    }

    public function storeMedia(StoreMinorActivityMediaRequest $request, MinorActivity $activity): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $activity->minor, 'minor_activities.update'), 403, 'Gestione media dell’attività non consentita.');

        $mediaDocument = MinorDocument::query()->with(['attachment', 'documentType', 'documentClassification'])->findOrFail($request->integer('media_document_id'));
        $consentDocument = MinorDocument::query()->with(['attachment', 'documentType', 'documentClassification'])->findOrFail($request->integer('consent_document_id'));
        $this->assertMediaDocuments($request, $activity, $mediaDocument, $consentDocument);

        $media = $activity->media()->create([
            ...$request->validated(),
            'created_by_user_id' => $request->user()->id,
        ]);

        $this->auditMedia($request, 'create', $activity, $media, 'ha collegato un media con consenso');

        return response()->json($this->serializeMedia($request, $activity, $media->load($this->mediaRelations())), 201);
    }

    public function destroyMedia(Request $request, MinorActivity $activity, MinorActivityMedia $media): JsonResponse
    {
        $this->assertMediaBelongsToActivity($activity, $media);
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $activity->minor, 'minor_activities.update'), 403, 'Gestione media dell’attività non consentita.');
        $media->loadMissing($this->mediaRelations());
        abort_unless($this->canAccessMediaDocuments($request, $activity, $media), 403, 'Accesso ABAC al documento media o consenso negato.');
        abort_if($media->consent_revoked_at, 409, 'Il consenso è revocato: il record deve essere conservato per audit.');

        $this->auditMedia($request, 'delete', $activity, $media, 'ha eliminato un collegamento media');
        $media->delete();

        return response()->json(status: 204);
    }

    public function revokeMediaConsent(Request $request, MinorActivity $activity, MinorActivityMedia $media): JsonResponse
    {
        $this->assertMediaBelongsToActivity($activity, $media);
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $activity->minor, 'minor_activities.update'), 403, 'Revoca consenso non consentita.');
        $media->loadMissing($this->mediaRelations());
        abort_unless($this->canAccessMediaDocuments($request, $activity, $media), 403, 'Accesso ABAC al documento media o consenso negato.');
        $validated = $request->validate(['reason' => ['required', 'string', 'min:3', 'max:1000']]);
        $alreadyRevoked = (bool) $media->consent_revoked_at;

        if (! $alreadyRevoked) {
            $media->update([
                'consent_revoked_at' => now(),
                'consent_revoked_by_user_id' => $request->user()->id,
                'consent_revocation_reason_encrypted' => $validated['reason'],
            ]);
            $this->auditMedia($request, 'revoke', $activity, $media, 'ha revocato il consenso di un media');
        }

        return response()->json([
            ...$this->serializeMedia($request, $activity, $media->fresh()->load($this->mediaRelations())),
            'already_revoked' => $alreadyRevoked,
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

    private function auditReminder(Request $request, string $action, MinorActivity $activity, MinorActivityReminder $reminder, string $verb): void
    {
        $this->auditLogService->record($request, ['facility_id' => $activity->facility_id, 'minor_id' => $activity->minor_id, 'action' => $action, 'resource_type' => 'minor_activity_reminder', 'resource_id' => (string) $reminder->id, 'resource_label' => 'Promemoria attività #'.$activity->id, 'operation_summary' => $this->auditLogService->resolveActorDisplayName($request->user()).' '.$verb.' per l’attività #'.$activity->id.'.', 'new_values_json' => ['activity_id' => $activity->id, 'recipient_user_id' => $reminder->recipient_user_id, 'remind_at' => $reminder->remind_at?->toIso8601String(), 'acknowledged_at' => $reminder->acknowledged_at?->toIso8601String()]]);
        $this->auditLogService->markHandled($request);
    }

    private function mediaRelations(): array
    {
        return [
            'mediaDocument.documentType',
            'mediaDocument.documentClassification',
            'mediaDocument.attachment',
            'consentDocument.documentType',
            'consentDocument.documentClassification',
            'consentDocument.attachment',
            'createdBy:id,first_name,last_name,email',
            'consentRevokedBy:id,first_name,last_name,email',
        ];
    }

    private function assertMediaDocuments(Request $request, MinorActivity $activity, MinorDocument $mediaDocument, MinorDocument $consentDocument): void
    {
        abort_if($mediaDocument->minor_id !== $activity->minor_id || $consentDocument->minor_id !== $activity->minor_id, 422, 'Media e consenso devono appartenere al minore dell’attività.');
        abort_if(! $mediaDocument->attachment || ! $consentDocument->attachment, 422, 'Documento media o consenso privo di allegato.');
        abort_if($mediaDocument->attachment->security_status !== 'clean' || $consentDocument->attachment->security_status !== 'clean', 422, 'Media e consenso devono aver superato la verifica di sicurezza.');

        $allowedMediaTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
        abort_unless(in_array($mediaDocument->attachment->mime_type, $allowedMediaTypes, true), 422, 'Il documento media deve essere JPEG, PNG, WEBP o MP4.');
        abort_if($consentDocument->expiry_date?->isPast(), 422, 'Il documento di consenso è scaduto.');

        foreach ([$mediaDocument, $consentDocument] as $document) {
            $classification = (string) ($document->classification_code ?: $document->classification);
            abort_unless($this->minorAccessService->canAccessDocumentClassification($request->user(), $activity->minor, $classification, 'read'), 403, 'Accesso ABAC al documento media o consenso negato.');
        }
    }

    private function assertMediaBelongsToActivity(MinorActivity $activity, MinorActivityMedia $media): void
    {
        abort_unless($media->minor_activity_id === $activity->id, 404);
    }

    private function serializeMedia(Request $request, MinorActivity $activity, MinorActivityMedia $media): array
    {
        $mediaDocument = $media->mediaDocument;
        $consentDocument = $media->consentDocument;
        $expired = (bool) $consentDocument?->expiry_date?->isPast();
        $revoked = (bool) $media->consent_revoked_at;
        $clean = $mediaDocument?->attachment?->security_status === 'clean' && $consentDocument?->attachment?->security_status === 'clean';
        $abacAllowed = $this->canAccessMediaDocuments($request, $activity, $media);

        return [
            'id' => $media->id,
            'minor_activity_id' => $media->minor_activity_id,
            'media_document_id' => $media->media_document_id,
            'consent_document_id' => $media->consent_document_id,
            'captured_at' => $media->captured_at?->toIso8601String(),
            'consent_expires_at' => $consentDocument?->expiry_date?->toDateString(),
            'consent_revoked_at' => $media->consent_revoked_at?->toIso8601String(),
            'consent_status' => $revoked ? 'revoked' : ($expired ? 'expired' : 'valid'),
            'can_preview' => ! $revoked && ! $expired && $clean && $abacAllowed,
            'media_document' => $this->safeDocumentMetadata($mediaDocument),
            'consent_document' => $this->safeDocumentMetadata($consentDocument),
            'created_by' => $media->createdBy,
            'consent_revoked_by' => $media->consentRevokedBy,
        ];
    }

    private function safeDocumentMetadata(?MinorDocument $document): ?array
    {
        if (! $document) {
            return null;
        }

        return [
            'id' => $document->id,
            'label' => $document->label,
            'document_type' => $document->documentType ? ['id' => $document->documentType->id, 'code' => $document->documentType->code, 'name' => $document->documentType->name] : null,
            'classification_code' => $document->classification_code ?: $document->classification,
            'original_name' => $document->attachment?->original_name,
            'mime_type' => $document->attachment?->mime_type,
            'size_bytes' => $document->attachment?->size_bytes,
            'security_status' => $document->attachment?->security_status,
        ];
    }

    private function canAccessMediaDocuments(Request $request, MinorActivity $activity, MinorActivityMedia $media): bool
    {
        $mediaDocument = $media->mediaDocument;
        $consentDocument = $media->consentDocument;

        if (! $mediaDocument || ! $consentDocument) {
            return false;
        }

        return $this->minorAccessService->canAccessDocumentClassification(
            $request->user(),
            $activity->minor,
            (string) ($mediaDocument->classification_code ?: $mediaDocument->classification),
            'read',
        ) && $this->minorAccessService->canAccessDocumentClassification(
            $request->user(),
            $activity->minor,
            (string) ($consentDocument->classification_code ?: $consentDocument->classification),
            'read',
        );
    }

    private function auditMedia(Request $request, string $action, MinorActivity $activity, MinorActivityMedia $media, string $verb): void
    {
        $this->minorHistoryService->record($activity->minor, 'minor_activity_media_'.$action, $request->user(), [
            'minor_activity_id' => $activity->id,
            'minor_activity_media_id' => $media->id,
            'media_document_id' => $media->media_document_id,
            'consent_document_id' => $media->consent_document_id,
        ]);
        $this->auditLogService->record($request, [
            'facility_id' => $activity->facility_id,
            'minor_id' => $activity->minor_id,
            'action' => $action,
            'resource_type' => 'minor_activity_media',
            'resource_id' => (string) $media->id,
            'resource_label' => 'Media attività #'.$activity->id,
            'operation_summary' => $this->auditLogService->resolveActorDisplayName($request->user()).' '.$verb.' per l’attività #'.$activity->id.'.',
            'new_values_json' => [
                'activity_id' => $activity->id,
                'media_document_id' => $media->media_document_id,
                'consent_document_id' => $media->consent_document_id,
                'consent_revoked_at' => $media->consent_revoked_at?->toIso8601String(),
            ],
        ]);
        $this->auditLogService->markHandled($request);
    }
}
