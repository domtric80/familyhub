<?php

namespace App\Services\Geography;

use App\Models\GeoSourceFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class GeoNamesCountrySource
{
    private const CONTINENT_NAMES = [
        'AF' => 'Africa',
        'AN' => 'Antartide',
        'AS' => 'Asia',
        'EU' => 'Europa',
        'NA' => 'Nord America',
        'OC' => 'Oceania',
        'SA' => 'Sud America',
    ];

    public function fetch(?string $localFile = null, ?string $sourceUrl = null): array
    {
        if ($localFile) {
            if (! is_file($localFile)) {
                throw new RuntimeException("File sorgente non trovato: {$localFile}");
            }

            $content = file_get_contents($localFile);

            if ($content === false) {
                throw new RuntimeException("Impossibile leggere il file sorgente: {$localFile}");
            }

            return [
                'content' => $content,
                'file_name' => basename($localFile),
                'source_url' => null,
                'source_domain' => null,
                'mime_type' => 'text/plain',
            ];
        }

        $url = trim((string) ($sourceUrl ?: config('geography.sources.geonames.countries_url')));
        $response = Http::timeout(60)->accept('text/plain')->get($url);
        $response->throw();

        $host = parse_url($url, PHP_URL_HOST);

        return [
            'content' => $response->body(),
            'file_name' => basename(parse_url($url, PHP_URL_PATH) ?: 'countryInfo.txt'),
            'source_url' => $url,
            'source_domain' => is_string($host) ? $host : null,
            'mime_type' => $response->header('Content-Type'),
        ];
    }

    public function persistFile(array $payload): GeoSourceFile
    {
        $content = (string) $payload['content'];
        $sha256 = hash('sha256', $content);
        $disk = (string) config('geography.storage_disk', config('filesystems.default'));
        $datePath = now()->format('Y/m/d');
        $fileName = (string) $payload['file_name'];
        $storagePath = "geography-sources/geonames/{$datePath}/{$sha256}-{$fileName}";

        Storage::disk($disk)->put($storagePath, $content);

        return GeoSourceFile::query()->firstOrCreate(
            [
                'source_system' => 'geonames',
                'dataset_code' => 'countries',
                'sha256' => $sha256,
            ],
            [
                'source_domain' => $payload['source_domain'],
                'dataset_name' => 'GeoNames countryInfo',
                'dataset_version' => null,
                'source_url' => $payload['source_url'],
                'storage_disk' => $disk,
                'storage_path' => $storagePath,
                'file_name' => $fileName,
                'mime_type' => $payload['mime_type'],
                'file_size_bytes' => strlen($content),
                'downloaded_at' => now(),
                'is_active' => true,
            ],
        );
    }

    public function parseCountries(string $content): array
    {
        $rows = preg_split('/\r\n|\r|\n/', $content) ?: [];
        $countries = [];

        foreach ($rows as $row) {
            if ($row === '' || str_starts_with($row, '#')) {
                continue;
            }

            $columns = explode("\t", $row);

            if (count($columns) < 5) {
                continue;
            }

            $isoCode = strtoupper(trim($columns[0] ?? ''));
            $iso3 = strtoupper(trim($columns[1] ?? ''));
            $name = trim($columns[4] ?? '');
            $continentCode = strtoupper(trim($columns[8] ?? ''));

            if ($isoCode === '' && $name === '') {
                continue;
            }

            $countries[] = [
                'iso_code' => $isoCode,
                'iso3_code' => $iso3,
                'name' => $name,
                'continent_code' => $continentCode !== '' ? $continentCode : null,
                'continent_name' => self::CONTINENT_NAMES[$continentCode] ?? null,
                'source_record_key' => $isoCode !== '' ? $isoCode : $iso3,
            ];
        }

        return $countries;
    }
}
