<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Journals\StoreMinorJournalEntryRequest;
use App\Http\Requests\Journals\UpdateMinorJournalEntryRequest;
use App\Models\Minor;
use App\Models\MinorJournalEntry;
use App\Services\AuditLogService;
use App\Services\MinorAccessService;
use App\Services\MinorHistoryService;
use App\Services\MinorPeiHistoryService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function show(MinorJournalEntry $journal): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor(request()->user(), $journal->minor, 'minor_journals.read'), 403, 'Accesso diario non consentito.');

        return response()->json($this->loadEntry($journal));
    }

    public function update(UpdateMinorJournalEntryRequest $request, MinorJournalEntry $journal): JsonResponse
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $journal->minor, 'minor_journals.update'), 403, 'Aggiornamento diario non consentito.');

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
            'minor.minorStatus',
            'journalEntryType',
            'peiObjective.pei',
            'handoverReadBy:id,first_name,last_name,email',
            'createdBy:id,first_name,last_name,email',
            'updatedBy:id,first_name,last_name,email',
        ];
    }
}
