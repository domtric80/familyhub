<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExecuteGeoLoadRequest;
use App\Models\GeoImportRun;
use App\Services\Geography\CanonicalGeographyLoader;
use App\Services\Geography\RawGeographyExplorer;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class GeoLoadController extends Controller
{
    private const LOADABLE_SOURCES = ['geonames', 'seed', 'istat'];

    public function __construct(
        private readonly RawGeographyExplorer $explorer = new RawGeographyExplorer(),
        private readonly CanonicalGeographyLoader $loader = new CanonicalGeographyLoader(),
    ) {
    }

    public function runs(): JsonResponse
    {
        return response()->json([
            'data' => GeoImportRun::query()
                ->whereIn('status', ['completed', 'completed_with_warnings'])
                ->latest('id')
                ->limit(50)
                ->get()
                ->map(fn (GeoImportRun $run) => $this->transformRunOption($run))
                ->filter(fn (?array $run) => $run !== null)
                ->values(),
        ]);
    }

    public function continents(): JsonResponse
    {
        return response()->json([
            'data' => $this->explorer->continents(
                (int) request()->integer('run_id'),
                (string) request()->query('source', 'geonames'),
            ),
        ]);
    }

    public function countries(): JsonResponse
    {
        return response()->json([
            'data' => $this->explorer->countries(
                (int) request()->integer('run_id'),
                (string) request()->query('source', 'geonames'),
                request()->string('continent_code')->toString() ?: null,
            ),
        ]);
    }

    public function regions(): JsonResponse
    {
        return response()->json([
            'data' => $this->explorer->regions(
                (int) request()->integer('run_id'),
                (string) request()->query('source', 'seed'),
                request()->string('country_key')->toString(),
            ),
        ]);
    }

    public function provinces(): JsonResponse
    {
        return response()->json([
            'data' => $this->explorer->provinces(
                (int) request()->integer('run_id'),
                (string) request()->query('source', 'seed'),
                request()->string('region_key')->toString(),
            ),
        ]);
    }

    public function cities(): JsonResponse
    {
        return response()->json([
            'data' => $this->explorer->cities(
                (int) request()->integer('run_id'),
                (string) request()->query('source', 'seed'),
                request()->string('province_key')->toString(),
            ),
        ]);
    }

    public function execute(ExecuteGeoLoadRequest $request): JsonResponse
    {
        try {
            $this->assertLoadableRun(
                runId: (int) $request->integer('run_id'),
                source: (string) $request->string('source'),
            );

            $result = $this->loader->loadSelection(
                runId: (int) $request->integer('run_id'),
                sourceSystem: (string) $request->string('source'),
                level: (string) $request->string('level'),
                recursive: $request->boolean('recursive', false),
                continentCode: $request->string('continent_code')->toString() ?: null,
                countryKey: $request->string('country_key')->toString() ?: null,
                regionKey: $request->string('region_key')->toString() ?: null,
                provinceKey: $request->string('province_key')->toString() ?: null,
            );
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Scarico completato con successo.',
            'data' => $result,
        ], 201);
    }

    private function transformRunOption(GeoImportRun $run): ?array
    {
        $summary = is_array($run->summary_json) ? $run->summary_json : [];
        $source = (string) ($summary['source'] ?? '');
        $dataset = (string) ($summary['dataset'] ?? '');

        if (! in_array($source, self::LOADABLE_SOURCES, true)) {
            return null;
        }

        $availableLevels = match ($source) {
            'geonames' => ['countries'],
            'seed', 'istat' => ['countries', 'regions', 'provinces', 'cities'],
            default => [],
        };

        return [
            'id' => $run->id,
            'scope' => $run->scope,
            'status' => $run->status,
            'source' => $source,
            'dataset' => $dataset !== '' ? $dataset : null,
            'display_name' => $this->displayNameFor($source, $dataset, $run->scope),
            'available_levels' => $availableLevels,
            'is_loadable' => true,
            'started_at' => optional($run->started_at)?->toISOString(),
            'finished_at' => optional($run->finished_at)?->toISOString(),
            'summary' => $summary,
        ];
    }

    private function displayNameFor(string $source, string $dataset, ?string $scope): string
    {
        return match ($source) {
            'geonames' => 'Nazioni mondiali (GeoNames)',
            'seed' => 'Dataset seed Italia',
            'istat' => 'Dataset amministrativo ISTAT Italia',
            default => $dataset !== '' ? $dataset : ($scope ?: $source),
        };
    }

    private function assertLoadableRun(int $runId, string $source): void
    {
        $run = GeoImportRun::query()->find($runId);

        if (! $run) {
            throw new RuntimeException("Run {$runId} non trovato.");
        }

        $summary = is_array($run->summary_json) ? $run->summary_json : [];
        $actualSource = (string) ($summary['source'] ?? '');

        if (! in_array($actualSource, self::LOADABLE_SOURCES, true)) {
            throw new RuntimeException("Il run {$runId} non è scaricabile: sorgente non supportata per il caricamento canonico.");
        }

        if ($actualSource !== $source) {
            throw new RuntimeException("Il run {$runId} appartiene alla sorgente {$actualSource}; non può essere usato con source={$source}.");
        }
    }
}
