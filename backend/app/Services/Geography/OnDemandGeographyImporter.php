<?php

namespace App\Services\Geography;

use App\Models\Country;
use App\Models\City;
use App\Models\GeoImportRun;
use App\Models\GeoSourceCityRaw;
use App\Models\GeoSourceCountryRaw;
use App\Models\GeoSourceProvinceRaw;
use App\Models\GeoSourceRegionRaw;
use App\Models\GeographyProvider;
use App\Models\Province;
use App\Models\Region;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use ZipArchive;

class OnDemandGeographyImporter
{
    public function __construct(
        private readonly IstatCsvRawImporter $istatImporter = new IstatCsvRawImporter(),
        private readonly CanonicalGeographyLoader $canonicalLoader = new CanonicalGeographyLoader(),
        private readonly GeoNamesCountrySource $geoNamesCountrySource = new GeoNamesCountrySource(),
        private readonly GeoNamesCountryDumpSource $geoNamesCountryDumpSource = new GeoNamesCountryDumpSource(),
    ) {
    }

    public function import(Country $country, GeographyProvider $provider, ?int $initiatedByUserId = null): array
    {
        $this->prepareLongRunningImportRuntime();

        return match ($provider->driver) {
            'istat' => $this->importIstat($country, $provider, $initiatedByUserId),
            'geonames' => $this->importGeoNamesCountry($country, $provider, $initiatedByUserId),
            default => throw new RuntimeException("Driver provider non supportato: {$provider->driver}."),
        };
    }

    private function importIstat(Country $country, GeographyProvider $provider, ?int $initiatedByUserId): array
    {
        if (strtoupper($country->iso_code) !== 'IT') {
            throw new RuntimeException('Il provider ISTAT è utilizzabile solo per la nazione IT.');
        }

        $filePath = $this->resolveIstatInputFile($provider);
        $run = $this->createRun('on_demand_country', 'istat_country_import', $initiatedByUserId, [
            'source' => 'istat',
            'dataset' => 'istat_country_import',
            'country_iso_code' => $country->iso_code,
            'provider_code' => $provider->code,
            'mode' => $provider->mode,
        ]);

        try {
            $raw = $this->istatImporter->import($run, $filePath);
            $loaded = $this->canonicalLoader->loadFromRun($run->id, 'istat');

            $run->update([
                'status' => 'completed',
                'finished_at' => now(),
                'source_file_count' => 1,
                'raw_record_count' => (int) ($raw['countries'] + $raw['regions'] + $raw['provinces'] + $raw['cities']),
                'normalized_record_count' => (int) ($raw['countries'] + $raw['regions'] + $raw['provinces'] + $raw['cities']),
                'published_record_count' => (int) ($loaded['countries'] + $loaded['regions'] + $loaded['provinces'] + $loaded['cities']),
                'issue_count' => (int) ($raw['issues'] ?? 0),
                'error_count' => 0,
                'summary_json' => array_merge($run->summary_json ?? [], [
                    'countries_parsed' => $raw['countries'],
                    'regions_parsed' => $raw['regions'],
                    'provinces_parsed' => $raw['provinces'],
                    'cities_parsed' => $raw['cities'],
                    'loaded' => $loaded,
                ]),
            ]);
        } catch (\Throwable $throwable) {
            $run->update([
                'status' => 'failed',
                'finished_at' => now(),
                'error_count' => 1,
                'summary_json' => array_merge($run->summary_json ?? [], [
                    'error' => $throwable->getMessage(),
                ]),
            ]);

            throw $throwable;
        }

        return [
            'run' => $run->fresh(),
            'provider' => $provider,
            'country' => $country,
            'raw' => $raw,
            'loaded' => $loaded,
        ];
    }

    private function importGeoNamesCountry(Country $country, GeographyProvider $provider, ?int $initiatedByUserId): array
    {
        $this->guardAgainstUnsafeGeoNamesCanonicalOverwrite($country, $provider);

        $run = $this->createRun('on_demand_country', 'geonames_country_import', $initiatedByUserId, [
            'source' => 'geonames',
            'dataset' => 'country_dump',
            'country_iso_code' => $country->iso_code,
            'provider_code' => $provider->code,
            'mode' => $provider->mode,
        ]);

        try {
            $settings = $this->resolveGeoNamesSettings($provider);

            $countriesPayload = $this->resolveGeoNamesCountriesPayload($provider, $settings);
            $countriesSourceFile = $this->geoNamesCountrySource->persistFile($countriesPayload);
            $countryRows = $this->geoNamesCountrySource->parseCountries((string) $countriesPayload['content']);

            $match = collect($countryRows)->first(
                fn (array $row) => strtoupper((string) ($row['iso_code'] ?? '')) === strtoupper($country->iso_code)
            );

            if (! $match) {
                throw new RuntimeException("Nazione {$country->iso_code} non trovata nel dataset del provider {$provider->code}.");
            }

            $admin1Payload = $this->resolveGeoNamesTextPayload(
                localPath: $this->resolveConfiguredLocalPath($settings, 'admin1_source_path'),
                remoteUrl: $this->resolveConfiguredUrl(
                    $settings,
                    'admin1_source_url',
                    (string) config('geography.sources.geonames.admin1_url')
                ),
                fallbackName: 'admin1CodesASCII.txt',
            );
            $admin1SourceFile = $this->geoNamesCountryDumpSource->persistFile($admin1Payload, 'admin1', 'GeoNames admin1');
            $regions = $this->geoNamesCountryDumpSource->parseAdmin1((string) $admin1Payload['content'], (string) $match['iso_code']);

            $admin2Payload = $this->resolveGeoNamesTextPayload(
                localPath: $this->resolveConfiguredLocalPath($settings, 'admin2_source_path'),
                remoteUrl: $this->resolveConfiguredUrl(
                    $settings,
                    'admin2_source_url',
                    (string) config('geography.sources.geonames.admin2_url')
                ),
                fallbackName: 'admin2Codes.txt',
            );
            $admin2SourceFile = $this->geoNamesCountryDumpSource->persistFile($admin2Payload, 'admin2', 'GeoNames admin2');
            $provinces = $this->geoNamesCountryDumpSource->parseAdmin2((string) $admin2Payload['content'], (string) $match['iso_code']);

            $countryDumpPayload = $this->resolveGeoNamesCountryDumpPayload($provider, $settings, (string) $match['iso_code']);
            $countryDumpSourceFile = $this->geoNamesCountryDumpSource->persistFile($countryDumpPayload, 'country_dump', 'GeoNames country dump');
            $countryDumpTxt = $this->geoNamesCountryDumpSource->extractPreferredTxtToTempFile(
                (string) $countryDumpPayload['content'],
                (string) $countryDumpPayload['file_name'],
            );

            $structures = $this->buildGeoNamesBaseStructure(
                countryIsoCode: (string) $match['iso_code'],
                countryName: (string) $match['name'],
                countryData: $match,
                regions: $regions,
                provinces: $provinces,
            );

            $cityCount = 0;

            try {
                $country->update([
                    'iso_code' => strtoupper((string) $match['iso_code']),
                    'name' => (string) $match['name'],
                ]);

                $now = now();
                $cityInsertBatch = [];

                foreach ($this->geoNamesCountryDumpSource->iterateCountryDumpFile($countryDumpTxt['path'], (string) $match['iso_code']) as $city) {
                    $this->ensureGeoNamesStructureForCity($structures, (string) $match['iso_code'], $city);

                    $cityInsertBatch[] = [
                        'geo_import_run_id' => $run->id,
                        'geo_source_file_id' => $countryDumpSourceFile->id,
                        'source_system' => 'geonames',
                        'dataset_code' => 'country_dump',
                        'source_record_key' => (string) $city['source_record_key'],
                        'source_parent_key' => (string) $city['source_parent_key'],
                        'source_name' => (string) $city['source_name'],
                        'istat_code' => null,
                        'cadastre_code' => null,
                        'postal_code' => null,
                        'raw_payload_json' => json_encode($city, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                        'normalized_payload_json' => json_encode([
                            'geoname_id' => (int) $city['source_record_key'],
                            'latitude' => $city['latitude'],
                            'longitude' => $city['longitude'],
                            'population' => $city['population'],
                            'timezone' => $city['timezone'],
                            'feature_code' => $city['feature_code'],
                            'geonames_modified_at' => $city['modification_date'],
                            'ascii_name' => $city['ascii_name'],
                            'alternate_names' => $city['alternate_names'],
                            'admin3_code' => $city['admin3_code'],
                            'admin4_code' => $city['admin4_code'],
                        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    $cityCount++;

                    if (count($cityInsertBatch) >= 500) {
                        DB::table('geo_source_cities_raw')->insert($cityInsertBatch);
                        $cityInsertBatch = [];
                    }
                }

                if ($cityInsertBatch !== []) {
                    DB::table('geo_source_cities_raw')->insert($cityInsertBatch);
                }

                GeoSourceCountryRaw::query()->create([
                    'geo_import_run_id' => $run->id,
                    'geo_source_file_id' => $countriesSourceFile->id,
                    'source_system' => 'geonames',
                    'dataset_code' => 'countries',
                    'source_record_key' => (string) $structures['country']['source_record_key'],
                    'source_name' => (string) $structures['country']['source_name'],
                    'iso_code' => (string) $structures['country']['iso_code'],
                    'iso3_code' => $structures['country']['iso3_code'],
                    'continent_code' => $structures['country']['continent_code'],
                    'continent_name' => $structures['country']['continent_name'],
                    'raw_payload_json' => $structures['country']['raw_payload_json'],
                    'normalized_payload_json' => $structures['country']['normalized_payload_json'],
                ]);

                if ($structures['regions'] !== []) {
                    DB::table('geo_source_regions_raw')->insert(array_map(
                        fn (array $region) => [
                            'geo_import_run_id' => $run->id,
                            'geo_source_file_id' => $admin1SourceFile->id,
                            'source_system' => 'geonames',
                            'dataset_code' => 'admin1',
                            'source_record_key' => (string) $region['source_record_key'],
                            'source_parent_key' => (string) $region['source_parent_key'],
                            'source_name' => (string) $region['source_name'],
                            'code' => $region['code'],
                            'istat_code' => null,
                            'raw_payload_json' => json_encode($region['raw_payload_json'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                            'normalized_payload_json' => json_encode($region['normalized_payload_json'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ],
                        $structures['regions']
                    ));
                }

                if ($structures['provinces'] !== []) {
                    DB::table('geo_source_provinces_raw')->insert(array_map(
                        fn (array $province) => [
                            'geo_import_run_id' => $run->id,
                            'geo_source_file_id' => $admin2SourceFile->id,
                            'source_system' => 'geonames',
                            'dataset_code' => 'admin2',
                            'source_record_key' => (string) $province['source_record_key'],
                            'source_parent_key' => (string) $province['source_parent_key'],
                            'source_name' => (string) $province['source_name'],
                            'code' => $province['code'],
                            'istat_code' => null,
                            'vehicle_code' => null,
                            'raw_payload_json' => json_encode($province['raw_payload_json'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                            'normalized_payload_json' => json_encode($province['normalized_payload_json'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ],
                        $structures['provinces']
                    ));
                }
            } finally {
                @unlink($countryDumpTxt['path']);
            }

            $raw = [
                'countries' => 1,
                'regions' => count($structures['regions']),
                'provinces' => count($structures['provinces']),
                'cities' => $cityCount,
            ];
            $loaded = $this->canonicalLoader->loadFromRun($run->id, 'geonames');
            $publishedCount = (int) (
                ($loaded['countries'] ?? 0)
                + ($loaded['regions'] ?? 0)
                + ($loaded['provinces'] ?? 0)
                + ($loaded['cities'] ?? 0)
            );

            $run->update([
                'status' => 'completed',
                'finished_at' => now(),
                'source_file_count' => 4,
                'raw_record_count' => array_sum($raw),
                'normalized_record_count' => array_sum($raw),
                'published_record_count' => $publishedCount,
                'issue_count' => 0,
                'error_count' => 0,
                'summary_json' => array_merge($run->summary_json ?? [], [
                    'source_file_ids' => [
                        'countries' => $countriesSourceFile->id,
                        'admin1' => $admin1SourceFile->id,
                        'admin2' => $admin2SourceFile->id,
                        'country_dump' => $countryDumpSourceFile->id,
                    ],
                    'countries_parsed' => count($countryRows),
                    'regions_parsed' => $raw['regions'],
                    'provinces_parsed' => $raw['provinces'],
                    'cities_parsed' => $raw['cities'],
                    'raw' => $raw,
                    'loaded' => $loaded,
                    'capabilities' => ['countries', 'regions', 'provinces', 'cities'],
                ]),
            ]);
        } catch (\Throwable $throwable) {
            $run->update([
                'status' => 'failed',
                'finished_at' => now(),
                'error_count' => 1,
                'summary_json' => array_merge($run->summary_json ?? [], [
                    'error' => $throwable->getMessage(),
                ]),
            ]);

            throw $throwable;
        }

        return [
            'run' => $run->fresh(),
            'provider' => $provider,
            'country' => $country,
            'raw' => $run->fresh()->summary_json['raw'] ?? [
                'countries' => 1,
                'regions' => 0,
                'provinces' => 0,
                'cities' => 0,
            ],
            'loaded' => $run->fresh()->summary_json['loaded'] ?? [
                'countries' => 1,
                'regions' => 0,
                'provinces' => 0,
                'cities' => 0,
            ],
        ];
    }

    private function createRun(string $scope, string $dataset, ?int $initiatedByUserId, array $summary): GeoImportRun
    {
        return GeoImportRun::query()->create([
            'run_uuid' => (string) Str::uuid(),
            'trigger_mode' => 'manual',
            'scope' => $scope,
            'status' => 'running',
            'started_at' => now(),
            'finished_at' => null,
            'source_file_count' => 0,
            'raw_record_count' => 0,
            'normalized_record_count' => 0,
            'published_record_count' => 0,
            'issue_count' => 0,
            'error_count' => 0,
            'summary_json' => array_merge(['dataset' => $dataset], $summary),
            'initiated_by_user_id' => $initiatedByUserId,
        ]);
    }

    private function prepareLongRunningImportRuntime(): void
    {
        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }

        @ini_set('max_execution_time', '0');

        DB::connection()->disableQueryLog();
    }

    private function resolveInputFile(GeographyProvider $provider): string
    {
        return match ($provider->mode) {
            'local_file' => $this->requireLocalPath($provider),
            'remote_file' => $this->downloadRemoteFile($provider),
            default => throw new RuntimeException("Mode {$provider->mode} non supportato dal driver {$provider->driver}."),
        };
    }

    private function resolveIstatInputFile(GeographyProvider $provider): string
    {
        $sourcePath = $this->resolveInputFile($provider);
        $format = strtolower((string) ($provider->format ?? 'csv'));

        return match ($format) {
            'csv' => $sourcePath,
            'zip' => $this->extractCsvFromZip($sourcePath, $provider),
            default => throw new RuntimeException("Formato {$provider->format} non supportato dal driver {$provider->driver}."),
        };
    }

    private function resolveGeoNamesSettings(GeographyProvider $provider): array
    {
        return is_array($provider->auth_config_json) ? $provider->auth_config_json : [];
    }

    private function resolveGeoNamesCountriesPayload(GeographyProvider $provider, array $settings): array
    {
        $providerLocalPath = $this->requireLocalPathIfApplicable($provider);
        $providerSourceUrl = trim((string) ($provider->source_url ?? ''));

        $defaultCountriesLocalPath = $this->resolveConfiguredLocalPath($settings, 'countries_source_path');
        $defaultCountriesUrl = $this->resolveConfiguredUrl(
            $settings,
            'countries_source_url',
            (string) config('geography.sources.geonames.countries_url')
        );

        return match ($provider->mode) {
            'local_file' => $this->geoNamesCountrySource->fetch(
                $defaultCountriesLocalPath
                    ?: ($providerLocalPath && ! $this->looksLikeZipPath($providerLocalPath) ? $providerLocalPath : null)
                    ?: throw new RuntimeException('Per il provider GeoNames locale manca il file countryInfo.txt.')
            ),
            'remote_file' => $this->resolveGeoNamesTextPayload(
                localPath: $defaultCountriesLocalPath,
                remoteUrl: ! $this->looksLikeZipUrl($providerSourceUrl) && $providerSourceUrl !== ''
                    ? $providerSourceUrl
                    : $defaultCountriesUrl,
                fallbackName: 'countryInfo.txt',
            ),
            default => throw new RuntimeException("Mode {$provider->mode} non supportato dal driver {$provider->driver}."),
        };
    }

    private function resolveGeoNamesCountryDumpPayload(GeographyProvider $provider, array $settings, string $countryIsoCode): array
    {
        $templatePath = $this->resolveConfiguredLocalPath($settings, 'country_dump_source_path_template');
        $templateUrl = $this->resolveConfiguredUrl(
            $settings,
            'country_dump_url_template',
            (string) config('geography.sources.geonames.country_dump_url_template')
        );

        $localPath = $templatePath ? $this->replaceCountryTemplate($templatePath, $countryIsoCode) : null;
        $remoteUrl = $templateUrl ? $this->replaceCountryTemplate($templateUrl, $countryIsoCode) : null;

        if (! $localPath && ! $remoteUrl) {
            if ($provider->mode === 'local_file' && $provider->source_path && str_ends_with(strtolower((string) $provider->source_path), '.zip')) {
                $localPath = (string) $provider->source_path;
            } elseif ($provider->mode === 'remote_file' && $provider->source_url && str_ends_with(strtolower((string) $provider->source_url), '.zip')) {
                $remoteUrl = (string) $provider->source_url;
            }
        }

        return $this->geoNamesCountryDumpSource->fetchBinary(
            $localPath,
            $remoteUrl,
            "{$countryIsoCode}.zip",
        );
    }

    private function guardAgainstUnsafeGeoNamesCanonicalOverwrite(Country $country, GeographyProvider $provider): void
    {
        $hasCanonicalHierarchy = Region::query()->where('country_id', $country->id)->exists()
            || Province::query()->whereHas('region', fn ($query) => $query->where('country_id', $country->id))->exists()
            || City::query()->whereHas('province.region', fn ($query) => $query->where('country_id', $country->id))->exists();

        if (! $hasCanonicalHierarchy) {
            return;
        }

        $hasCountrySpecificNonGeoNamesProvider = $country->providers()
            ->where('geography_providers.driver', '!=', 'geonames')
            ->where('geography_providers.type', 'country_specific')
            ->wherePivot('is_active', true)
            ->exists();

        if (! $hasCountrySpecificNonGeoNamesProvider) {
            return;
        }

        throw new RuntimeException(
            "La nazione {$country->iso_code} ha già una gerarchia geografica canonica gestita da un provider paese-specifico. ".
            'GeoNames non può sovrascrivere regioni, province e città esistenti. '.
            'Usa GeoNames per nazioni non ancora popolate oppure come sorgente di arricchimento in uno step dedicato.'
        );
    }

    private function resolveGeoNamesTextPayload(?string $localPath, ?string $remoteUrl, string $fallbackName): array
    {
        return $this->geoNamesCountryDumpSource->fetchText($localPath, $remoteUrl, $fallbackName);
    }

    private function resolveConfiguredLocalPath(array $settings, string $key): ?string
    {
        $value = trim((string) ($settings[$key] ?? ''));

        return $value !== '' ? $value : null;
    }

    private function resolveConfiguredUrl(array $settings, string $key, ?string $fallback = null): ?string
    {
        $value = trim((string) ($settings[$key] ?? ''));
        if ($value !== '') {
            return $value;
        }

        $fallback = trim((string) $fallback);

        return $fallback !== '' ? $fallback : null;
    }

    private function requireLocalPathIfApplicable(GeographyProvider $provider): ?string
    {
        $path = trim((string) ($provider->source_path ?? ''));

        if ($path === '') {
            return null;
        }

        if (! is_file($path)) {
            throw new RuntimeException("Provider {$provider->code}: file non trovato in {$path}.");
        }

        return $path;
    }

    private function looksLikeZipUrl(string $value): bool
    {
        $value = strtolower(trim($value));

        return $value !== '' && (str_ends_with($value, '.zip') || str_contains($value, '.zip?'));
    }

    private function looksLikeZipPath(string $value): bool
    {
        $value = strtolower(trim($value));

        return $value !== '' && str_ends_with($value, '.zip');
    }

    private function replaceCountryTemplate(string $template, string $countryIsoCode): string
    {
        return str_replace(
            ['{ISO}', '{iso}'],
            [strtoupper($countryIsoCode), strtolower($countryIsoCode)],
            $template,
        );
    }

    private function buildGeoNamesBaseStructure(
        string $countryIsoCode,
        string $countryName,
        array $countryData,
        array $regions,
        array $provinces,
    ): array {
        $countryIsoCode = strtoupper($countryIsoCode);

        $regionMap = [];
        foreach ($regions as $region) {
            $regionMap[$region['source_record_key']] = [
                'source_record_key' => $region['source_record_key'],
                'source_parent_key' => $region['source_parent_key'],
                'source_name' => $region['source_name'],
                'code' => $region['code'],
                'raw_payload_json' => $region,
                'normalized_payload_json' => [
                    'code' => $region['code'],
                    'ascii_name' => $region['ascii_name'],
                    'geoname_id' => $region['geoname_id'],
                ],
            ];
        }

        $provinceMap = [];
        foreach ($provinces as $province) {
            $provinceMap[$province['source_record_key']] = [
                'source_record_key' => $province['source_record_key'],
                'source_parent_key' => $province['source_parent_key'],
                'source_name' => $province['source_name'],
                'code' => $province['code'],
                'raw_payload_json' => $province,
                'normalized_payload_json' => [
                    'code' => $province['code'],
                    'ascii_name' => $province['ascii_name'],
                    'geoname_id' => $province['geoname_id'],
                ],
            ];
        }

        return [
            'country' => [
                'source_record_key' => $countryIsoCode,
                'source_name' => $countryName,
                'iso_code' => $countryIsoCode,
                'iso3_code' => $countryData['iso3_code'] ?? null,
                'continent_code' => $countryData['continent_code'] ?? null,
                'continent_name' => $countryData['continent_name'] ?? null,
                'raw_payload_json' => $countryData,
                'normalized_payload_json' => $countryData,
            ],
            'regions' => array_values($regionMap),
            'provinces' => array_values($provinceMap),
        ];
    }

    private function ensureGeoNamesStructureForCity(array &$structures, string $countryIsoCode, array $city): void
    {
        $regionKey = (string) $city['region_key'];
        $provinceKey = (string) $city['province_key'];

        $regionsByKey = [];
        foreach ($structures['regions'] as $index => $region) {
            $regionsByKey[$region['source_record_key']] = $index;
        }

        if (! array_key_exists($regionKey, $regionsByKey)) {
            $regionCode = (string) ($city['region_code'] ?: '00');
            $structures['regions'][] = [
                'source_record_key' => $regionKey,
                'source_parent_key' => $countryIsoCode,
                'source_name' => $regionCode === '00'
                    ? 'Regione non classificata (GeoNames)'
                    : "Regione {$regionCode}",
                'code' => $regionCode,
                'raw_payload_json' => [
                    'synthetic' => true,
                    'source' => 'country_dump',
                    'code' => $regionCode,
                ],
                'normalized_payload_json' => [
                    'code' => $regionCode,
                    'synthetic' => true,
                ],
            ];
        }

        $provincesByKey = [];
        foreach ($structures['provinces'] as $index => $province) {
            $provincesByKey[$province['source_record_key']] = $index;
        }

        if (! array_key_exists($provinceKey, $provincesByKey)) {
            $provinceCode = (string) ($city['province_code'] ?: '00');
            $structures['provinces'][] = [
                'source_record_key' => $provinceKey,
                'source_parent_key' => $regionKey,
                'source_name' => $provinceCode === '00'
                    ? 'Provincia non classificata (GeoNames)'
                    : "Provincia {$provinceCode}",
                'code' => $provinceCode,
                'raw_payload_json' => [
                    'synthetic' => true,
                    'source' => 'country_dump',
                    'code' => $provinceCode,
                ],
                'normalized_payload_json' => [
                    'code' => $provinceCode,
                    'synthetic' => true,
                ],
            ];
        }
    }

    private function requireLocalPath(GeographyProvider $provider): string
    {
        $path = trim((string) $provider->source_path);

        if ($path === '') {
            throw new RuntimeException("Provider {$provider->code} non configurato: source_path mancante.");
        }

        if (! is_file($path)) {
            throw new RuntimeException("Provider {$provider->code}: file non trovato in {$path}.");
        }

        return $path;
    }

    private function downloadRemoteFile(GeographyProvider $provider): string
    {
        $url = trim((string) $provider->source_url);

        if ($url === '') {
            throw new RuntimeException("Provider {$provider->code} non configurato: source_url mancante.");
        }

        $response = Http::timeout(120)->get($url);
        $response->throw();

        $target = storage_path('app/tmp/geography/'.Str::uuid().'-'.basename(parse_url($url, PHP_URL_PATH) ?: 'source.dat'));
        $directory = dirname($target);

        if (! is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        file_put_contents($target, $response->body());

        return $target;
    }

    private function extractCsvFromZip(string $zipPath, GeographyProvider $provider): string
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('Estensione PHP ZipArchive non disponibile nel container applicativo.');
        }

        $zip = new ZipArchive();
        $result = $zip->open($zipPath);

        if ($result !== true) {
            throw new RuntimeException("Impossibile aprire il file ZIP del provider {$provider->code}.");
        }

        $selectedIndex = null;

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $entryName = (string) $zip->getNameIndex($index);

            if (str_ends_with(strtolower($entryName), '.csv')) {
                $selectedIndex = $index;
                break;
            }
        }

        if ($selectedIndex === null) {
            $zip->close();

            throw new RuntimeException("Il file ZIP del provider {$provider->code} non contiene alcun CSV.");
        }

        $entryName = (string) $zip->getNameIndex($selectedIndex);
        $content = $zip->getFromIndex($selectedIndex);
        $zip->close();

        if ($content === false) {
            throw new RuntimeException("Impossibile estrarre il CSV dal file ZIP del provider {$provider->code}.");
        }

        $target = storage_path('app/tmp/geography/'.Str::uuid().'-'.basename($entryName));
        $directory = dirname($target);

        if (! is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        file_put_contents($target, $content);

        return $target;
    }
}
