<?php

namespace App\Services\Geography;

use App\Models\Country;
use App\Models\GeoImportRun;
use App\Models\GeographyProvider;
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
    ) {
    }

    public function import(Country $country, GeographyProvider $provider, ?int $initiatedByUserId = null): array
    {
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
        $run = $this->createRun('on_demand_country', 'geonames_country_import', $initiatedByUserId, [
            'source' => 'geonames',
            'dataset' => 'countries',
            'country_iso_code' => $country->iso_code,
            'provider_code' => $provider->code,
            'mode' => $provider->mode,
        ]);

        try {
            $payload = $this->resolveGeoNamesPayload($provider);
            $sourceFile = $this->geoNamesCountrySource->persistFile($payload);
            $rows = $this->geoNamesCountrySource->parseCountries((string) $payload['content']);

            $match = collect($rows)->first(fn (array $row) => strtoupper((string) ($row['iso_code'] ?? '')) === strtoupper($country->iso_code));

            if (! $match) {
                throw new RuntimeException("Nazione {$country->iso_code} non trovata nel dataset del provider {$provider->code}.");
            }

            DB::transaction(function () use ($country, $match): void {
                $country->update([
                    'iso_code' => strtoupper((string) $match['iso_code']),
                    'name' => (string) $match['name'],
                ]);
            });

            $run->update([
                'status' => 'completed',
                'finished_at' => now(),
                'source_file_count' => 1,
                'raw_record_count' => count($rows),
                'normalized_record_count' => count($rows),
                'published_record_count' => 1,
                'issue_count' => 0,
                'error_count' => 0,
                'summary_json' => array_merge($run->summary_json ?? [], [
                    'source_file_id' => $sourceFile->id,
                    'countries_parsed' => count($rows),
                    'loaded' => [
                        'countries' => 1,
                        'regions' => 0,
                        'provinces' => 0,
                        'cities' => 0,
                    ],
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
            'raw' => [
                'countries' => 1,
                'regions' => 0,
                'provinces' => 0,
                'cities' => 0,
            ],
            'loaded' => [
                'countries' => 1,
                'regions' => 0,
                'provinces' => 0,
                'cities' => 0,
            ],
            'warning' => 'Per il provider generico è attivo solo il popolamento della nazione. Suddivisioni amministrative non ancora disponibili.',
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

    private function resolveGeoNamesPayload(GeographyProvider $provider): array
    {
        return match ($provider->mode) {
            'local_file' => $this->geoNamesCountrySource->fetch($this->requireLocalPath($provider)),
            'remote_file' => $this->fetchRemoteTextFile($provider),
            default => throw new RuntimeException("Mode {$provider->mode} non supportato dal driver {$provider->driver}."),
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

    private function fetchRemoteTextFile(GeographyProvider $provider): array
    {
        $url = trim((string) $provider->source_url);

        if ($url === '') {
            throw new RuntimeException("Provider {$provider->code} non configurato: source_url mancante.");
        }

        $response = Http::timeout(120)->accept('text/plain')->get($url);
        $response->throw();
        $host = parse_url($url, PHP_URL_HOST);

        return [
            'content' => $response->body(),
            'file_name' => basename(parse_url($url, PHP_URL_PATH) ?: 'source.txt'),
            'source_url' => $url,
            'source_domain' => is_string($host) ? $host : null,
            'mime_type' => $response->header('Content-Type'),
        ];
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
