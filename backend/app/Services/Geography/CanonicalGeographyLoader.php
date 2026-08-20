<?php

namespace App\Services\Geography;

use App\Models\City;
use App\Models\Country;
use App\Models\GeoSourceCityRaw;
use App\Models\GeoSourceCountryRaw;
use App\Models\GeoSourceProvinceRaw;
use App\Models\GeoSourceRegionRaw;
use App\Models\Province;
use App\Models\Region;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CanonicalGeographyLoader
{
    public function loadFromRun(int $runId, string $sourceSystem): array
    {
        return $this->loadSelection($runId, $sourceSystem, 'countries', true);
    }

    public function loadSelection(
        int $runId,
        string $sourceSystem,
        string $level,
        bool $recursive = false,
        ?string $continentCode = null,
        ?string $countryKey = null,
        ?string $regionKey = null,
        ?string $provinceKey = null,
    ): array {
        return DB::transaction(function () use ($runId, $sourceSystem, $level, $recursive, $continentCode, $countryKey, $regionKey, $provinceKey): array {
            $countryRows = GeoSourceCountryRaw::query()
                ->where('geo_import_run_id', $runId)
                ->where('source_system', $sourceSystem)
                ->when($continentCode, fn ($query) => $query->where('continent_code', strtoupper($continentCode)))
                ->when($countryKey, fn ($query) => $query->where('source_record_key', $countryKey))
                ->get();

            if ($countryRows->isEmpty()) {
                throw new RuntimeException("Nessun dato raw disponibile per run {$runId} e source {$sourceSystem}.");
            }

            $countryMap = [];
            $regionMap = [];
            $provinceMap = [];
            $countries = 0;
            $regions = 0;
            $provinces = 0;
            $cities = 0;

            if ($level === 'countries' || $recursive) {
                foreach ($countryRows as $countryRow) {
                    $country = Country::query()->updateOrCreate(
                        ['iso_code' => $countryRow->iso_code],
                        ['name' => $countryRow->source_name],
                    );
                    $countryMap[$countryRow->source_record_key] = $country;
                    $countries++;
                }
            } else {
                foreach ($countryRows as $countryRow) {
                    $countryMap[$countryRow->source_record_key] = Country::query()->firstOrCreate(
                        ['iso_code' => $countryRow->iso_code],
                        ['name' => $countryRow->source_name],
                    );
                }
            }

            $regionRows = GeoSourceRegionRaw::query()
                ->where('geo_import_run_id', $runId)
                ->where('source_system', $sourceSystem)
                ->whereIn('source_parent_key', $this->effectiveCountryKeys($countryRows, $countryKey))
                ->when($regionKey, fn ($query) => $query->where('source_record_key', $regionKey))
                ->get();

            if ($level === 'regions' || $level === 'provinces' || $level === 'cities' || $recursive) {
                foreach ($regionRows as $regionRow) {
                    $parent = $countryMap[$regionRow->source_parent_key ?? ''] ?? null;
                    if (! $parent) {
                        continue;
                    }

                    $regionCode = $this->normalizeCode(
                        $regionRow->code,
                        $regionRow->source_record_key,
                    );

                    $region = Region::query()
                        ->where('country_id', $parent->id)
                        ->where(function ($query) use ($regionRow, $regionCode): void {
                            $query->where('code', $regionCode)
                                ->orWhere('name', $regionRow->source_name);
                        })
                        ->first();

                    if (! $region) {
                        $region = new Region(['country_id' => $parent->id]);
                    }

                    $region->code = $regionCode;
                    $region->name = $regionRow->source_name;
                    $region->country_id = $parent->id;
                    $region->save();
                    $regionMap[$regionRow->source_record_key] = $region;
                    $regions++;
                }
            }

            $provinceRows = GeoSourceProvinceRaw::query()
                ->where('geo_import_run_id', $runId)
                ->where('source_system', $sourceSystem)
                ->whereIn('source_parent_key', $this->effectiveKeys($regionRows, $regionKey))
                ->when($provinceKey, fn ($query) => $query->where('source_record_key', $provinceKey))
                ->get();

            if ($level === 'provinces' || $level === 'cities' || $recursive) {
                foreach ($provinceRows as $provinceRow) {
                    $parent = $regionMap[$provinceRow->source_parent_key ?? ''] ?? null;
                    if (! $parent) {
                        continue;
                    }

                    $provinceCode = $this->normalizeCode(
                        $provinceRow->code ?: $provinceRow->vehicle_code,
                        $provinceRow->source_record_key,
                    );

                    $province = Province::query()
                        ->where('region_id', $parent->id)
                        ->where(function ($query) use ($provinceRow, $provinceCode): void {
                            $query->where('code', $provinceCode)
                                ->orWhere('name', $provinceRow->source_name);
                        })
                        ->first();

                    if (! $province) {
                        $province = new Province(['region_id' => $parent->id]);
                    }

                    $province->code = $provinceCode;
                    $province->name = $provinceRow->source_name;
                    $province->region_id = $parent->id;
                    $province->save();
                    $provinceMap[$provinceRow->source_record_key] = $province;
                    $provinces++;
                }
            }

            if ($level === 'cities' || $recursive) {
                GeoSourceCityRaw::query()
                    ->where('geo_import_run_id', $runId)
                    ->where('source_system', $sourceSystem)
                    ->whereIn('source_parent_key', $this->effectiveKeys($provinceRows, $provinceKey))
                    ->orderBy('id')
                    ->chunkById(1000, function ($cityRows) use (&$cities, $provinceMap): void {
                        foreach ($cityRows as $cityRow) {
                            $parent = $provinceMap[$cityRow->source_parent_key ?? ''] ?? null;
                            if (! $parent) {
                                continue;
                            }

                            $city = null;
                            $normalized = is_array($cityRow->normalized_payload_json) ? $cityRow->normalized_payload_json : [];

                            if ($cityRow->cadastre_code) {
                                $city = City::query()
                                    ->where('cadastre_code', $cityRow->cadastre_code)
                                    ->first();
                            }

                            if (! $city && ($normalized['geoname_id'] ?? null)) {
                                $city = City::query()
                                    ->where('province_id', $parent->id)
                                    ->where('geoname_id', $normalized['geoname_id'])
                                    ->first();
                            }

                            if (! $city) {
                                $city = City::query()
                                    ->where('province_id', $parent->id)
                                    ->where('name', $cityRow->source_name)
                                    ->first();
                            }

                            if (! $city) {
                                $city = new City();
                            }

                            $city->province_id = $parent->id;
                            $city->name = $cityRow->source_name;
                            if ($cityRow->cadastre_code) {
                                $city->cadastre_code = $cityRow->cadastre_code;
                            }
                            if ($cityRow->postal_code) {
                                $city->postal_code = $cityRow->postal_code;
                            }

                            $city->geoname_id = $normalized['geoname_id'] ?? $city->geoname_id;
                            $city->latitude = $normalized['latitude'] ?? $city->latitude;
                            $city->longitude = $normalized['longitude'] ?? $city->longitude;
                            $city->population = $normalized['population'] ?? $city->population;
                            $city->timezone = $normalized['timezone'] ?? $city->timezone;
                            $city->feature_code = $normalized['feature_code'] ?? $city->feature_code;
                            $city->geonames_modified_at = $normalized['geonames_modified_at'] ?? $city->geonames_modified_at;
                            $city->save();
                            $cities++;
                        }
                    });
            }

            return [
                'countries' => $countries,
                'regions' => $regions,
                'provinces' => $provinces,
                'cities' => $cities,
                'level' => $level,
                'recursive' => $recursive,
            ];
        });
    }

    private function effectiveCountryKeys(Collection $countryRows, ?string $countryKey): array
    {
        if ($countryKey) {
            return [$countryKey];
        }

        return $countryRows->pluck('source_record_key')->filter()->values()->all();
    }

    private function effectiveKeys(Collection $rows, ?string $forcedKey): array
    {
        if ($forcedKey) {
            return [$forcedKey];
        }

        return $rows->pluck('source_record_key')->filter()->values()->all();
    }

    private function normalizeCode(?string $preferredCode, string $fallbackSeed, int $maxLength = 10): string
    {
        $preferredCode = trim((string) $preferredCode);

        if ($preferredCode !== '') {
            return substr($preferredCode, 0, $maxLength);
        }

        return strtoupper(substr(sha1($fallbackSeed), 0, $maxLength));
    }
}
