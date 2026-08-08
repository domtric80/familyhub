<?php

namespace App\Services\Geography;

use App\Models\GeoImportRun;
use App\Models\GeoSourceCityHistoryRaw;
use App\Models\GeoSourceFile;
use Illuminate\Support\Facades\Storage;

class AnprCityHistoryRawImporter
{
    public function __construct(
        private readonly AnprCityHistoryCsvSource $source = new AnprCityHistoryCsvSource(),
        private readonly GeoSyncRunLogger $runLogger = new GeoSyncRunLogger(),
    ) {
    }

    public function import(GeoImportRun $run, string $filePath): array
    {
        $content = file_get_contents($filePath);
        $sha256 = hash('sha256', (string) $content);
        $disk = (string) config('geography.storage_disk', 'local');
        $storagePath = 'geography-sources/anpr/'.now()->format('Y/m/d').'/'.$sha256.'-'.basename($filePath);
        Storage::disk($disk)->put($storagePath, (string) $content);

        $sourceFile = GeoSourceFile::query()->firstOrCreate(
            [
                'source_system' => 'anpr',
                'dataset_code' => 'city_history_csv',
                'sha256' => $sha256,
            ],
            [
                'source_domain' => 'local-file',
                'dataset_name' => 'ANPR city history CSV import',
                'source_url' => null,
                'storage_disk' => $disk,
                'storage_path' => $storagePath,
                'file_name' => basename($filePath),
                'mime_type' => 'text/csv',
                'file_size_bytes' => strlen((string) $content),
                'downloaded_at' => now(),
                'is_active' => true,
            ],
        );

        $rows = $this->source->parseFile($filePath);
        $count = 0;

        foreach ($rows as $row) {
            $eventType = $row['event_type'] !== '' ? $row['event_type'] : 'unknown';
            $sourceRecordKey = $row['city_istat_code'] !== '' ? $row['city_istat_code'] : md5($row['city_name'].$row['event_date']);
            $relatedKey = $row['related_city_istat_code'] !== '' ? $row['related_city_istat_code'] : null;

            if ($eventType === 'unknown') {
                $this->runLogger->addIssue(
                    $run,
                    'warning',
                    'anpr_missing_event_type',
                    'history',
                    'Evento storico ANPR senza event_type esplicito.',
                    false,
                    'anpr',
                    $sourceRecordKey,
                    $row,
                );
            }

            GeoSourceCityHistoryRaw::query()->create([
                'geo_import_run_id' => $run->id,
                'geo_source_file_id' => $sourceFile->id,
                'source_system' => 'anpr',
                'dataset_code' => 'city_history_csv',
                'source_record_key' => $sourceRecordKey,
                'related_source_record_key' => $relatedKey,
                'event_type' => $eventType,
                'event_date' => $row['event_date'] !== '' ? $row['event_date'] : null,
                'source_name' => $row['city_name'] !== '' ? $row['city_name'] : null,
                'notes' => $row['notes'] !== '' ? $row['notes'] : null,
                'raw_payload_json' => $row,
                'normalized_payload_json' => $row,
            ]);

            $count++;
        }

        return [
            'source_file_id' => $sourceFile->id,
            'history_events' => $count,
            'issues' => $run->issues()->count(),
        ];
    }
}
