<?php

namespace App\Services\Geography;

use App\Models\GeoSourceFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use ZipArchive;

class GeoNamesCountryDumpSource
{
    public function persistFile(array $payload, string $datasetCode, string $datasetName): GeoSourceFile
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
                'dataset_code' => $datasetCode,
                'sha256' => $sha256,
            ],
            [
                'source_domain' => $payload['source_domain'],
                'dataset_name' => $datasetName,
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

    public function fetchText(?string $localPath = null, ?string $url = null, string $fallbackName = 'source.txt'): array
    {
        if ($localPath) {
            if (! is_file($localPath)) {
                throw new RuntimeException("File sorgente non trovato: {$localPath}");
            }

            $content = file_get_contents($localPath);

            if ($content === false) {
                throw new RuntimeException("Impossibile leggere il file sorgente: {$localPath}");
            }

            return [
                'content' => $content,
                'file_name' => basename($localPath),
                'source_url' => null,
                'source_domain' => null,
                'mime_type' => 'text/plain',
            ];
        }

        if (! $url) {
            throw new RuntimeException('Sorgente testuale GeoNames non configurata.');
        }

        $response = Http::timeout(120)->accept('text/plain')->get($url);
        $response->throw();
        $host = parse_url($url, PHP_URL_HOST);

        return [
            'content' => $response->body(),
            'file_name' => basename(parse_url($url, PHP_URL_PATH) ?: $fallbackName),
            'source_url' => $url,
            'source_domain' => is_string($host) ? $host : null,
            'mime_type' => $response->header('Content-Type'),
        ];
    }

    public function fetchBinary(?string $localPath = null, ?string $url = null, string $fallbackName = 'source.zip'): array
    {
        if ($localPath) {
            if (! is_file($localPath)) {
                throw new RuntimeException("File sorgente non trovato: {$localPath}");
            }

            $content = file_get_contents($localPath);

            if ($content === false) {
                throw new RuntimeException("Impossibile leggere il file sorgente: {$localPath}");
            }

            return [
                'content' => $content,
                'file_name' => basename($localPath),
                'source_url' => null,
                'source_domain' => null,
                'mime_type' => 'application/zip',
            ];
        }

        if (! $url) {
            throw new RuntimeException('Sorgente binaria GeoNames non configurata.');
        }

        $response = Http::timeout(180)->get($url);
        $response->throw();
        $host = parse_url($url, PHP_URL_HOST);

        return [
            'content' => $response->body(),
            'file_name' => basename(parse_url($url, PHP_URL_PATH) ?: $fallbackName),
            'source_url' => $url,
            'source_domain' => is_string($host) ? $host : null,
            'mime_type' => $response->header('Content-Type') ?: 'application/octet-stream',
        ];
    }

    public function extractFirstTxtFromZip(string $binaryContent, string $sourceName = 'source.zip'): array
    {
        $tmpDir = storage_path('app/tmp/geography');

        if (! is_dir($tmpDir)) {
            mkdir($tmpDir, 0775, true);
        }

        $tmpZip = $tmpDir.'/'.uniqid('geonames-', true).'-'.$sourceName;
        file_put_contents($tmpZip, $binaryContent);

        try {
            if (class_exists(ZipArchive::class)) {
                return $this->extractWithZipArchive($tmpZip, $sourceName);
            }

            return $this->extractWithUnzipCli($tmpZip, $sourceName);
        } finally {
            @unlink($tmpZip);
        }
    }

    public function extractPreferredTxtToTempFile(string $binaryContent, string $sourceName = 'source.zip'): array
    {
        $tmpDir = storage_path('app/tmp/geography');

        if (! is_dir($tmpDir)) {
            mkdir($tmpDir, 0775, true);
        }

        $tmpZip = $tmpDir.'/'.uniqid('geonames-', true).'-'.$sourceName;
        file_put_contents($tmpZip, $binaryContent);

        try {
            $selectedEntry = $this->selectPreferredTxtEntry($tmpZip, $sourceName);
            $tmpTxt = $tmpDir.'/'.uniqid('geonames-txt-', true).'-'.basename($selectedEntry);

            if (class_exists(ZipArchive::class)) {
                $zip = new ZipArchive();
                $result = $zip->open($tmpZip);

                if ($result !== true) {
                    throw new RuntimeException("Impossibile aprire l'archivio GeoNames {$sourceName}.");
                }

                $stream = $zip->getStream($selectedEntry);

                if ($stream === false) {
                    $zip->close();
                    throw new RuntimeException("Impossibile aprire il file {$selectedEntry} nell'archivio GeoNames {$sourceName}.");
                }

                $target = fopen($tmpTxt, 'wb');
                if ($target === false) {
                    fclose($stream);
                    $zip->close();
                    throw new RuntimeException("Impossibile creare il file temporaneo {$tmpTxt}.");
                }

                stream_copy_to_stream($stream, $target);
                fclose($stream);
                fclose($target);
                $zip->close();
            } else {
                $command = 'unzip -p '.escapeshellarg($tmpZip).' '.escapeshellarg($selectedEntry).' > '.escapeshellarg($tmpTxt);
                exec($command, $output, $code);

                if ($code !== 0 || ! is_file($tmpTxt)) {
                    throw new RuntimeException("Impossibile estrarre il file {$selectedEntry} dall'archivio GeoNames {$sourceName}.");
                }
            }

            return [
                'file_name' => basename($selectedEntry),
                'path' => $tmpTxt,
                'mime_type' => 'text/plain',
            ];
        } finally {
            @unlink($tmpZip);
        }
    }

    public function iterateCountryDumpFile(string $filePath, string $countryIsoCode): \Generator
    {
        $countryIsoCode = strtoupper($countryIsoCode);
        $handle = fopen($filePath, 'rb');

        if ($handle === false) {
            throw new RuntimeException("Impossibile aprire il file dump GeoNames {$filePath}.");
        }

        try {
            while (($row = fgets($handle)) !== false) {
                $row = trim($row);

                if ($row === '' || str_starts_with($row, '#')) {
                    continue;
                }

                $columns = explode("\t", $row);

                if (count($columns) < 19) {
                    continue;
                }

                $featureClass = trim((string) ($columns[6] ?? ''));
                $featureCode = trim((string) ($columns[7] ?? ''));
                $rowCountryCode = strtoupper(trim((string) ($columns[8] ?? '')));

                if ($rowCountryCode !== $countryIsoCode || $featureClass !== 'P') {
                    continue;
                }

                $admin1Code = trim((string) ($columns[10] ?? ''));
                if ($admin1Code === '') {
                    $admin1Code = '00';
                }

                $admin2Code = trim((string) ($columns[11] ?? ''));
                if ($admin2Code === '') {
                    $admin2Code = '00';
                }

                $regionKey = "{$countryIsoCode}.{$admin1Code}";
                $provinceKey = "{$countryIsoCode}.{$admin1Code}.{$admin2Code}";

                yield [
                    'source_record_key' => trim((string) ($columns[0] ?? '')),
                    'source_parent_key' => $provinceKey,
                    'source_name' => trim((string) ($columns[1] ?? '')),
                    'ascii_name' => trim((string) ($columns[2] ?? '')),
                    'alternate_names' => trim((string) ($columns[3] ?? '')),
                    'latitude' => $this->nullableFloat($columns[4] ?? null),
                    'longitude' => $this->nullableFloat($columns[5] ?? null),
                    'feature_code' => $featureCode,
                    'country_code' => $rowCountryCode,
                    'region_key' => $regionKey,
                    'region_code' => $admin1Code,
                    'province_key' => $provinceKey,
                    'province_code' => $admin2Code,
                    'admin3_code' => trim((string) ($columns[12] ?? '')) ?: null,
                    'admin4_code' => trim((string) ($columns[13] ?? '')) ?: null,
                    'population' => $this->nullableInt($columns[14] ?? null),
                    'elevation' => $this->nullableInt($columns[15] ?? null),
                    'dem' => $this->nullableInt($columns[16] ?? null),
                    'timezone' => trim((string) ($columns[17] ?? '')) ?: null,
                    'modification_date' => trim((string) ($columns[18] ?? '')) ?: null,
                ];
            }
        } finally {
            fclose($handle);
        }
    }

    private function extractWithZipArchive(string $tmpZip, string $sourceName): array
    {
        $zip = new ZipArchive();
        $result = $zip->open($tmpZip);

        if ($result !== true) {
            throw new RuntimeException("Impossibile aprire l'archivio GeoNames {$sourceName}.");
        }

        $preferredEntryNames = $this->preferredTxtEntryNames($sourceName);
        $selectedName = null;
        $selectedContent = false;

        foreach ($preferredEntryNames as $preferredEntryName) {
            for ($index = 0; $index < $zip->numFiles; $index++) {
                $entryName = (string) $zip->getNameIndex($index);
                if (basename($entryName) === $preferredEntryName) {
                    $selectedName = basename($entryName);
                    $selectedContent = $zip->getFromIndex($index);
                    break 2;
                }
            }
        }

        if ($selectedName === null) {
            for ($index = 0; $index < $zip->numFiles; $index++) {
                $entryName = (string) $zip->getNameIndex($index);

                if (str_ends_with(strtolower($entryName), '.txt')) {
                    $selectedName = basename($entryName);
                    $selectedContent = $zip->getFromIndex($index);
                    break;
                }
            }
        }

        $zip->close();

        if ($selectedName === null || $selectedContent === false) {
            throw new RuntimeException("L'archivio GeoNames {$sourceName} non contiene alcun file TXT valido.");
        }

        return [
            'content' => (string) $selectedContent,
            'file_name' => $selectedName,
            'mime_type' => 'text/plain',
        ];
    }

    private function extractWithUnzipCli(string $tmpZip, string $sourceName): array
    {
        $listOutput = [];
        $listCode = 0;
        exec('unzip -Z1 '.escapeshellarg($tmpZip), $listOutput, $listCode);

        if ($listCode !== 0) {
            throw new RuntimeException("Impossibile ispezionare l'archivio GeoNames {$sourceName} tramite unzip.");
        }

        $preferredEntryNames = $this->preferredTxtEntryNames($sourceName);
        $selectedEntry = null;

        foreach ($preferredEntryNames as $preferredEntryName) {
            foreach ($listOutput as $entryName) {
                $entryName = trim((string) $entryName);

                if ($entryName !== '' && basename($entryName) === $preferredEntryName) {
                    $selectedEntry = $entryName;
                    break 2;
                }
            }
        }

        if ($selectedEntry === null) {
            foreach ($listOutput as $entryName) {
                $entryName = trim((string) $entryName);

                if ($entryName !== '' && str_ends_with(strtolower($entryName), '.txt')) {
                    $selectedEntry = $entryName;
                    break;
                }
            }
        }

        if ($selectedEntry === null) {
            throw new RuntimeException("L'archivio GeoNames {$sourceName} non contiene alcun file TXT valido.");
        }

        $content = shell_exec('unzip -p '.escapeshellarg($tmpZip).' '.escapeshellarg($selectedEntry));

        if (! is_string($content) || $content === '') {
            throw new RuntimeException("Impossibile estrarre il file {$selectedEntry} dall'archivio GeoNames {$sourceName}.");
        }

        return [
            'content' => $content,
            'file_name' => basename($selectedEntry),
            'mime_type' => 'text/plain',
        ];
    }

    private function preferredTxtEntryNames(string $sourceName): array
    {
        $base = pathinfo($sourceName, PATHINFO_FILENAME);
        $base = trim((string) $base);

        if ($base === '') {
            return [];
        }

        return [
            strtoupper($base).'.txt',
            strtolower($base).'.txt',
            $base.'.txt',
        ];
    }

    public function parseAdmin1(string $content, string $countryIsoCode): array
    {
        $countryIsoCode = strtoupper($countryIsoCode);
        $rows = preg_split('/\r\n|\r|\n/', $content) ?: [];
        $items = [];

        foreach ($rows as $row) {
            if ($row === '' || str_starts_with($row, '#')) {
                continue;
            }

            $columns = explode("\t", $row);

            if (count($columns) < 2) {
                continue;
            }

            $fullCode = trim((string) ($columns[0] ?? ''));

            if (! str_starts_with($fullCode, $countryIsoCode.'.')) {
                continue;
            }

            $code = $this->lastSegment($fullCode);
            $items[] = [
                'source_record_key' => $fullCode,
                'source_parent_key' => $countryIsoCode,
                'code' => $code,
                'source_name' => trim((string) ($columns[1] ?? $code)),
                'ascii_name' => trim((string) ($columns[2] ?? '')),
                'geoname_id' => $this->nullableInt($columns[3] ?? null),
            ];
        }

        return $items;
    }

    public function parseAdmin2(string $content, string $countryIsoCode): array
    {
        $countryIsoCode = strtoupper($countryIsoCode);
        $rows = preg_split('/\r\n|\r|\n/', $content) ?: [];
        $items = [];

        foreach ($rows as $row) {
            if ($row === '' || str_starts_with($row, '#')) {
                continue;
            }

            $columns = explode("\t", $row);

            if (count($columns) < 2) {
                continue;
            }

            $fullCode = trim((string) ($columns[0] ?? ''));

            if (! str_starts_with($fullCode, $countryIsoCode.'.')) {
                continue;
            }

            $segments = explode('.', $fullCode);
            if (count($segments) < 3) {
                continue;
            }

            $regionKey = implode('.', array_slice($segments, 0, 2));
            $code = (string) end($segments);

            $items[] = [
                'source_record_key' => $fullCode,
                'source_parent_key' => $regionKey,
                'code' => $code,
                'source_name' => trim((string) ($columns[1] ?? $code)),
                'ascii_name' => trim((string) ($columns[2] ?? '')),
                'geoname_id' => $this->nullableInt($columns[3] ?? null),
            ];
        }

        return $items;
    }

    public function parseCountryDump(string $content, string $countryIsoCode): array
    {
        $countryIsoCode = strtoupper($countryIsoCode);
        $rows = preg_split('/\r\n|\r|\n/', $content) ?: [];
        $cities = [];

        foreach ($rows as $row) {
            if ($row === '' || str_starts_with($row, '#')) {
                continue;
            }

            $columns = explode("\t", $row);

            if (count($columns) < 19) {
                continue;
            }

            $featureClass = trim((string) ($columns[6] ?? ''));
            $featureCode = trim((string) ($columns[7] ?? ''));
            $rowCountryCode = strtoupper(trim((string) ($columns[8] ?? '')));

            if ($rowCountryCode !== $countryIsoCode || $featureClass !== 'P') {
                continue;
            }

            $admin1Code = trim((string) ($columns[10] ?? ''));
            if ($admin1Code === '') {
                $admin1Code = '00';
            }

            $admin2Code = trim((string) ($columns[11] ?? ''));
            if ($admin2Code === '') {
                $admin2Code = '00';
            }

            $regionKey = "{$countryIsoCode}.{$admin1Code}";
            $provinceKey = "{$countryIsoCode}.{$admin1Code}.{$admin2Code}";

            $cities[] = [
                'source_record_key' => trim((string) ($columns[0] ?? '')),
                'source_parent_key' => $provinceKey,
                'source_name' => trim((string) ($columns[1] ?? '')),
                'ascii_name' => trim((string) ($columns[2] ?? '')),
                'alternate_names' => trim((string) ($columns[3] ?? '')),
                'latitude' => $this->nullableFloat($columns[4] ?? null),
                'longitude' => $this->nullableFloat($columns[5] ?? null),
                'feature_code' => $featureCode,
                'country_code' => $rowCountryCode,
                'region_key' => $regionKey,
                'region_code' => $admin1Code,
                'province_key' => $provinceKey,
                'province_code' => $admin2Code,
                'admin3_code' => trim((string) ($columns[12] ?? '')) ?: null,
                'admin4_code' => trim((string) ($columns[13] ?? '')) ?: null,
                'population' => $this->nullableInt($columns[14] ?? null),
                'elevation' => $this->nullableInt($columns[15] ?? null),
                'dem' => $this->nullableInt($columns[16] ?? null),
                'timezone' => trim((string) ($columns[17] ?? '')) ?: null,
                'modification_date' => trim((string) ($columns[18] ?? '')) ?: null,
            ];
        }

        return $cities;
    }

    private function selectPreferredTxtEntry(string $tmpZip, string $sourceName): string
    {
        $entries = [];

        if (class_exists(ZipArchive::class)) {
            $zip = new ZipArchive();
            $result = $zip->open($tmpZip);

            if ($result !== true) {
                throw new RuntimeException("Impossibile aprire l'archivio GeoNames {$sourceName}.");
            }

            for ($index = 0; $index < $zip->numFiles; $index++) {
                $entries[] = (string) $zip->getNameIndex($index);
            }

            $zip->close();
        } else {
            $listOutput = [];
            $listCode = 0;
            exec('unzip -Z1 '.escapeshellarg($tmpZip), $listOutput, $listCode);

            if ($listCode !== 0) {
                throw new RuntimeException("Impossibile ispezionare l'archivio GeoNames {$sourceName} tramite unzip.");
            }

            $entries = array_map(static fn ($entry) => trim((string) $entry), $listOutput);
        }

        $preferredEntryNames = $this->preferredTxtEntryNames($sourceName);

        foreach ($preferredEntryNames as $preferredEntryName) {
            foreach ($entries as $entryName) {
                if ($entryName !== '' && basename($entryName) === $preferredEntryName) {
                    return $entryName;
                }
            }
        }

        foreach ($entries as $entryName) {
            if ($entryName !== '' && str_ends_with(strtolower($entryName), '.txt')) {
                return $entryName;
            }
        }

        throw new RuntimeException("L'archivio GeoNames {$sourceName} non contiene alcun file TXT valido.");
    }

    private function lastSegment(string $code): string
    {
        $segments = explode('.', $code);

        return (string) end($segments);
    }

    private function nullableInt(mixed $value): ?int
    {
        $value = trim((string) $value);

        return $value === '' ? null : (int) $value;
    }

    private function nullableFloat(mixed $value): ?float
    {
        $value = trim((string) $value);

        return $value === '' ? null : (float) $value;
    }
}
