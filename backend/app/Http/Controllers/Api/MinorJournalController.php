<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Journals\StoreMinorJournalEntryRequest;
use App\Http\Requests\Journals\StoreMinorJournalShiftRequest;
use App\Http\Requests\Journals\CloseMinorJournalShiftRequest;
use App\Http\Requests\Journals\UpdateMinorJournalEntryRequest;
use App\Models\MinorJournalShift;
use App\Models\Minor;
use App\Models\MinorJournalEntry;
use App\Services\AuditLogService;
use App\Services\MinorAccessService;
use App\Services\MinorHistoryService;
use App\Services\MinorPeiHistoryService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MinorJournalController extends Controller
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
        $query = MinorJournalEntry::query()
            ->with($this->baseRelations())
            ->orderByDesc('observed_at')
            ->orderByDesc('id');

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('minor_id')) {
            $query->where('minor_id', $request->integer('minor_id'));
        }

        if ($request->filled('journal_entry_type_id')) {
            $query->where('journal_entry_type_id', $request->integer('journal_entry_type_id'));
        }

        if ($request->filled('priority_level')) {
            $query->where('priority_level', (string) $request->input('priority_level'));
        }

        if ($request->filled('mood_level')) {
            $query->where('mood_level', (string) $request->input('mood_level'));
        }

        if ($request->has('handover_required')) {
            $query->where('handover_required', $request->boolean('handover_required'));
        }

        if ($request->filled('pei_objective_id')) {
            $query->where('pei_objective_id', $request->integer('pei_objective_id'));
        }

        if ($request->filled('minor_journal_shift_id')) {
            $query->where('minor_journal_shift_id', $request->integer('minor_journal_shift_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('observed_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('observed_at', '<=', $request->input('date_to'));
        }

        if ($request->boolean('handover_pending')) {
            $query->where('handover_required', true)->whereNull('handover_read_at');
        }

        if ($request->filled('search')) {
            $this->applySearch($query, (string) $request->input('search'));
        }

        if ($request->user()) {
            $query->whereHas('minor', fn (Builder $minorQuery) => $this->minorAccessService->scopeVisibleMinorsForUser($minorQuery, $request->user()));
        }

        return response()->json($query->get());
    }

    public function summary(Request $request): JsonResponse
    {
        $query = MinorJournalEntry::query();

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('minor_id')) {
            $query->where('minor_id', $request->integer('minor_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('observed_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('observed_at', '<=', $request->date('date_to'));
        }

        if ($request->user()) {
            $query->whereHas('minor', fn (Builder $minorQuery) => $this->minorAccessService->scopeVisibleMinorsForUser($minorQuery, $request->user()));
        }

        $items = $query->get();
        $moodLevels = config('journals.mood_levels', []);

        return response()->json([
            'summary' => [
                'total' => $items->count(),
                'green' => $items->where('priority_level', 'green')->count(),
                'yellow' => $items->where('priority_level', 'yellow')->count(),
                'red' => $items->where('priority_level', 'red')->count(),
                'follow_up_required' => $items->where('follow_up_required', true)->count(),
                'handover_required' => $items->where('handover_required', true)->count(),
                'handover_pending' => $items->filter(fn (MinorJournalEntry $entry) => $entry->handover_required && ! $entry->handover_read_at)->count(),
                'pei_linked' => $items->whereNotNull('pei_objective_id')->count(),
            ],
            'daily_series' => $items
                ->groupBy(fn (MinorJournalEntry $entry) => optional($entry->observed_at)?->format('Y-m-d'))
                ->filter(fn ($group, $day) => filled($day))
                ->map(function ($group, string $day) use ($moodLevels): array {
                    $moods = $group
                        ->map(fn (MinorJournalEntry $entry) => $moodLevels[$entry->mood_level] ?? null)
                        ->filter(fn ($value) => $value !== null)
                        ->values();

                    return [
                        'day' => $day,
                        'total' => $group->count(),
                        'avg_mood_score' => $moods->isEmpty() ? null : round($moods->avg(), 2),
                    ];
                })
                ->values(),
        ]);
    }

    public function store(StoreMinorJournalEntryRequest $request): JsonResponse
    {
        $minor = Minor::query()->findOrFail($request->integer('minor_id'));
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $minor, 'minor_journals.create'), 403, 'Creazione diario non consentita per questo minore.');

        $entry = MinorJournalEntry::query()->create([
            ...$request->validated(),
            'facility_id' => $minor->facility_id,
            'priority_level' => $request->input('priority_level', 'green'),
            'follow_up_required' => $request->boolean('follow_up_required', false),
            'handover_required' => $request->boolean('handover_required', false),
            'created_by_user_id' => $request->user()?->id,
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $loaded = $this->loadEntry($entry);

        $this->minorHistoryService->record($minor, 'minor_journal_entry_created', $request->user(), [
            'minor_journal_entry_id' => $loaded->id,
            'title' => $loaded->title,
            'pei_objective_id' => $loaded->pei_objective_id,
            'operation_summary' => sprintf(
                '%s ha creato una voce di diario per il minore %s %s: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $minor->first_name,
                $minor->last_name,
                $loaded->title
            ),
        ]);

        if ($loaded->peiObjective) {
            $this->minorPeiHistoryService->recordObjectiveProgress(
                $loaded->peiObjective,
                $request->user(),
                sprintf('Diario educativo collegato: %s [%s].', $loaded->title, $loaded->priority_level ?? 'green'),
                'minor_journal_entry',
                (string) $loaded->id,
                $loaded->title,
            );
        }

        $this->auditLogService->record($request, [
            'facility_id' => $minor->facility_id,
            'minor_id' => $minor->id,
            'action' => 'create',
            'resource_type' => 'minor_journal_entry',
            'resource_id' => (string) $loaded->id,
            'resource_label' => $loaded->title,
            'operation_summary' => sprintf(
                '%s ha creato la voce di diario #%d del minore %s %s: %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $loaded->id,
                $minor->first_name,
                $minor->last_name,
                $loaded->title
            ),
            'new_values_json' => [
                'priority_level' => $loaded->priority_level,
                'mood_level' => $loaded->mood_level,
                'follow_up_required' => $loaded->follow_up_required,
                'handover_required' => $loaded->handover_required,
                'pei_objective_id' => $loaded->pei_objective_id,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($loaded, 201);
    }

    public function shifts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'status' => ['nullable', 'in:open,closed'],
        ]);

        abort_unless($request->user()->hasPermission('minor_journals.read', (int) $validated['facility_id']), 403, 'Accesso ai turni diario non consentito per questa struttura.');

        $query = MinorJournalShift::query()
            ->with($this->shiftRelations())
            ->where('facility_id', $validated['facility_id'])
            ->withCount('entries')
            ->orderByDesc('started_at');

        if (! empty($validated['date_from'])) {
            $query->whereDate('started_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $query->whereDate('started_at', '<=', $validated['date_to']);
        }

        if (($validated['status'] ?? null) === 'open') {
            $query->whereNull('closed_at');
        }

        if (($validated['status'] ?? null) === 'closed') {
            $query->whereNotNull('closed_at');
        }

        return response()->json($query->get());
    }

    public function storeShift(StoreMinorJournalShiftRequest $request): JsonResponse
    {
        $facilityId = $request->integer('facility_id');
        abort_unless($request->user()->hasPermission('minor_journals.create', $facilityId), 403, 'Apertura turno diario non consentita per questa struttura.');

        $shift = MinorJournalShift::query()->create([
            ...$request->validated(),
            'opened_by_user_id' => $request->user()->id,
        ]);

        $loaded = $shift->load($this->shiftRelations())->loadCount('entries');
        $this->auditLogService->record($request, [
            'facility_id' => $facilityId,
            'action' => 'create',
            'resource_type' => 'minor_journal_shift',
            'resource_id' => (string) $loaded->id,
            'resource_label' => $loaded->title ?? 'Turno diario #'.$loaded->id,
            'operation_summary' => sprintf('%s ha aperto il turno diario #%d.', $this->auditLogService->resolveActorDisplayName($request->user()), $loaded->id),
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($loaded, 201);
    }

    public function closeShift(CloseMinorJournalShiftRequest $request, MinorJournalShift $shift): JsonResponse
    {
        abort_unless($request->user()->hasPermission('minor_journals.update', $shift->facility_id), 403, 'Chiusura turno diario non consentita per questa struttura.');
        abort_if($shift->closed_at, 422, 'Il turno e gia chiuso e firmato.');
        abort_if($request->date('ended_at')->lessThan($shift->started_at), 422, 'La fine turno non puo essere precedente all inizio turno.');

        $shift->update([
            'ended_at' => $request->date('ended_at'),
            'closing_notes' => $request->input('closing_notes'),
            'closed_at' => now(),
            'closed_by_user_id' => $request->user()->id,
            'closure_signature_type' => 'authenticated_application_signature',
        ]);

        $loaded = $shift->fresh()->load($this->shiftRelations())->loadCount('entries');
        $this->auditLogService->record($request, [
            'facility_id' => $loaded->facility_id,
            'action' => 'sign',
            'resource_type' => 'minor_journal_shift',
            'resource_id' => (string) $loaded->id,
            'resource_label' => $loaded->title ?? 'Turno diario #'.$loaded->id,
            'operation_summary' => sprintf('%s ha chiuso e firmato applicativamente il turno diario #%d.', $this->auditLogService->resolveActorDisplayName($request->user()), $loaded->id),
            'new_values_json' => ['closed_at' => $loaded->closed_at?->toIso8601String(), 'signature_type' => $loaded->closure_signature_type],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($loaded);
    }

    public function acknowledgeHandover(Request $request, MinorJournalEntry $journal): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $journal->minor, 'minor_journals.read'), 403, 'Presa visione diario non consentita per questo minore.');
        abort_if(! $journal->handover_required, 422, 'Questa voce non richiede una presa visione.');
        abort_if($journal->handover_read_at, 422, 'La presa visione e gia stata registrata.');

        $journal->update([
            'handover_read_at' => now(),
            'handover_read_by_user_id' => $request->user()->id,
            'updated_by_user_id' => $request->user()->id,
        ]);

        $loaded = $this->loadEntry($journal->fresh());
        $this->minorHistoryService->record($loaded->minor, 'minor_journal_handover_acknowledged', $request->user(), [
            'minor_journal_entry_id' => $loaded->id,
            'title' => $loaded->title,
        ]);
        $this->auditLogService->record($request, [
            'facility_id' => $loaded->facility_id,
            'minor_id' => $loaded->minor_id,
            'action' => 'acknowledge',
            'resource_type' => 'minor_journal_handover',
            'resource_id' => (string) $loaded->id,
            'resource_label' => $loaded->title,
            'operation_summary' => sprintf('%s ha preso visione della consegna della voce diario #%d del minore %s %s.', $this->auditLogService->resolveActorDisplayName($request->user()), $loaded->id, $loaded->minor->first_name, $loaded->minor->last_name),
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($loaded);
    }

    public function show(MinorJournalEntry $journal): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor(request()->user(), $journal->minor, 'minor_journals.read'), 403, 'Accesso diario non consentito.');

        return response()->json($this->loadEntry($journal));
    }

    public function update(UpdateMinorJournalEntryRequest $request, MinorJournalEntry $journal): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $journal->minor, 'minor_journals.update'), 403, 'Aggiornamento diario non consentito.');
        abort_if($journal->journalShift?->closed_at, 422, 'Non e possibile modificare una voce appartenente a un turno gia chiuso e firmato.');

        $before = $this->loadEntry($journal);

        $journal->update([
            ...$request->validated(),
            'priority_level' => $request->input('priority_level', $journal->priority_level ?: 'green'),
            'follow_up_required' => $request->boolean('follow_up_required', false),
            'handover_required' => $request->boolean('handover_required', false),
            'updated_by_user_id' => $request->user()?->id,
        ]);

        $loaded = $this->loadEntry($journal->fresh());

        $this->minorHistoryService->record($loaded->minor, 'minor_journal_entry_updated', $request->user(), [
            'minor_journal_entry_id' => $loaded->id,
            'title' => $loaded->title,
            'pei_objective_id' => $loaded->pei_objective_id,
        ]);

        if ($loaded->peiObjective) {
            $this->minorPeiHistoryService->recordObjectiveProgress(
                $loaded->peiObjective,
                $request->user(),
                sprintf('Diario educativo aggiornato: %s [%s].', $loaded->title, $loaded->priority_level ?? 'green'),
                'minor_journal_entry',
                (string) $loaded->id,
                $loaded->title,
            );
        }

        $this->auditLogService->record($request, [
            'facility_id' => $loaded->facility_id,
            'minor_id' => $loaded->minor_id,
            'action' => 'update',
            'resource_type' => 'minor_journal_entry',
            'resource_id' => (string) $loaded->id,
            'resource_label' => $loaded->title,
            'operation_summary' => sprintf(
                '%s ha aggiornato la voce di diario #%d del minore %s %s.',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $loaded->id,
                $loaded->minor->first_name,
                $loaded->minor->last_name
            ),
            'old_values_json' => [
                'priority_level' => $before->priority_level,
                'mood_level' => $before->mood_level,
                'follow_up_required' => $before->follow_up_required,
                'handover_required' => $before->handover_required,
                'pei_objective_id' => $before->pei_objective_id,
            ],
            'new_values_json' => [
                'priority_level' => $loaded->priority_level,
                'mood_level' => $loaded->mood_level,
                'follow_up_required' => $loaded->follow_up_required,
                'handover_required' => $loaded->handover_required,
                'pei_objective_id' => $loaded->pei_objective_id,
            ],
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($loaded);
    }

    public function destroy(MinorJournalEntry $journal): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor(request()->user(), $journal->minor, 'minor_journals.delete'), 403, 'Eliminazione diario non consentita.');
        abort_if($journal->journalShift?->closed_at, 422, 'Non e possibile eliminare una voce appartenente a un turno gia chiuso e firmato.');

        $minor = $journal->minor;
        $entryId = $journal->id;
        $journal->delete();

        $this->minorHistoryService->record($minor, 'minor_journal_entry_deleted', request()->user(), [
            'minor_journal_entry_id' => $entryId,
        ]);

        return response()->json(status: 204);
    }

    private function loadEntry(MinorJournalEntry $entry): MinorJournalEntry
    {
        return $entry->load($this->baseRelations());
    }

    private function baseRelations(): array
    {
        return [
            'facility.organization',
            'journalShift.openedBy:id,first_name,last_name,email',
            'journalShift.closedBy:id,first_name,last_name,email',
            'minor.minorStatus',
            'journalEntryType',
            'peiObjective.pei',
            'handoverReadBy:id,first_name,last_name,email',
            'createdBy:id,first_name,last_name,email',
            'updatedBy:id,first_name,last_name,email',
        ];
    }

    private function shiftRelations(): array
    {
        return [
            'facility.organization',
            'openedBy:id,first_name,last_name,email',
            'closedBy:id,first_name,last_name,email',
        ];
    }

    private function applySearch(Builder $query, string $search): void
    {
        $search = trim($search);
        if ($search === '') {
            return;
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            $query->whereRaw("to_tsvector('italian', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(nutrition_summary, '') || ' ' || coalesce(hygiene_summary, '') || ' ' || coalesce(sleep_summary, '') || ' ' || coalesce(follow_up_notes, '') || ' ' || coalesce(handover_notes, '')) @@ websearch_to_tsquery('italian', ?)", [$search]);

            return;
        }

        $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $search).'%';
        $query->where(function (Builder $searchQuery) use ($like): void {
            $searchQuery
                ->where('title', 'like', $like)
                ->orWhere('content', 'like', $like)
                ->orWhere('nutrition_summary', 'like', $like)
                ->orWhere('hygiene_summary', 'like', $like)
                ->orWhere('sleep_summary', 'like', $like)
                ->orWhere('follow_up_notes', 'like', $like)
                ->orWhere('handover_notes', 'like', $like);
        });
    }
}
