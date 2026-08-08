<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StartGeoSyncRunRequest;
use App\Models\GeoImportRun;
use App\Models\GeoSyncDecision;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;

class GeoSyncController extends Controller
{
    public function latest(): JsonResponse
    {
        $run = GeoImportRun::query()->latest('id')->first();

        if (! $run) {
            return response()->json([
                'data' => null,
            ]);
        }

        return response()->json([
            'data' => $this->transformRun($run),
        ]);
    }

    public function index(): JsonResponse
    {
        $runs = GeoImportRun::query()->latest('id')->limit(50)->get();

        return response()->json([
            'data' => $runs->map(fn (GeoImportRun $run) => $this->transformRun($run))->values(),
        ]);
    }

    public function show(GeoImportRun $run): JsonResponse
    {
        return response()->json([
            'data' => $this->transformRun($run, withSummary: true),
        ]);
    }

    public function issues(GeoImportRun $run): JsonResponse
    {
        return response()->json([
            'data' => $run->issues()
                ->latest('id')
                ->get()
                ->map(fn ($issue) => [
                    'id' => $issue->id,
                    'severity' => $issue->severity,
                    'issue_type' => $issue->issue_type,
                    'entity_level' => $issue->entity_level,
                    'source_system' => $issue->source_system,
                    'source_record_key' => $issue->source_record_key,
                    'target_table' => $issue->target_table,
                    'target_record_id' => $issue->target_record_id,
                    'message' => $issue->message,
                    'is_blocking' => (bool) $issue->is_blocking,
                    'resolved_at' => optional($issue->resolved_at)?->toISOString(),
                    'resolution_notes' => $issue->resolution_notes,
                    'details' => $issue->details_json,
                ])->values(),
        ]);
    }

    public function decisions(GeoImportRun $run): JsonResponse
    {
        return response()->json([
            'data' => GeoSyncDecision::query()
                ->where('geo_import_run_id', $run->id)
                ->latest('id')
                ->get()
                ->map(fn (GeoSyncDecision $decision) => [
                    'id' => $decision->id,
                    'entity_level' => $decision->entity_level,
                    'action' => $decision->action,
                    'target_table' => $decision->target_table,
                    'target_record_id' => $decision->target_record_id,
                    'source_system' => $decision->source_system,
                    'source_record_key' => $decision->source_record_key,
                    'reason_code' => $decision->reason_code,
                    'executed' => (bool) $decision->executed,
                    'before' => $decision->before_json,
                    'after' => $decision->after_json,
                ])->values(),
        ]);
    }

    public function store(StartGeoSyncRunRequest $request): JsonResponse
    {
        $running = GeoImportRun::query()->where('status', 'running')->exists();

        if ($running) {
            return response()->json([
                'message' => 'Un run di sincronizzazione è già in esecuzione.',
            ], 409);
        }

        $source = $request->string('source')->toString() ?: 'geonames';
        $scope = $request->string('scope')->toString() ?: ($source === 'seed' ? 'italy_admin_seed' : 'full');
        $dryRun = $request->boolean('dry_run', true);

        $exitCode = Artisan::call('familyhub:geo-sync', [
            '--source' => $source,
            '--scope' => $scope,
            '--dry-run' => $dryRun,
        ]);

        $run = GeoImportRun::query()->latest('id')->first();

        return response()->json([
            'message' => $exitCode === 0 ? 'Run di sincronizzazione completato.' : 'Run di sincronizzazione completato con errori.',
            'data' => $run ? $this->transformRun($run, withSummary: true) : null,
            'exit_code' => $exitCode,
        ], $exitCode === 0 ? 201 : 422);
    }

    public function publish(GeoImportRun $run): JsonResponse
    {
        return response()->json([
            'message' => 'Publish automatico non ancora disponibile in questa fase.',
        ], 409);
    }

    private function transformRun(GeoImportRun $run, bool $withSummary = false): array
    {
        $summary = is_array($run->summary_json) ? $run->summary_json : [];
        $durationSeconds = null;

        if ($run->started_at && $run->finished_at) {
            $durationSeconds = abs($run->finished_at->diffInSeconds($run->started_at, false));
        }

        $data = [
            'id' => $run->id,
            'run_uuid' => $run->run_uuid,
            'trigger_mode' => $run->trigger_mode,
            'scope' => $run->scope,
            'status' => $run->status,
            'started_at' => optional($run->started_at)?->toISOString(),
            'finished_at' => optional($run->finished_at)?->toISOString(),
            'duration_seconds' => $durationSeconds,
            'source_file_count' => $run->source_file_count,
            'raw_record_count' => $run->raw_record_count,
            'normalized_record_count' => $run->normalized_record_count,
            'published_record_count' => $run->published_record_count,
            'issue_count' => $run->issue_count,
            'error_count' => $run->error_count,
            'warning_count' => (int) ($summary['warning_count'] ?? 0),
            'decision_count' => GeoSyncDecision::query()->where('geo_import_run_id', $run->id)->count(),
            'sources' => array_values(array_filter([(string) ($summary['source'] ?? '')])),
            'stats' => [
                'countries_parsed' => (int) ($summary['countries_parsed'] ?? 0),
                'regions_parsed' => (int) ($summary['regions_parsed'] ?? 0),
                'provinces_parsed' => (int) ($summary['provinces_parsed'] ?? 0),
                'cities_parsed' => (int) ($summary['cities_parsed'] ?? 0),
                'valid_countries' => (int) ($summary['valid_countries'] ?? 0),
                'history_events_parsed' => (int) ($summary['history_events_parsed'] ?? 0),
            ],
        ];

        if ($withSummary) {
            $data['summary'] = $summary;
        }

        return $data;
    }
}
