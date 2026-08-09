<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentClassification;
use App\Jobs\ScanAttachmentJob;
use App\Http\Requests\Minors\StoreMinorDiagnosisRequest;
use App\Http\Requests\Minors\StoreMinorDocumentRequest;
use App\Http\Requests\Minors\StoreMinorNeedRequest;
use App\Http\Requests\Minors\StoreMinorNoteRequest;
use App\Http\Requests\Minors\StoreMinorPeiObjectiveRequest;
use App\Http\Requests\Minors\StoreMinorPeiRequest;
use App\Http\Requests\Minors\UpsertMinorCaseDetailRequest;
use App\Http\Requests\Minors\StoreMinorContactRequest;
use App\Http\Requests\Minors\StoreMinorRequest;
use App\Http\Requests\Minors\UpdateMinorDiagnosisRequest;
use App\Http\Requests\Minors\UpdateMinorContactRequest;
use App\Http\Requests\Minors\UpdateMinorNeedRequest;
use App\Http\Requests\Minors\UpdateMinorNoteRequest;
use App\Http\Requests\Minors\UpdateMinorPeiObjectiveRequest;
use App\Http\Requests\Minors\UpdateMinorPeiRequest;
use App\Http\Requests\Minors\UpdateMinorRequest;
use App\Http\Requests\Minors\UpsertMinorProfileRequest;
use App\Models\Attachment;
use App\Models\DocumentIssuer;
use App\Models\Minor;
use App\Models\MinorContact;
use App\Models\MinorDiagnosis;
use App\Models\MinorDocument;
use App\Models\MinorNeed;
use App\Models\MinorNote;
use App\Models\MinorPei;
use App\Models\MinorPeiObjective;
use App\Models\StaffMember;
use App\Services\MinorAccessService;
use App\Services\AuditLogService;
use App\Services\MinorHistoryService;
use App\Services\MinorPeiHistoryService;
use App\Services\SpreadsheetPreviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class MinorController extends Controller
{
    public function __construct(
        private readonly MinorHistoryService $minorHistoryService,
        private readonly MinorPeiHistoryService $minorPeiHistoryService = new MinorPeiHistoryService(),
        private readonly AuditLogService $auditLogService = new AuditLogService(),
        private readonly MinorAccessService $minorAccessService = new MinorAccessService(),
        private readonly SpreadsheetPreviewService $spreadsheetPreviewService = new SpreadsheetPreviewService(),
    )
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Minor::query()
            ->with(['facility.organization', 'birthCity.province.region.country', 'biologicalSex', 'genderIdentity', 'minorStatus'])
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($request->user()) {
            $query = $this->minorAccessService->scopeVisibleMinorsForUser($query, $request->user());
        }

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('minor_status_id')) {
            $query->where('minor_status_id', $request->integer('minor_status_id'));
        }

        return response()->json($query->get());
    }

    public function store(StoreMinorRequest $request): JsonResponse
    {
        $minor = Minor::query()->create($request->validated());
        $this->minorHistoryService->record($minor, 'minor_created', $request->user());

        return response()->json(
            $minor->load(['facility.organization', 'birthCity.province.region.country', 'biologicalSex', 'genderIdentity', 'minorStatus']),
            201
        );
    }

    public function show(Minor $minor): JsonResponse
    {
        $this->authorizeMinorSensitiveRead(request()->user(), $minor);

        $minor = $minor->load([
            'facility.organization',
            'birthCity.province.region.country',
            'biologicalSex',
            'genderIdentity',
            'minorStatus',
            'profile',
            'diagnoses',
            'peis.objectives.responsibleStaffMember.qualificationLookup',
            'peis.objectives.progressLogs.actor',
            'peis.historyEntries.actor',
            'peis.signedBy',
            'needs.responsibleStaffMember.qualificationLookup',
            'needs.attachmentDocument.attachment',
            'needs.attachmentDocument.documentType',
            'notes.documentClassification',
            'notes.createdBy',
            'notes.updatedBy',
            'caseDetail.entryCity.province.region.country',
            'caseDetail.originFacility.organization',
            'caseDetail.placementOrderDocument.documentType',
            'caseDetail.placementOrderDocument.attachment',
            'caseDetail.judicialAuthority',
            'caseDetail.generalPractitioner.qualificationLookup',
            'caseDetail.pediatrician.qualificationLookup',
            'caseDetail.healthAuthority',
            'caseDetail.vaccinationDocument.documentType',
            'caseDetail.vaccinationDocument.attachment',
            'contacts.contactType',
            'documents.documentType',
            'documents.documentIssuer',
            'documents.documentClassification',
            'documents.attachment',
        ]);

        $visibleDocuments = $minor->documents->filter(fn (MinorDocument $document) => $this->minorAccessService->canAccessDocumentClassification(
            request()->user(),
            $minor,
            (string) ($document->classification_code ?: $document->classification),
            'read',
        ))->values();

        $minor->setRelation('documents', $visibleDocuments);
        $visibleNotes = $minor->notes->filter(fn (MinorNote $note) => $this->minorAccessService->canAccessDocumentClassification(
            request()->user(),
            $minor,
            (string) $note->classification_code,
            'read',
        ))->values();
        $minor->setRelation('notes', $visibleNotes);
        $minor->setAttribute('pei_trends', $this->buildPeiTrends($minor));

        $this->minorHistoryService->recordAccess($minor, 'minor_viewed', request()->user(), [
            'ip_address' => request()->ip(),
            'operation_summary' => sprintf(
                '%s ha avuto accesso in lettura ai dati del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName(request()->user()),
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);

        $this->auditLogService->record(request(), [
            'facility_id' => $minor->facility_id,
            'minor_id' => $minor->id,
            'action' => 'read',
            'resource_type' => 'minor',
            'resource_id' => (string) $minor->id,
            'resource_label' => $minor->internal_code,
            'operation_summary' => sprintf(
                '%s ha avuto accesso in lettura ai dati del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName(request()->user()),
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->auditLogService->markHandled(request());

        return response()->json($this->normalizeMixed($minor->toArray()));
    }

    private function buildPeiTrends(Minor $minor): array
    {
        $peis = $minor->peis ?? collect();
        $objectives = $peis->flatMap(fn (MinorPei $pei) => $pei->objectives ?? collect())->values();
        $progressLogs = $objectives
            ->flatMap(fn (MinorPeiObjective $objective) => $objective->progressLogs ?? collect())
            ->sortBy('created_at')
            ->values();

        return [
            'summary' => [
                'total_peis' => $peis->count(),
                'active_peis' => $peis->where('status', 'active')->count(),
                'total_objectives' => $objectives->count(),
                'completed_objectives' => $objectives->where('status', 'completed')->count(),
                'average_progress_percent' => $objectives->isEmpty()
                    ? null
                    : round((float) $objectives->avg(fn (MinorPeiObjective $objective) => (int) ($objective->progress_percent ?? 0)), 2),
                'linked_activity_events' => $progressLogs->where('source_type', 'minor_activity')->count(),
                'linked_journal_events' => $progressLogs->where('source_type', 'minor_journal_entry')->count(),
            ],
            'objective_trends' => $objectives->map(function (MinorPeiObjective $objective): array {
                $logs = collect($objective->progressLogs ?? [])
                    ->sortBy('created_at')
                    ->values();

                return [
                    'objective_id' => $objective->id,
                    'minor_pei_id' => $objective->minor_pei_id,
                    'objective_code' => $this->normalizeUtf8($objective->code),
                    'objective_title' => $this->normalizeUtf8($objective->title),
                    'status' => $this->normalizeUtf8($objective->status),
                    'current_progress_percent' => $objective->progress_percent,
                    'last_progress_at' => optional($logs->last()?->created_at)?->toISOString(),
                    'series' => $logs->map(fn ($log) => [
                        'logged_at' => optional($log->created_at)?->toISOString(),
                        'progress_percent' => $log->progress_percent,
                        'status' => $this->normalizeUtf8($log->status),
                        'source_type' => $this->normalizeUtf8($log->source_type),
                        'source_id' => $this->normalizeUtf8($log->source_id),
                        'source_label' => $this->normalizeUtf8($log->source_label),
                        'notes' => $this->normalizeUtf8($log->notes),
                    ])->values()->all(),
                ];
            })->values()->all(),
            'recent_events' => $progressLogs
                ->sortByDesc('created_at')
                ->take(12)
                ->map(fn ($log) => [
                    'objective_id' => $log->minor_pei_objective_id,
                    'logged_at' => optional($log->created_at)?->toISOString(),
                    'progress_percent' => $log->progress_percent,
                    'status' => $this->normalizeUtf8($log->status),
                    'source_type' => $this->normalizeUtf8($log->source_type),
                    'source_id' => $this->normalizeUtf8($log->source_id),
                    'source_label' => $this->normalizeUtf8($log->source_label),
                    'notes' => $this->normalizeUtf8($log->notes),
                    'actor' => $log->actor ? [
                        'id' => $log->actor->id,
                        'display_name' => $this->normalizeUtf8(trim($log->actor->first_name.' '.$log->actor->last_name) ?: $log->actor->email),
                        'email' => $this->normalizeUtf8($log->actor->email),
                    ] : null,
                ])
                ->values()
                ->all(),
        ];
    }

    private function normalizeUtf8(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        if (mb_check_encoding($value, 'UTF-8')) {
            return $value;
        }

        return mb_convert_encoding($value, 'UTF-8', 'UTF-8, ISO-8859-1, Windows-1252');
    }

    private function normalizeMixed(mixed $value): mixed
    {
        if (is_string($value)) {
            return $this->normalizeUtf8($value);
        }

        if (is_array($value)) {
            $normalized = [];

            foreach ($value as $key => $item) {
                $normalized[$key] = $this->normalizeMixed($item);
            }

            return $normalized;
        }

        return $value;
    }

    public function update(UpdateMinorRequest $request, Minor $minor): JsonResponse
    {
        $this->authorizeMinorWrite($request->user(), $minor);

        $minor->fill($request->validated());
        $minor->save();
        $this->minorHistoryService->record($minor, 'minor_updated', $request->user());

        return response()->json(
            $minor->load(['facility.organization', 'birthCity.province.region.country', 'biologicalSex', 'genderIdentity', 'minorStatus', 'profile', 'contacts.contactType'])
        );
    }

    public function upsertCaseDetail(UpsertMinorCaseDetailRequest $request, Minor $minor): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);

        $caseDetail = $minor->caseDetail()->updateOrCreate(
            [],
            [
                ...$request->validated(),
                'updated_by_user_id' => $request->user()?->id,
            ]
        );

        $this->minorHistoryService->record($minor, 'minor_case_detail_upserted', $request->user(), [
            'operation_summary' => sprintf(
                '%s ha aggiornato la scheda legale/sanitaria del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'update', 'minor_case_detail', (string) $caseDetail->id, 'Scheda caso', [
            'case_detail_id' => $caseDetail->id,
        ]);

        return response()->json($caseDetail->fresh()->load([
            'entryCity.province.region.country',
            'originFacility.organization',
            'placementOrderDocument.documentType',
            'placementOrderDocument.attachment',
            'judicialAuthority',
            'generalPractitioner.qualificationLookup',
            'pediatrician.qualificationLookup',
            'healthAuthority',
            'vaccinationDocument.documentType',
            'vaccinationDocument.attachment',
        ]));
    }

    public function upsertProfile(UpsertMinorProfileRequest $request, Minor $minor): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);

        $profile = $minor->profile()->updateOrCreate(
            [],
            [
                ...$request->validated(),
                'updated_by_user_id' => $request->user()?->id,
            ]
        );
        $this->minorHistoryService->record($minor, 'minor_profile_upserted', $request->user());
        $this->recordMinorAudit($request, $minor, 'update', 'minor_profile', (string) $profile->id, 'Profilo minore', [
            'profile_id' => $profile->id,
        ]);

        return response()->json($profile->fresh());
    }

    public function storeDiagnosis(StoreMinorDiagnosisRequest $request, Minor $minor): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);

        $diagnosis = DB::transaction(function () use ($request, $minor) {
            if ($request->boolean('is_primary')) {
                $minor->diagnoses()->update(['is_primary' => false]);
            }

            return $minor->diagnoses()->create([
                ...$request->validated(),
                'updated_by_user_id' => $request->user()?->id,
            ]);
        });

        $this->minorHistoryService->record($minor, 'minor_diagnosis_created', $request->user(), [
            'diagnosis_id' => $diagnosis->id,
            'operation_summary' => sprintf(
                '%s ha inserito la diagnosi %s per il minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $diagnosis->diagnosis_label,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'create', 'minor_diagnosis', (string) $diagnosis->id, $diagnosis->diagnosis_label, [
            'diagnosis_id' => $diagnosis->id,
            'dsm_code' => $diagnosis->dsm_code,
        ]);

        return response()->json($diagnosis->fresh(), 201);
    }

    public function updateDiagnosis(UpdateMinorDiagnosisRequest $request, Minor $minor, MinorDiagnosis $diagnosis): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        abort_unless($diagnosis->minor_id === $minor->id, 404);

        DB::transaction(function () use ($request, $minor, $diagnosis): void {
            if ($request->boolean('is_primary')) {
                $minor->diagnoses()->whereKeyNot($diagnosis->id)->update(['is_primary' => false]);
            }

            $diagnosis->fill([
                ...$request->validated(),
                'updated_by_user_id' => $request->user()?->id,
            ])->save();
        });

        $this->minorHistoryService->record($minor, 'minor_diagnosis_updated', $request->user(), [
            'diagnosis_id' => $diagnosis->id,
            'operation_summary' => sprintf(
                '%s ha aggiornato la diagnosi %s del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $diagnosis->diagnosis_label,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'update', 'minor_diagnosis', (string) $diagnosis->id, $diagnosis->diagnosis_label, [
            'diagnosis_id' => $diagnosis->id,
            'dsm_code' => $diagnosis->dsm_code,
        ]);

        return response()->json($diagnosis->fresh());
    }

    public function destroyDiagnosis(Request $request, Minor $minor, MinorDiagnosis $diagnosis): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        abort_unless($diagnosis->minor_id === $minor->id, 404);

        $label = $diagnosis->diagnosis_label;
        $id = $diagnosis->id;
        $diagnosis->delete();

        $this->minorHistoryService->record($minor, 'minor_diagnosis_deleted', $request->user(), [
            'diagnosis_id' => $id,
            'operation_summary' => sprintf(
                '%s ha eliminato la diagnosi %s del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $label,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'delete', 'minor_diagnosis', (string) $id, $label, [
            'diagnosis_id' => $id,
        ]);

        return response()->json(status: 204);
    }

    public function storePei(StoreMinorPeiRequest $request, Minor $minor): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);

        $pei = $minor->peis()->create([
            ...$request->validated(),
            'updated_by_user_id' => $request->user()?->id,
            'signed_by_user_id' => $request->filled('signed_at') ? $request->user()?->id : null,
        ]);

        $this->minorHistoryService->record($minor, 'minor_pei_created', $request->user(), [
            'pei_id' => $pei->id,
            'operation_summary' => sprintf(
                '%s ha creato il PEI %s per il minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $pei->title,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'create', 'minor_pei', (string) $pei->id, $pei->title, [
            'pei_id' => $pei->id,
            'status' => $pei->status,
        ]);
        $this->minorPeiHistoryService->recordPeiEvent($pei->fresh()->load(['objectives.responsibleStaffMember.qualificationLookup', 'signedBy']), 'minor_pei_created', $request->user(), [
            'operation_summary' => 'Creazione PEI',
        ]);

        return response()->json($pei->fresh()->load(['objectives.responsibleStaffMember', 'objectives.progressLogs.actor', 'historyEntries.actor', 'signedBy']), 201);
    }

    public function updatePei(UpdateMinorPeiRequest $request, Minor $minor, MinorPei $pei): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        abort_unless($pei->minor_id === $minor->id, 404);

        $payload = [
            ...$request->validated(),
            'updated_by_user_id' => $request->user()?->id,
        ];

        if ($request->filled('signed_at') && ! $pei->signed_by_user_id) {
            $payload['signed_by_user_id'] = $request->user()?->id;
        }

        $pei->fill($payload)->save();

        $this->minorHistoryService->record($minor, 'minor_pei_updated', $request->user(), [
            'pei_id' => $pei->id,
            'operation_summary' => sprintf(
                '%s ha aggiornato il PEI %s del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $pei->title,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'update', 'minor_pei', (string) $pei->id, $pei->title, [
            'pei_id' => $pei->id,
            'status' => $pei->status,
            'digital_signature_status' => $pei->digital_signature_status,
        ]);
        $this->minorPeiHistoryService->recordPeiEvent($pei->fresh()->load(['objectives.responsibleStaffMember.qualificationLookup', 'signedBy']), 'minor_pei_updated', $request->user(), [
            'operation_summary' => 'Aggiornamento PEI',
        ]);

        return response()->json($pei->fresh()->load(['objectives.responsibleStaffMember', 'objectives.progressLogs.actor', 'historyEntries.actor', 'signedBy']));
    }

    public function storePeiObjective(StoreMinorPeiObjectiveRequest $request, Minor $minor, MinorPei $pei): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        abort_unless($pei->minor_id === $minor->id, 404);

        $objective = $pei->objectives()->create([
            ...$request->validated(),
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $this->minorHistoryService->record($minor, 'minor_pei_objective_created', $request->user(), [
            'pei_id' => $pei->id,
            'objective_id' => $objective->id,
            'operation_summary' => sprintf(
                '%s ha aggiunto l\'obiettivo PEI %s al minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $objective->title,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'create', 'minor_pei_objective', (string) $objective->id, $objective->title, [
            'pei_id' => $pei->id,
            'objective_id' => $objective->id,
            'progress_percent' => $objective->progress_percent,
        ]);
        $freshObjective = $objective->fresh()->load('responsibleStaffMember.qualificationLookup');
        $this->minorPeiHistoryService->recordObjectiveProgress($freshObjective, $request->user(), 'Creazione obiettivo PEI');
        $this->minorPeiHistoryService->recordPeiEvent($pei->fresh()->load(['objectives.responsibleStaffMember.qualificationLookup', 'signedBy']), 'minor_pei_objective_created', $request->user(), [
            'objective_id' => $objective->id,
            'operation_summary' => 'Creazione obiettivo PEI',
        ]);

        return response()->json($freshObjective->load('progressLogs.actor'), 201);
    }

    public function updatePeiObjective(UpdateMinorPeiObjectiveRequest $request, Minor $minor, MinorPei $pei, MinorPeiObjective $objective): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        abort_unless($pei->minor_id === $minor->id, 404);
        abort_unless($objective->minor_pei_id === $pei->id, 404);

        $objective->fill([
            ...$request->validated(),
            'updated_by_user_id' => $request->user()?->id,
        ])->save();

        $this->minorHistoryService->record($minor, 'minor_pei_objective_updated', $request->user(), [
            'pei_id' => $pei->id,
            'objective_id' => $objective->id,
            'operation_summary' => sprintf(
                '%s ha aggiornato l\'obiettivo PEI %s del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $objective->title,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'update', 'minor_pei_objective', (string) $objective->id, $objective->title, [
            'pei_id' => $pei->id,
            'objective_id' => $objective->id,
            'progress_percent' => $objective->progress_percent,
            'status' => $objective->status,
        ]);
        $freshObjective = $objective->fresh()->load('responsibleStaffMember.qualificationLookup');
        $this->minorPeiHistoryService->recordObjectiveProgress($freshObjective, $request->user(), 'Aggiornamento avanzamento obiettivo PEI');
        $this->minorPeiHistoryService->recordPeiEvent($pei->fresh()->load(['objectives.responsibleStaffMember.qualificationLookup', 'signedBy']), 'minor_pei_objective_updated', $request->user(), [
            'objective_id' => $objective->id,
            'operation_summary' => 'Aggiornamento obiettivo PEI',
        ]);

        return response()->json($freshObjective->load('progressLogs.actor'));
    }

    public function destroyPeiObjective(Request $request, Minor $minor, MinorPei $pei, MinorPeiObjective $objective): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        abort_unless($pei->minor_id === $minor->id, 404);
        abort_unless($objective->minor_pei_id === $pei->id, 404);

        $title = $objective->title;
        $objectiveId = $objective->id;
        $objective->delete();

        $this->minorHistoryService->record($minor, 'minor_pei_objective_deleted', $request->user(), [
            'pei_id' => $pei->id,
            'objective_id' => $objectiveId,
            'operation_summary' => sprintf(
                '%s ha eliminato l\'obiettivo PEI %s del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $title,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'delete', 'minor_pei_objective', (string) $objectiveId, $title, [
            'pei_id' => $pei->id,
            'objective_id' => $objectiveId,
        ]);
        $this->minorPeiHistoryService->recordPeiEvent($pei->fresh()->load(['objectives.responsibleStaffMember.qualificationLookup', 'signedBy']), 'minor_pei_objective_deleted', $request->user(), [
            'objective_id' => $objectiveId,
            'operation_summary' => 'Eliminazione obiettivo PEI',
        ]);

        return response()->json(status: 204);
    }

    public function peiHistory(Minor $minor, MinorPei $pei): JsonResponse
    {
        $this->authorizeMinorSensitiveRead(request()->user(), $minor);
        abort_unless($pei->minor_id === $minor->id, 404);

        return response()->json(
            $pei->historyEntries()
                ->with('actor:id,first_name,last_name,email')
                ->get()
        );
    }

    public function peiObjectiveProgress(Minor $minor, MinorPei $pei, MinorPeiObjective $objective): JsonResponse
    {
        $this->authorizeMinorSensitiveRead(request()->user(), $minor);
        abort_unless($pei->minor_id === $minor->id, 404);
        abort_unless($objective->minor_pei_id === $pei->id, 404);

        return response()->json(
            $objective->progressLogs()
                ->with('actor:id,first_name,last_name,email')
                ->get()
        );
    }

    public function storeNeed(StoreMinorNeedRequest $request, Minor $minor): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);

        $need = $minor->needs()->create([
            ...$request->validated(),
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $this->minorHistoryService->record($minor, 'minor_need_created', $request->user(), [
            'need_id' => $need->id,
            'operation_summary' => sprintf(
                '%s ha inserito il bisogno %s per il minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $need->title,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'create', 'minor_need', (string) $need->id, $need->title, [
            'need_id' => $need->id,
            'category_code' => $need->category_code,
            'priority' => $need->priority,
        ]);

        return response()->json($need->fresh()->load(['responsibleStaffMember.qualificationLookup', 'attachmentDocument.attachment', 'attachmentDocument.documentType']), 201);
    }

    public function listNotes(Minor $minor): JsonResponse
    {
        $this->authorizeMinorSensitiveRead(request()->user(), $minor);

        $notes = $minor->notes()
            ->with(['documentClassification', 'createdBy:id,first_name,last_name,email', 'updatedBy:id,first_name,last_name,email'])
            ->get()
            ->filter(fn (MinorNote $note) => $this->minorAccessService->canAccessDocumentClassification(
                request()->user(),
                $minor,
                (string) $note->classification_code,
                'read',
            ))
            ->values()
            ->map(fn (MinorNote $note): array => $this->serializeMinorNote($note))
            ->all();

        $this->recordMinorAudit(request(), $minor, 'read', 'minor_note_list', (string) $minor->id, 'Elenco note classificate', [
            'visible_notes' => count($notes),
        ]);

        return response()->json($notes);
    }

    public function storeNote(StoreMinorNoteRequest $request, Minor $minor): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        $classificationCode = (string) $request->validated('classification_code');
        $this->authorizeDocumentAction($request->user(), $minor->facility_id, 'read', $classificationCode);

        $note = $minor->notes()->create([
            'facility_id' => $minor->facility_id,
            'classification_code' => $classificationCode,
            'title' => $request->input('title'),
            'body_encrypted' => Crypt::encryptString((string) $request->validated('body')),
            'is_encrypted' => true,
            'created_by_user_id' => $request->user()?->id,
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $this->minorHistoryService->record($minor, 'minor_note_created', $request->user(), [
            'minor_note_id' => $note->id,
            'classification' => $classificationCode,
            'operation_summary' => sprintf(
                '%s ha creato una nota %s per il minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $classificationCode,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'create', 'minor_note', (string) $note->id, $note->title ?: 'Nota classificata', [
            'minor_note_id' => $note->id,
            'classification_code' => $classificationCode,
        ]);

        return response()->json($this->serializeMinorNote($note->fresh()->load(['documentClassification', 'createdBy:id,first_name,last_name,email', 'updatedBy:id,first_name,last_name,email'])), 201);
    }

    public function updateNote(UpdateMinorNoteRequest $request, Minor $minor, MinorNote $note): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        abort_unless($note->minor_id === $minor->id, 404);

        $classificationCode = (string) ($request->input('classification_code') ?: $note->classification_code);
        $this->authorizeDocumentAction($request->user(), $minor->facility_id, 'read', $classificationCode);

        $note->fill([
            'classification_code' => $classificationCode,
            'title' => $request->exists('title') ? $request->input('title') : $note->title,
            'updated_by_user_id' => $request->user()?->id,
        ]);

        if ($request->filled('body')) {
            $note->body_encrypted = Crypt::encryptString((string) $request->input('body'));
            $note->is_encrypted = true;
        }

        $note->save();

        $this->minorHistoryService->record($minor, 'minor_note_updated', $request->user(), [
            'minor_note_id' => $note->id,
            'classification' => $classificationCode,
            'operation_summary' => sprintf(
                '%s ha aggiornato una nota %s del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $classificationCode,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'update', 'minor_note', (string) $note->id, $note->title ?: 'Nota classificata', [
            'minor_note_id' => $note->id,
            'classification_code' => $classificationCode,
        ]);

        return response()->json($this->serializeMinorNote($note->fresh()->load(['documentClassification', 'createdBy:id,first_name,last_name,email', 'updatedBy:id,first_name,last_name,email'])));
    }

    public function destroyNote(Request $request, Minor $minor, MinorNote $note): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        abort_unless($note->minor_id === $minor->id, 404);

        $title = $note->title ?: 'Nota classificata';
        $id = $note->id;
        $classificationCode = $note->classification_code;
        $note->delete();

        $this->minorHistoryService->record($minor, 'minor_note_deleted', $request->user(), [
            'minor_note_id' => $id,
            'classification' => $classificationCode,
            'operation_summary' => sprintf(
                '%s ha eliminato una nota %s del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $classificationCode,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'delete', 'minor_note', (string) $id, $title, [
            'minor_note_id' => $id,
            'classification_code' => $classificationCode,
        ]);

        return response()->json(status: 204);
    }

    public function updateNeed(UpdateMinorNeedRequest $request, Minor $minor, MinorNeed $need): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        abort_unless($need->minor_id === $minor->id, 404);

        $need->fill([
            ...$request->validated(),
            'updated_by_user_id' => $request->user()?->id,
        ])->save();

        $this->minorHistoryService->record($minor, 'minor_need_updated', $request->user(), [
            'need_id' => $need->id,
            'operation_summary' => sprintf(
                '%s ha aggiornato il bisogno %s del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $need->title,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'update', 'minor_need', (string) $need->id, $need->title, [
            'need_id' => $need->id,
            'category_code' => $need->category_code,
            'priority' => $need->priority,
            'status' => $need->status,
        ]);

        return response()->json($need->fresh()->load(['responsibleStaffMember.qualificationLookup', 'attachmentDocument.attachment', 'attachmentDocument.documentType']));
    }

    public function destroyNeed(Request $request, Minor $minor, MinorNeed $need): JsonResponse
    {
        $this->authorizeMinorSensitiveWrite($request->user(), $minor);
        abort_unless($need->minor_id === $minor->id, 404);

        $title = $need->title;
        $id = $need->id;
        $need->delete();

        $this->minorHistoryService->record($minor, 'minor_need_deleted', $request->user(), [
            'need_id' => $id,
            'operation_summary' => sprintf(
                '%s ha eliminato il bisogno %s del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $title,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->recordMinorAudit($request, $minor, 'delete', 'minor_need', (string) $id, $title, [
            'need_id' => $id,
        ]);

        return response()->json(status: 204);
    }

    public function storeContact(StoreMinorContactRequest $request, Minor $minor): JsonResponse
    {
        $this->authorizeMinorAccess($request->user(), $minor, 'minor_contacts.create', 'Accesso contatti minore non consentito.');

        $contact = $minor->contacts()->create($request->validated());
        $this->minorHistoryService->record($minor, 'minor_contact_created', $request->user(), [
            'contact_id' => $contact->id,
        ]);

        return response()->json($contact->load(['contactType', 'city.province.region.country']), 201);
    }

    public function updateContact(UpdateMinorContactRequest $request, Minor $minor, MinorContact $contact): JsonResponse
    {
        $this->authorizeMinorAccess($request->user(), $minor, 'minor_contacts.update', 'Accesso contatti minore non consentito.');

        abort_unless($contact->minor_id === $minor->id, 404);

        $contact->fill($request->validated());
        $contact->save();
        $this->minorHistoryService->record($minor, 'minor_contact_updated', $request->user(), [
            'contact_id' => $contact->id,
        ]);

        return response()->json($contact->load(['contactType', 'city.province.region.country']));
    }

    public function history(Minor $minor): JsonResponse
    {
        $this->authorizeMinorSensitiveRead(request()->user(), $minor);

        $this->minorHistoryService->recordAccess($minor, 'minor_history_viewed', request()->user(), [
            'ip_address' => request()->ip(),
            'operation_summary' => sprintf(
                '%s ha visualizzato lo storico del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName(request()->user()),
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);

        $this->auditLogService->record(request(), [
            'facility_id' => $minor->facility_id,
            'minor_id' => $minor->id,
            'action' => 'read',
            'resource_type' => 'minor_history',
            'resource_id' => (string) $minor->id,
            'resource_label' => $minor->internal_code,
            'operation_summary' => sprintf(
                '%s ha visualizzato lo storico del minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName(request()->user()),
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
        ]);
        $this->auditLogService->markHandled(request());

        return response()->json(
            $minor->historyEntries()->with('actor:id,first_name,last_name,email')->get()
        );
    }

    public function storeDocument(StoreMinorDocumentRequest $request, Minor $minor): JsonResponse
    {
        $classificationCode = (string) ($request->input('classification_code') ?: $request->input('classification', 'restricted'));
        $this->authorizeDocumentAction($request->user(), $minor->facility_id, 'upload', $classificationCode);

        $file = $request->file('file');
        $this->assertDocumentUploadSecurity($file->getClientMimeType() ?: 'application/octet-stream', (int) $file->getSize());
        $disk = config('filesystems.default', 's3');
        $bucket = (string) config("filesystems.disks.{$disk}.bucket", '');
        $extension = $file->getClientOriginalExtension();
        $path = sprintf(
            '%s/minors/%d/documents/%s%s',
            trim((string) config('document_security.quarantine_prefix', 'quarantine'), '/'),
            $minor->id,
            (string) Str::uuid(),
            $extension ? '.'.$extension : ''
        );

        $sha256 = hash_file('sha256', $file->getRealPath());

        $document = DB::transaction(function () use ($request, $minor, $file, $disk, $bucket, $path, $sha256, $classificationCode) {
            Storage::disk($disk)->put($path, file_get_contents($file->getRealPath()));

            $attachment = Attachment::query()->create([
                'facility_id' => $minor->facility_id,
                'owner_type' => Minor::class,
                'owner_id' => $minor->id,
                'document_type_id' => $request->integer('document_type_id'),
                'disk' => $disk,
                'bucket' => $bucket,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType() ?: 'application/octet-stream',
                'size_bytes' => $file->getSize(),
                'sha256' => $sha256,
                'is_encrypted' => true,
                'security_status' => 'pending',
                'quarantined_at' => now(),
                'uploaded_by_user_id' => $request->user()?->id,
            ]);

            return MinorDocument::query()->create([
                'minor_id' => $minor->id,
                'document_type_id' => $request->integer('document_type_id'),
                'attachment_id' => $attachment->id,
                'label' => $request->input('label'),
                'document_issuer_id' => $request->input('document_issuer_id') ?: null,
                'issued_by' => $request->input('issued_by'),
                'issue_date' => $request->input('issue_date'),
                'expiry_date' => $request->input('expiry_date'),
                'classification_code' => $classificationCode,
                'classification' => $classificationCode,
            ]);
        });

        $this->minorHistoryService->record($minor, 'minor_document_uploaded', $request->user(), [
            'minor_document_id' => $document->id,
            'attachment_id' => $document->attachment_id,
            'security_status' => 'pending',
        ]);

        ScanAttachmentJob::dispatch($document->attachment_id);

        return response()->json(
            $document->load(['documentType', 'attachment', 'documentClassification', 'documentIssuer']),
            201
        );
    }

    public function listDocuments(Minor $minor): JsonResponse
    {
        $this->authorizeMinorAccess(request()->user(), $minor, 'attachments.read', 'Accesso documenti minore non consentito.');

        $query = $minor->documents()
            ->with(['documentType', 'documentIssuer', 'documentClassification', 'attachment'])
            ->when(
                request()->filled('document_type_code'),
                fn ($builder) => $builder->whereHas('documentType', fn ($documentTypeQuery) => $documentTypeQuery->where('code', (string) request()->input('document_type_code')))
            )
            ->when(
                request()->boolean('medical_only'),
                fn ($builder) => $builder->whereHas('documentType', fn ($documentTypeQuery) => $documentTypeQuery->whereIn('code', ['MEDICAL_REPORT']))
            );

        $documents = $query->get()
            ->filter(fn (MinorDocument $document) => $this->minorAccessService->canAccessDocumentClassification(
                request()->user(),
                $minor,
                (string) ($document->classification_code ?: $document->classification),
                'read',
            ))
            ->values();

        return response()->json($documents);
    }

    public function caseOptions(Minor $minor): JsonResponse
    {
        $this->authorizeMinorSensitiveRead(request()->user(), $minor);

        $originFacilities = \App\Models\Facility::query()
            ->with(['organization', 'city.province.region.country', 'statusLookup'])
            ->orderBy('name')
            ->get();

        $judicialAuthorities = DocumentIssuer::query()
            ->where('is_active', true)
            ->where('code', 'TRIBUNALE')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $healthAuthorities = DocumentIssuer::query()
            ->where('is_active', true)
            ->where('code', 'ASL')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $generalPractitioners = StaffMember::query()
            ->with(['qualificationLookup', 'facility.organization'])
            ->where('facility_id', $minor->facility_id)
            ->whereIn('qualification_code', ['MEDICO_BASE', 'PEDIATRA'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $pediatricians = StaffMember::query()
            ->with(['qualificationLookup', 'facility.organization'])
            ->where('facility_id', $minor->facility_id)
            ->where('qualification_code', 'PEDIATRA')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $vaccinationDocuments = $minor->documents()
            ->with(['documentType', 'documentIssuer', 'documentClassification', 'attachment'])
            ->whereHas('documentType', fn ($query) => $query->where('code', 'MEDICAL_REPORT'))
            ->get()
            ->filter(fn (MinorDocument $document) => $this->minorAccessService->canAccessDocumentClassification(
                request()->user(),
                $minor,
                (string) ($document->classification_code ?: $document->classification),
                'read',
            ))
            ->values();

        return response()->json([
            'minor_id' => $minor->id,
            'facility_id' => $minor->facility_id,
            'origin_facilities' => $originFacilities,
            'judicial_authorities' => $judicialAuthorities,
            'health_authorities' => $healthAuthorities,
            'general_practitioners' => $generalPractitioners,
            'pediatricians' => $pediatricians,
            'vaccination_documents' => $vaccinationDocuments,
        ]);
    }

    public function downloadDocument(Minor $minor, MinorDocument $document)
    {
        abort_unless($document->minor_id === $minor->id, 404);
        $classificationCode = (string) ($document->classification_code ?: $document->classification);
        $this->authorizeDocumentAction(request()->user(), $minor->facility_id, 'download', $classificationCode);

        $attachment = $document->attachment()->firstOrFail();

        if ($attachment->security_status !== 'clean') {
            throw new HttpException(423, 'Documento non disponibile: verifica di sicurezza non completata o non superata.');
        }

        $summary = sprintf(
            '%s ha scaricato il documento %s del minore %s %s (%s).',
            $this->auditLogService->resolveActorDisplayName(request()->user()),
            $attachment->original_name,
            $minor->first_name,
            $minor->last_name,
            $minor->internal_code
        );

        $this->minorHistoryService->recordAccess($minor, 'minor_document_downloaded', request()->user(), [
            'minor_document_id' => $document->id,
            'attachment_id' => $attachment->id,
            'document_name' => $attachment->original_name,
            'classification' => $classificationCode,
            'ip_address' => request()->ip(),
            'operation_summary' => $summary,
        ]);

        $this->auditLogService->record(request(), [
            'facility_id' => $minor->facility_id,
            'minor_id' => $minor->id,
            'action' => 'download',
            'resource_type' => 'minor_document_download',
            'resource_id' => (string) $document->id,
            'resource_label' => $attachment->original_name,
            'operation_summary' => $summary,
            'new_values_json' => [
                'minor_document_id' => $document->id,
                'attachment_id' => $attachment->id,
                'classification' => $classificationCode,
            ],
        ]);
        $this->auditLogService->markHandled(request());

        return Storage::disk($attachment->disk)->download($attachment->path, $attachment->original_name);
    }

    public function previewDocument(Minor $minor, MinorDocument $document)
    {
        abort_unless($document->minor_id === $minor->id, 404);
        $classificationCode = (string) ($document->classification_code ?: $document->classification);
        $this->authorizeDocumentAction(request()->user(), $minor->facility_id, 'read', $classificationCode);

        $attachment = $document->attachment()->firstOrFail();

        if ($attachment->security_status !== 'clean') {
            throw new HttpException(423, 'Documento non disponibile: verifica di sicurezza non completata o non superata.');
        }

        $summary = sprintf(
            '%s ha visualizzato il documento %s del minore %s %s (%s).',
            $this->auditLogService->resolveActorDisplayName(request()->user()),
            $attachment->original_name,
            $minor->first_name,
            $minor->last_name,
            $minor->internal_code
        );

        $this->minorHistoryService->recordAccess($minor, 'minor_document_viewed', request()->user(), [
            'minor_document_id' => $document->id,
            'attachment_id' => $attachment->id,
            'document_name' => $attachment->original_name,
            'classification' => $classificationCode,
            'ip_address' => request()->ip(),
            'operation_summary' => $summary,
        ]);

        $this->auditLogService->record(request(), [
            'facility_id' => $minor->facility_id,
            'minor_id' => $minor->id,
            'action' => 'read',
            'resource_type' => 'minor_document_preview',
            'resource_id' => (string) $document->id,
            'resource_label' => $attachment->original_name,
            'operation_summary' => $summary,
            'new_values_json' => [
                'minor_document_id' => $document->id,
                'attachment_id' => $attachment->id,
                'classification' => $classificationCode,
                'mime_type' => $attachment->mime_type,
            ],
        ]);
        $this->auditLogService->markHandled(request());

        return Storage::disk($attachment->disk)->response(
            $attachment->path,
            $attachment->original_name,
            [
                'Content-Type' => $attachment->mime_type ?: 'application/octet-stream',
                'Content-Disposition' => 'inline; filename="'.$attachment->original_name.'"',
            ]
        );
    }

    public function previewDocumentStructured(Minor $minor, MinorDocument $document): JsonResponse
    {
        abort_unless($document->minor_id === $minor->id, 404);
        $classificationCode = (string) ($document->classification_code ?: $document->classification);
        $this->authorizeDocumentAction(request()->user(), $minor->facility_id, 'read', $classificationCode);

        $attachment = $document->attachment()->firstOrFail();

        if ($attachment->security_status !== 'clean') {
            throw new HttpException(423, 'Documento non disponibile: verifica di sicurezza non completata o non superata.');
        }

        if (! $this->spreadsheetPreviewService->canRender($attachment->mime_type, $attachment->original_name)) {
            throw new HttpException(422, 'Anteprima strutturata disponibile solo per file XLSX.');
        }

        $summary = sprintf(
            '%s ha visualizzato la preview strutturata del documento %s del minore %s %s (%s).',
            $this->auditLogService->resolveActorDisplayName(request()->user()),
            $attachment->original_name,
            $minor->first_name,
            $minor->last_name,
            $minor->internal_code
        );

        $this->minorHistoryService->recordAccess($minor, 'minor_document_structured_preview_viewed', request()->user(), [
            'minor_document_id' => $document->id,
            'attachment_id' => $attachment->id,
            'document_name' => $attachment->original_name,
            'classification' => $classificationCode,
            'ip_address' => request()->ip(),
            'operation_summary' => $summary,
        ]);

        $this->auditLogService->record(request(), [
            'facility_id' => $minor->facility_id,
            'minor_id' => $minor->id,
            'action' => 'read',
            'resource_type' => 'minor_document_preview_structured',
            'resource_id' => (string) $document->id,
            'resource_label' => $attachment->original_name,
            'operation_summary' => $summary,
            'new_values_json' => [
                'minor_document_id' => $document->id,
                'attachment_id' => $attachment->id,
                'classification' => $classificationCode,
                'mime_type' => $attachment->mime_type,
                'preview_mode' => 'structured_spreadsheet',
            ],
        ]);
        $this->auditLogService->markHandled(request());

        return response()->json(
            $this->spreadsheetPreviewService->buildFromAttachment($attachment)
        );
    }

    private function assertDocumentUploadSecurity(string $mimeType, int $sizeBytes): void
    {
        $allowedMimeTypes = config('document_security.allowed_mime_types', []);
        $maxSizeBytes = (int) config('document_security.max_upload_size_bytes', 0);

        if ($allowedMimeTypes !== [] && ! in_array($mimeType, $allowedMimeTypes, true)) {
            throw new HttpException(422, 'Mime type del documento non consentito.');
        }

        if ($maxSizeBytes > 0 && $sizeBytes > $maxSizeBytes) {
            throw new HttpException(422, 'Dimensione documento superiore al limite consentito.');
        }
    }

    private function authorizeDocumentAction($user, int $facilityId, string $action, string $classification): void
    {
        $minor = request()->route('minor');

        if (! $user || ! $user->hasPermission("attachments.{$action}", $facilityId)) {
            throw new HttpException(403, 'Permesso documentale insufficiente.');
        }

        $classificationRules = DocumentClassification::query()
            ->where('is_active', true)
            ->where('code', $classification)
            ->first();

        if (! $classificationRules) {
            $classificationRules = collect(config('document_classifications', []))
                ->firstWhere('code', $classification);
        }

        $allowedRoles = $classificationRules instanceof DocumentClassification
            ? ($classificationRules->allowed_role_codes ?? null)
            : ($classificationRules['allowed_roles'] ?? null);

        if (is_array($allowedRoles) && ! $user->hasRoleIn($allowedRoles)) {
            throw new HttpException(403, 'Classificazione documentale non consentita per il ruolo corrente.');
        }

        if ($minor instanceof Minor && ! $this->minorAccessService->canAccessDocumentClassification($user, $minor, $classification, $action)) {
            throw new HttpException(403, 'Accesso ABAC negato: il ruolo è valido ma l’utente non è assegnato al minore per questa risorsa documentale.');
        }
    }

    private function authorizeMinorRead($user, Minor $minor): void
    {
        $this->authorizeMinorAccess($user, $minor, 'minors.read', 'Accesso al minore non consentito.');
    }

    private function authorizeMinorSensitiveRead($user, Minor $minor): void
    {
        $this->authorizeMinorAccess($user, $minor, 'minor_profiles.read', 'Accesso sensibile al minore non consentito.');
    }

    private function authorizeMinorWrite($user, Minor $minor): void
    {
        $this->authorizeMinorAccess($user, $minor, 'minors.update', 'Modifica minore non consentita.');
    }

    private function authorizeMinorSensitiveWrite($user, Minor $minor): void
    {
        $this->authorizeMinorAccess($user, $minor, 'minor_profiles.update', 'Accesso sensibile al minore non consentito.');
    }

    private function authorizeMinorAccess($user, Minor $minor, string $permission, string $message): void
    {
        if (! $user || ! $this->minorAccessService->canAccessMinor($user, $minor, $permission)) {
            throw new HttpException(403, $message);
        }
    }

    private function recordMinorAudit(Request $request, Minor $minor, string $action, string $resourceType, string $resourceId, string $resourceLabel, array $newValues = []): void
    {
        $this->auditLogService->record($request, [
            'facility_id' => $minor->facility_id,
            'minor_id' => $minor->id,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'resource_label' => $resourceLabel,
            'operation_summary' => sprintf(
                '%s ha eseguito %s su %s per il minore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $action,
                $resourceLabel,
                $minor->first_name,
                $minor->last_name,
                $minor->internal_code
            ),
            'new_values_json' => $newValues ?: null,
        ]);
        $this->auditLogService->markHandled($request);
    }

    private function serializeMinorNote(MinorNote $note): array
    {
        return [
            'id' => $note->id,
            'minor_id' => $note->minor_id,
            'facility_id' => $note->facility_id,
            'classification_code' => $note->classification_code,
            'classification_label' => $note->documentClassification?->name,
            'document_classification' => $note->documentClassification,
            'title' => $this->normalizeUtf8($note->title),
            'body' => $this->normalizeUtf8($note->body),
            'is_encrypted' => (bool) $note->is_encrypted,
            'created_at' => optional($note->created_at)?->toISOString(),
            'updated_at' => optional($note->updated_at)?->toISOString(),
            'created_by' => $note->createdBy ? [
                'id' => $note->createdBy->id,
                'display_name' => $this->normalizeUtf8(trim($note->createdBy->first_name.' '.$note->createdBy->last_name) ?: $note->createdBy->email),
                'email' => $this->normalizeUtf8($note->createdBy->email),
            ] : null,
            'updated_by' => $note->updatedBy ? [
                'id' => $note->updatedBy->id,
                'display_name' => $this->normalizeUtf8(trim($note->updatedBy->first_name.' '.$note->updatedBy->last_name) ?: $note->updatedBy->email),
                'email' => $this->normalizeUtf8($note->updatedBy->email),
            ] : null,
        ];
    }
}
