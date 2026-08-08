<?php

namespace App\Services\Geography;

use App\Models\Country;
use App\Models\GeographyProvider;

class GeographyProviderResolver
{
    public function resolveForCountry(Country $country, ?int $providerId = null): ?GeographyProvider
    {
        if ($providerId !== null) {
            return GeographyProvider::query()
                ->whereKey($providerId)
                ->where('is_active', true)
                ->first();
        }

        $countryProvider = $country->providers()
            ->where('geography_providers.is_active', true)
            ->wherePivot('is_active', true)
            ->orderByDesc('country_geography_provider.is_default')
            ->orderBy('country_geography_provider.priority')
            ->orderBy('geography_providers.priority')
            ->first();

        if ($countryProvider) {
            return $countryProvider;
        }

        return GeographyProvider::query()
            ->where('type', 'generic')
            ->where('is_active', true)
            ->orderBy('priority')
            ->first();
    }
}
