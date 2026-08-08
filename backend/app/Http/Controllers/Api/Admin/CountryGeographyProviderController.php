<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCountryGeographyProviderRequest;
use App\Models\Country;
use App\Models\GeographyProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CountryGeographyProviderController extends Controller
{
    public function index(Country $country): JsonResponse
    {
        $providers = $country->providers()
            ->orderByPivot('priority')
            ->orderBy('name')
            ->get()
            ->map(function (GeographyProvider $provider) use ($country): array {
                return [
                    'provider_id' => $provider->id,
                    'country_id' => $country->id,
                    'is_default' => (bool) ($provider->pivot?->is_default ?? false),
                    'priority' => $provider->pivot?->priority,
                    'is_active' => (bool) ($provider->pivot?->is_active ?? true),
                    'provider' => $provider->withoutRelations()->toArray(),
                    'country' => $country->toArray(),
                ];
            })
            ->values();

        return response()->json([
            'country' => $country,
            'providers' => $providers,
        ]);
    }

    public function store(StoreCountryGeographyProviderRequest $request, Country $country): JsonResponse
    {
        $validated = $request->validated();
        $providerId = (int) ($validated['geography_provider_id'] ?? $validated['provider_id']);

        DB::transaction(function () use ($validated, $country, $providerId): void {
            if (($validated['is_default'] ?? false) === true) {
                DB::table('country_geography_provider')
                    ->where('country_id', $country->id)
                    ->update(['is_default' => false]);
            }

            $country->providers()->syncWithoutDetaching([
                $providerId => [
                    'is_default' => (bool) ($validated['is_default'] ?? false),
                    'priority' => (int) ($validated['priority'] ?? 100),
                    'is_active' => (bool) ($validated['is_active'] ?? true),
                ],
            ]);
        });

        return $this->index($country);
    }

    public function update(StoreCountryGeographyProviderRequest $request, Country $country, GeographyProvider $provider): JsonResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $country, $provider): void {
            if (($validated['is_default'] ?? false) === true) {
                DB::table('country_geography_provider')
                    ->where('country_id', $country->id)
                    ->update(['is_default' => false]);
            }

            $country->providers()->updateExistingPivot($provider->id, [
                'is_default' => (bool) ($validated['is_default'] ?? false),
                'priority' => (int) ($validated['priority'] ?? 100),
                'is_active' => (bool) ($validated['is_active'] ?? true),
            ]);
        });

        return $this->index($country);
    }

    public function destroy(Country $country, GeographyProvider $provider): JsonResponse
    {
        $country->providers()->detach($provider->id);

        return response()->json(status: 204);
    }
}
