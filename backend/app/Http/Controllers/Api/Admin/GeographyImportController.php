<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StartGeographyImportRequest;
use App\Models\Country;
use App\Services\Geography\GeographyProviderResolver;
use App\Services\Geography\OnDemandGeographyImporter;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class GeographyImportController extends Controller
{
    public function __construct(
        private readonly GeographyProviderResolver $providerResolver = new GeographyProviderResolver(),
        private readonly OnDemandGeographyImporter $importer = new OnDemandGeographyImporter(),
    ) {
    }

    public function store(StartGeographyImportRequest $request): JsonResponse
    {
        $country = $this->resolveCountry($request);
        $provider = $this->providerResolver->resolveForCountry(
            $country,
            $request->integer('provider_id') ?: null,
        );

        if (! $provider) {
            return response()->json([
                'message' => "Nessun provider geografico attivo disponibile per la nazione {$country->iso_code}.",
            ], 422);
        }

        try {
            $result = $this->importer->import($country, $provider, $request->user()?->id);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Import geografico completato.',
            'data' => [
                'country' => [
                    'id' => $country->id,
                    'iso_code' => $country->iso_code,
                    'name' => $country->name,
                ],
                'provider' => [
                    'id' => $provider->id,
                    'code' => $provider->code,
                    'name' => $provider->name,
                    'driver' => $provider->driver,
                    'mode' => $provider->mode,
                    'format' => $provider->format,
                ],
                'run' => [
                    'id' => $result['run']->id,
                    'status' => $result['run']->status,
                    'scope' => $result['run']->scope,
                    'summary' => $result['run']->summary_json,
                ],
                'raw' => $result['raw'],
                'loaded' => $result['loaded'],
                'warning' => $result['warning'] ?? null,
            ],
        ], 201);
    }

    private function resolveCountry(StartGeographyImportRequest $request): Country
    {
        if ($request->filled('country_id')) {
            return Country::query()->findOrFail((int) $request->integer('country_id'));
        }

        return Country::query()
            ->where('iso_code', strtoupper((string) $request->string('country_iso_code')))
            ->firstOrFail();
    }
}
