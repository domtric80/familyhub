<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InternalMessages\StoreInternalMessageMessageRequest;
use App\Http\Requests\InternalMessages\StoreInternalMessageThreadRequest;
use App\Models\InternalMessageMessage;
use App\Models\InternalMessageThread;
use App\Models\InternalMessageThreadParticipant;
use App\Models\Minor;
use App\Models\User;
use App\Models\UserFacilityRole;
use App\Services\AuditLogService;
use App\Services\InternalMessageAccessService;
use App\Services\MinorAccessService;
use App\Services\SafeRichTextSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class InternalMessageController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService = new AuditLogService,
        private readonly InternalMessageAccessService $internalMessageAccessService = new InternalMessageAccessService,
        private readonly SafeRichTextSanitizer $safeRichTextSanitizer = new SafeRichTextSanitizer,
        private readonly MinorAccessService $minorAccessService = new MinorAccessService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = InternalMessageThread::query()
            ->with($this->baseRelations())
            ->orderByDesc('last_message_at')
            ->orderByDesc('id');

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('minor_id')) {
            $query->where('minor_id', $request->integer('minor_id'));
        }

        if ($request->filled('thread_type')) {
            $query->where('thread_type', (string) $request->input('thread_type'));
        }

        if ($request->filled('topic')) {
            $query->where('topic', (string) $request->input('topic'));
        }

        if ($request->filled('classification_code')) {
            $query->where('classification_code', (string) $request->input('classification_code'));
        }

        if ($request->has('archived')) {
            $archived = filter_var($request->input('archived'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($archived === true) {
                $query->whereNotNull('archived_at');
            } elseif ($archived === false) {
                $query->whereNull('archived_at');
            }
        } else {
            $query->whereNull('archived_at');
        }

        $query = $this->internalMessageAccessService->scopeVisibleThreadsForUser($query, $request->user());

        return response()->json(
            $query->get()
                ->filter(fn (InternalMessageThread $thread) => $this->internalMessageAccessService->canAccessThread($request->user(), $thread->loadMissing(['minor', 'documentClassification']), 'internal_messages.read'))
                ->values()
                ->map(fn (InternalMessageThread $thread) => $this->serializeThread($thread, $request->user()))
        );
    }

    public function participantOptions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'minor_id' => ['nullable', 'integer', 'exists:minors,id'],
            'classification_code' => ['nullable', 'string', 'exists:document_classifications,code'],
        ]);

        $facilityId = (int) $validated['facility_id'];
        abort_unless($request->user()->hasPermission('internal_messages.read', $facilityId), 403, 'Accesso ai partecipanti della messaggistica non consentito.');

        $minor = null;
        if ($request->filled('minor_id')) {
            $minor = Minor::query()->findOrFail($request->integer('minor_id'));
            abort_unless((int) $minor->facility_id === $facilityId, 422, 'Il minore selezionato non appartiene alla struttura indicata.');
            abort_unless($this->minorAccessService->hasActiveAssignment($request->user(), $minor), 403, 'Accesso al minore non consentito per questa conversazione.');
        }

        $classificationCode = $request->input('classification_code');
        if ($classificationCode) {
            abort_unless(
                $this->internalMessageAccessService->canUseClassification($request->user(), (string) $classificationCode, $facilityId, $minor),
                403,
                'La classificazione selezionata non è consentita per il tuo profilo.'
            );
        }

        $users = User::query()
            ->with([
                'userFacilityRoles' => fn ($query) => $query
                    ->with('role:id,code,name')
                    ->where('facility_id', $facilityId)
                    ->where('is_active', true)
                    ->where(function ($dateQuery): void {
                        $dateQuery->whereNull('valid_to')->orWhere('valid_to', '>=', now());
                    })
                    ->orderByDesc('valid_from')
                    ->orderByDesc('id'),
            ])
            ->whereHas('userFacilityRoles', fn ($query) => $query
                ->where('facility_id', $facilityId)
                ->where('is_active', true)
                ->where(function ($dateQuery): void {
                    $dateQuery->whereNull('valid_to')->orWhere('valid_to', '>=', now());
                }))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email']);

        if ($minor) {
            $users = $users->filter(fn (User $candidate): bool => $this->minorAccessService->hasActiveAssignment($candidate, $minor))->values();
        }

        if ($classificationCode) {
            $users = $users
                ->filter(fn (User $candidate): bool => $this->internalMessageAccessService->canUseClassification($candidate, (string) $classificationCode, $facilityId, $minor))
                ->values();
        }

        return response()->json([
            'facility_id' => $facilityId,
            'minor_id' => $minor?->id,
            'classification_code' => $classificationCode,
            'users' => $users->map(function (User $candidate) use ($facilityId, $minor): array {
                /** @var UserFacilityRole|null $assignment */
                $assignment = $candidate->userFacilityRoles
                    ->filter(fn (UserFacilityRole $item) => (int) $item->facility_id === $facilityId)
                    ->first();

                return [
                    'id' => $candidate->id,
                    'display_name' => trim(($candidate->last_name ?? '').' '.($candidate->first_name ?? '')),
                    'first_name' => $candidate->first_name,
                    'last_name' => $candidate->last_name,
                    'email' => $candidate->email,
                    'role_code' => $assignment?->role?->code,
                    'role_name' => $assignment?->role?->name,
                    'is_minor_scoped' => $minor ? $this->minorAccessService->hasActiveAssignment($candidate, $minor) : false,
                ];
            })->values(),
        ]);
    }

    public function store(StoreInternalMessageThreadRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasPermission('internal_messages.create', $request->integer('facility_id')), 403, 'Creazione conversazione interna non consentita.');

        $minor = null;
        if ($request->filled('minor_id')) {
            $minor = Minor::query()->findOrFail($request->integer('minor_id'));
            abort_unless($this->minorAccessService->hasActiveAssignment($request->user(), $minor), 403, 'Creazione conversazione sul minore non consentita per questo profilo.');
        }

        $thread = DB::transaction(function () use ($request) {
            $thread = InternalMessageThread::query()->create([
                'facility_id' => $request->integer('facility_id'),
                'minor_id' => $request->integer('minor_id') ?: null,
                'thread_type' => (string) $request->input('thread_type'),
                'subject' => (string) $request->input('subject'),
                'topic' => $request->input('topic'),
                'classification_code' => (string) ($request->input('classification_code') ?: 'internal'),
                'created_by_user_id' => $request->user()?->id,
                'updated_by_user_id' => $request->user()?->id,
                'last_message_at' => now(),
            ]);

            $participantIds = collect((array) $request->input('participant_user_ids', []))
                ->push($request->user()?->id)
                ->filter()
                ->unique()
                ->values();

            foreach ($participantIds as $participantId) {
                InternalMessageThreadParticipant::query()->create([
                    'thread_id' => $thread->id,
                    'user_id' => $participantId,
                    'joined_at' => now(),
                    'last_read_at' => (int) $participantId === (int) $request->user()?->id ? now() : null,
                    'is_active' => true,
                    'added_by_user_id' => $request->user()?->id,
                ]);
            }

            InternalMessageMessage::query()->create([
                'thread_id' => $thread->id,
                'sender_user_id' => $request->user()?->id,
                'body_encrypted' => Crypt::encryptString(
                    (string) $this->safeRichTextSanitizer->sanitize((string) $request->input('message_body'))
                ),
            ]);

            return $thread;
        });

        $thread = $this->loadThread($thread);

        $this->auditLogService->record($request, [
            'facility_id' => $thread->facility_id,
            'minor_id' => $thread->minor_id,
            'action' => 'create',
            'resource_type' => 'internal_message_thread',
            'resource_id' => (string) $thread->id,
            'resource_label' => $thread->subject,
            'operation_summary' => sprintf(
                '%s ha creato la conversazione interna #%d: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $thread->id,
                $thread->subject
            ),
            'new_values_json' => [
                'classification_code' => $thread->classification_code,
                'thread_type' => $thread->thread_type,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->serializeThread($thread, $request->user(), true), 201);
    }

    public function show(Request $request, InternalMessageThread $thread): JsonResponse
    {
        abort_unless($this->internalMessageAccessService->canAccessThread($request->user(), $thread->loadMissing(['minor', 'documentClassification']), 'internal_messages.read'), 403, 'Accesso alla conversazione interna non consentito.');

        $thread = $this->loadThread($thread);

        $this->auditLogService->record($request, [
            'facility_id' => $thread->facility_id,
            'minor_id' => $thread->minor_id,
            'action' => 'read',
            'resource_type' => 'internal_message_thread',
            'resource_id' => (string) $thread->id,
            'resource_label' => $thread->subject,
            'operation_summary' => sprintf(
                '%s ha aperto la conversazione interna #%d: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $thread->id,
                $thread->subject
            ),
            'new_values_json' => [
                'classification_code' => $thread->classification_code,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($this->serializeThread($thread, $request->user(), true));
    }

    public function addMessage(StoreInternalMessageMessageRequest $request, InternalMessageThread $thread): JsonResponse
    {
        abort_unless($this->internalMessageAccessService->canAccessThread($request->user(), $thread->loadMissing(['minor', 'documentClassification']), 'internal_messages.update'), 403, 'Invio messaggio non consentito per questa conversazione.');

        $message = DB::transaction(function () use ($request, $thread) {
            $message = InternalMessageMessage::query()->create([
                'thread_id' => $thread->id,
                'sender_user_id' => $request->user()?->id,
                'body_encrypted' => Crypt::encryptString(
                    (string) $this->safeRichTextSanitizer->sanitize((string) $request->input('body'))
                ),
            ]);

            $thread->update([
                'updated_by_user_id' => $request->user()?->id,
                'last_message_at' => $message->created_at,
            ]);

            $thread->participants()
                ->where('user_id', $request->user()?->id)
                ->update(['last_read_at' => now()]);

            return $message->load('sender:id,first_name,last_name,email');
        });

        $this->auditLogService->record($request, [
            'facility_id' => $thread->facility_id,
            'minor_id' => $thread->minor_id,
            'action' => 'update',
            'resource_type' => 'internal_message_thread',
            'resource_id' => (string) $thread->id,
            'resource_label' => $thread->subject,
            'operation_summary' => sprintf(
                '%s ha inviato un messaggio nella conversazione interna #%d: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $thread->id,
                $thread->subject
            ),
            'new_values_json' => [
                'classification_code' => $thread->classification_code,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($message, 201);
    }

    public function markRead(Request $request, InternalMessageThread $thread): JsonResponse
    {
        abort_unless($this->internalMessageAccessService->canAccessThread($request->user(), $thread->loadMissing(['minor', 'documentClassification']), 'internal_messages.read'), 403, 'Presa visione conversazione non consentita.');

        $participant = $thread->participants()
            ->where('user_id', $request->user()?->id)
            ->where('is_active', true)
            ->firstOrFail();

        $participant->update([
            'last_read_at' => now(),
        ]);

        return response()->json([
            'message' => 'Conversazione marcata come letta.',
            'thread_id' => $thread->id,
            'last_read_at' => optional($participant->last_read_at)->toIso8601String(),
        ]);
    }

    public function archive(Request $request, InternalMessageThread $thread): JsonResponse
    {
        abort_unless($this->internalMessageAccessService->canAccessThread($request->user(), $thread->loadMissing(['minor', 'documentClassification']), 'internal_messages.update'), 403, 'Archiviazione conversazione non consentita.');

        $thread->forceFill([
            'archived_at' => now(),
            'updated_by_user_id' => $request->user()?->id,
        ])->save();

        $this->auditLogService->record($request, [
            'facility_id' => $thread->facility_id,
            'minor_id' => $thread->minor_id,
            'action' => 'archive',
            'resource_type' => 'internal_message_thread',
            'resource_id' => (string) $thread->id,
            'resource_label' => $thread->subject,
            'operation_summary' => sprintf(
                '%s ha archiviato la conversazione interna #%d: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $thread->id,
                $thread->subject
            ),
            'new_values_json' => [
                'classification_code' => $thread->classification_code,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json([
            'message' => 'Conversazione archiviata.',
            'thread' => $this->serializeThread($this->loadThread($thread), $request->user(), true),
        ]);
    }

    private function loadThread(InternalMessageThread $thread): InternalMessageThread
    {
        return $thread->load($this->baseRelations());
    }

    private function baseRelations(): array
    {
        return [
            'facility.organization',
            'minor.minorStatus',
            'documentClassification',
            'participants.user:id,first_name,last_name,email',
            'participants.addedBy:id,first_name,last_name,email',
            'messages.sender:id,first_name,last_name,email',
            'createdBy:id,first_name,last_name,email',
            'updatedBy:id,first_name,last_name,email',
        ];
    }

    private function serializeThread(InternalMessageThread $thread, User $user, bool $includeMessages = false): array
    {
        $participant = $thread->participants->firstWhere('user_id', $user->id);
        $messages = $includeMessages ? $thread->messages->values()->all() : [];
        $latestMessageAt = $thread->messages->max('created_at') ?: $thread->last_message_at;

        $unreadCount = $thread->messages
            ->filter(fn (InternalMessageMessage $message) => ! $participant?->last_read_at || $message->created_at->gt($participant->last_read_at))
            ->count();

        return [
            'id' => $thread->id,
            'facility_id' => $thread->facility_id,
            'minor_id' => $thread->minor_id,
            'thread_type' => $thread->thread_type,
            'subject' => $thread->subject,
            'topic' => $thread->topic,
            'classification_code' => $thread->classification_code ?: 'internal',
            'classification_label' => $thread->documentClassification?->name,
            'document_classification' => $thread->documentClassification ? [
                'id' => $thread->documentClassification->id,
                'code' => $thread->documentClassification->code,
                'name' => $thread->documentClassification->name,
                'is_active' => (bool) $thread->documentClassification->is_active,
            ] : null,
            'last_message_at' => optional($latestMessageAt)->toIso8601String(),
            'archived_at' => optional($thread->archived_at)->toIso8601String(),
            'unread_count' => $unreadCount,
            'facility' => $thread->facility,
            'minor' => $thread->minor,
            'participants' => $thread->participants->values(),
            'latest_message' => $thread->messages->last(),
            'messages' => $messages,
            'created_by' => $thread->createdBy,
            'updated_by' => $thread->updatedBy,
        ];
    }
}
