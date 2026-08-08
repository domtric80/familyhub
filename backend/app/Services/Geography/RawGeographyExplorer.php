<?php

namespace App\Services\Geography;

use App\Models\GeoSourceCityRaw;
use App\Models\GeoSourceCountryRaw;
use App\Models\GeoSourceProvinceRaw;
use App\Models\GeoSourceRegionRaw;
use RuntimeException;

class RawGeographyExplorer
{
    public function continents(int $runId, string $sourceSystem): array
    {
        return GeoSourceCountryRaw::query()
            ->where('geo_import_run_id', $runId)
            ->where('source_system', $sourceSystem)
            ->whereNotNull('continent_code')
            ->get()
            ->map(fn (GeoSourceCountryRaw $row) => [
                'code' => $row->continent_code,
                'name' => $row->continent_name ?: $row->continent_code,
            ])
            ->unique('code')
            ->sortBy('name')
            ->values()
            ->all();
    }

    public function countries(int $runId, string $sourceSystem, ?string $continentCode = null): array
    {
        return GeoSourceCountryRaw::query()
            ->where('geo_import_run_id', $runId)
            ->where('source_system', $sourceSystem)
            ->when($continentCode, fn ($query) => $query->where('continent_code', strtoupper($continentCode)))
            ->orderBy('source_name')
            ->get()
            ->map(fn (GeoSourceCountryRaw $row) => [
                'key' => $row->source_record_key,
                'name' => $row->source_name,
                'iso_code' => $row->iso_code,
                'iso3_code' => $row->iso3_code,
                'continent_code' => $row->continent_code,
                'continent_name' => $row->continent_name,
            ])
            ->values()
            ->all();
    }

    public function regions(int $runId, string $sourceSystem, string $countryKey): array
    {
        $this->assertRequired($countryKey, 'country_key');

        return GeoSourceRegionRaw::query()
            ->where('geo_import_run_id', $runId)
            ->where('source_system', $sourceSystem)
            ->where('source_parent_key', $countryKey)
            ->orderBy('source_name')
            ->get()
            ->map(fn (GeoSourceRegionRaw $row) => [
                'key' => $row->source_record_key,
                'parent_key' => $row->source_parent_key,
                'name' => $row->source_name,
                'code' => $row->code,
                'istat_code' => $row->istat_code,
            ])
            ->values()
            ->all();
    }

    public function provinces(int $runId, string $sourceSystem, string $regionKey): array
    {
        $this->assertRequired($regionKey, 'region_key');

        return GeoSourceProvinceRaw::query()
            ->where('geo_import_run_id', $runId)
            ->where('source_system', $sourceSystem)
            ->where('source_parent_key', $regionKey)
            ->orderBy('source_name')
            ->get()
            ->map(fn (GeoSourceProvinceRaw $row) => [
                'key' => $row->source_record_key,
                'parent_key' => $row->source_parent_key,
                'name' => $row->source_name,
                'code' => $row->code,
                'istat_code' => $row->istat_code,
                'vehicle_code' => $row->vehicle_code,
            ])
            ->values()
            ->all();
    }

    public function cities(int $runId, string $sourceSystem, string $provinceKey): array
    {
        $this->assertRequired($provinceKey, 'province_key');

        return GeoSourceCityRaw::query()
            ->where('geo_import_run_id', $runId)
            ->where('source_system', $sourceSystem)
            ->where('source_parent_key', $provinceKey)
            ->orderBy('source_name')
            ->get()
            ->map(fn (GeoSourceCityRaw $row) => [
                'key' => $row->source_record_key,
                'parent_key' => $row->source_parent_key,
                'name' => $row->source_name,
                'istat_code' => $row->istat_code,
                'cadastre_code' => $row->cadastre_code,
                'postal_code' => $row->postal_code,
            ])
            ->values()
            ->all();
    }

    private function assertRequired(string $value, string $field): void
    {
        if (trim($value) === '') {
            throw new RuntimeException("Il parametro {$field} è obbligatorio.");
        }
    }
}
