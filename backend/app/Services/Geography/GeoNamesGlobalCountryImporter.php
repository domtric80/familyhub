<?php

namespace App\Services\Geography;

use App\Models\Country;
use App\Models\GeoImportRun;
use App\Models\GeoSourceCountryRaw;
use App\Models\GeographyProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class GeoNamesGlobalCountryImporter
{
    public function __construct(
        private readonly GeoNamesCountrySource $countrySource = new GeoNamesCountrySource(),
    ) {
    }

    public function importAllCountries(GeographyProvider $provider, ?int $initiatedByUserId = null): array
    {
        $this->assertProviderSupported($provider);

        $run = GeoImportRun::query()->create([
            'run_uuid' => (string) Str::uuid(),
            'trigger_mode' => 'manual',
            'scope' => 'on_demand_global_countries',
            'status' => 'running',
            'started_at' => now(),
            'finished_at' => null,
            'source_file_count' => 0,
            'raw_record_count' => 0,
            'normalized_record_count' => 0,
            'published_record_count' => 0,
            'issue_count' => 0,
            'error_count' => 0,
            'summary_json' => [
                'source' => 'geonames',
                'dataset' => 'countries_bulk_import',
                'provider_code' => $provider->code,
                'mode' => $provider->mode,
                'capabilities' => ['countries'],
            ],
            'initiated_by_user_id' => $initiatedByUserId,
        ]);

        try {
            $payload = $this->resolveCountriesPayload($provider);
            $sourceFile = $this->countrySource->persistFile($payload);
            $rows = $this->countrySource->parseCountries((string) $payload['content']);

            $created = 0;
            $updated = 0;

            DB::transaction(function () use ($run, $sourceFile, $rows, &$created, &$updated): void {
                foreach ($rows as $row) {
                    $existing = Country::query()
                        ->where('iso_code', (string) $row['iso_code'])
                        ->first();

                    if ($existing) {
                        $existing->update([
                            'name' => (string) $row['name'],
                        ]);
                        $updated++;
                        $country = $existing;
                    } else {
                        $country = Country::query()->create([
                            'iso_code' => (string) $row['iso_code'],
                            'name' => (string) $row['name'],
                        ]);
                        $created++;
                    }

                    GeoSourceCountryRaw::query()->updateOrCreate(
                        [
                            'geo_import_run_id' => $run->id,
                            'source_system' => 'geonames',
                            'dataset_code' => 'countries',
                            'source_record_key' => (string) $row['source_record_key'],
                        ],
                        [
                            'geo_source_file_id' => $sourceFile->id,
                            'source_name' => (string) $row['name'],
                            'iso_code' => (string) $row['iso_code'],
                            'iso3_code' => $row['iso3_code'] ?? null,
                            'continent_code' => $row['continent_code'] ?? null,
                            'continent_name' => $row['continent_name'] ?? null,
                            'raw_payload_json' => $row,
                            'normalized_payload_json' => [
                                'country_id' => $country->id,
                                'iso_code' => $row['iso_code'],
                                'iso3_code' => $row['iso3_code'] ?? null,
                                'continent_code' => $row['continent_code'] ?? null,
                                'continent_name' => $row['continent_name'] ?? null,
                            ],
                        ],
                    );
                }
            });

            $loaded = [
                'countries' => $created + $updated,
                'regions' => 0,
                'provinces' => 0,
                'cities' => 0,
            ];

            $run->update([
                'status' => 'completed',
                'finished_at' => now(),
                'source_file_count' => 1,
                'raw_record_count' => count($rows),
                'normalized_record_count' => count($rows),
                'published_record_count' => $loaded['countries'],
                'issue_count' => 0,
                'error_count' => 0,
                'summary_json' => array_merge($run->summary_json ?? [], [
                    'source_file_id' => $sourceFile->id,
                    'countries_parsed' => count($rows),
                    'created_countries' => $created,
                    'updated_countries' => $updated,
                    'raw' => $loaded,
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
            'raw' => [
                'countries' => $run->fresh()->summary_json['countries_parsed'] ?? 0,
                'regions' => 0,
                'provinces' => 0,
                'cities' => 0,
            ],
            'loaded' => $run->fresh()->summary_json['loaded'] ?? [
                'countries' => 0,
                'regions' => 0,
                'provinces' => 0,
                'cities' => 0,
            ],
            'stats' => [
                'created_countries' => $run->fresh()->summary_json['created_countries'] ?? 0,
                'updated_countries' => $run->fresh()->summary_json['updated_countries'] ?? 0,
            ],
        ];
    }

    private function assertProviderSupported(GeographyProvider $provider): void
    {
        if ($provider->driver !== 'geonames') {
            throw new RuntimeException("Il provider {$provider->code} non usa il driver GeoNames.");
        }

        $sourceUrl = strtolower(trim((string) ($provider->source_url ?? '')));
        $sourcePath = strtolower(trim((string) ($provider->source_path ?? '')));

        if (($sourceUrl !== '' && str_contains($sourceUrl, '.zip'))
            || ($sourcePath !== '' && str_ends_with($sourcePath, '.zip'))) {
            throw new RuntimeException(
                "Il provider {$provider->code} è configurato come dump paese. ".
                'Per importare tutte le nazioni usa un provider GeoNames con sorgente countryInfo.txt.'
            );
        }
    }

    private function resolveCountriesPayload(GeographyProvider $provider): array
    {
        return match ($provider->mode) {
            'local_file' => $this->countrySource->fetch($this->requireLocalPath($provider)),
            'remote_file' => $this->countrySource->fetch(null, trim((string) ($provider->source_url ?: config('geography.sources.geonames.countries_url')))),
            default => throw new RuntimeException("Mode {$provider->mode} non supportato per l'import globale nazioni."),
        };
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
}
