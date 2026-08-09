<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGeographyProviderRequest;
use App\Models\GeographyProvider;
use App\Services\Geography\GeoNamesGlobalCountryImporter;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class GeographyProviderController extends Controller
{
    public function __construct(
        private readonly GeoNamesGlobalCountryImporter $geoNamesGlobalCountryImporter = new GeoNamesGlobalCountryImporter(),
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json(
            GeographyProvider::query()
                ->withCount('countries')
                ->orderBy('priority')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreGeographyProviderRequest $request): JsonResponse
    {
        $provider = GeographyProvider::query()->create([
            ...$request->validated(),
            'priority' => $request->integer('priority', 100),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($provider, 201);
    }

    public function show(GeographyProvider $provider): JsonResponse
    {
        return response()->json($provider->load('countries'));
    }

    public function update(StoreGeographyProviderRequest $request, GeographyProvider $provider): JsonResponse
    {
        $provider->update([
            ...$request->validated(),
            'priority' => $request->integer('priority', $provider->priority),
            'is_active' => $request->boolean('is_active', $provider->is_active),
        ]);

        return response()->json($provider->fresh()->load('countries'));
    }

    public function destroy(GeographyProvider $provider): JsonResponse
    {
        if ($provider->countries()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare il provider: esistono nazioni associate.',
            ], 409);
        }

        $provider->delete();

        return response()->json(status: 204);
    }

    public function importCountries(GeographyProvider $provider): JsonResponse
    {
        try {
            $result = $this->geoNamesGlobalCountryImporter->importAllCountries($provider, request()->user()?->id);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Import nazioni completato.',
            'data' => [
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
                'stats' => $result['stats'],
            ],
        ], 201);
    }
}
