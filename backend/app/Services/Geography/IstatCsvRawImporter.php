<?php

namespace App\Services\Geography;

use App\Models\GeoImportRun;
use App\Models\GeoImportIssue;
use App\Models\GeoSourceCityRaw;
use App\Models\GeoSourceCountryRaw;
use App\Models\GeoSourceProvinceRaw;
use App\Models\GeoSourceRegionRaw;
use App\Models\GeoSourceFile;
use Illuminate\Support\Facades\Storage;

class IstatCsvRawImporter
{
    public function __construct(
        private readonly IstatCityCsvSource $source = new IstatCityCsvSource(),
        private readonly GeoSyncRunLogger $runLogger = new GeoSyncRunLogger(),
    ) {
    }

    public function import(GeoImportRun $run, string $filePath): array
    {
        $content = file_get_contents($filePath);
        $sha256 = hash('sha256', (string) $content);
        $disk = (string) config('geography.storage_disk', 'local');
        $storagePath = 'geography-sources/istat/'.now()->format('Y/m/d').'/'.$sha256.'-'.basename($filePath);
        Storage::disk($disk)->put($storagePath, (string) $content);

        $sourceFile = GeoSourceFile::query()->firstOrCreate(
            [
                'source_system' => 'istat',
                'dataset_code' => 'italy_cities_csv',
                'sha256' => $sha256,
            ],
            [
                'source_domain' => 'local-file',
                'dataset_name' => 'ISTAT cities CSV import',
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

        $countryKey = 'IT';
        GeoSourceCountryRaw::query()->firstOrCreate(
            [
                'geo_import_run_id' => $run->id,
                'source_system' => 'istat',
                'dataset_code' => 'italy_cities_csv',
                'source_record_key' => $countryKey,
            ],
            [
                'geo_source_file_id' => $sourceFile->id,
                'source_name' => 'Italia',
                'iso_code' => 'IT',
                'iso3_code' => 'ITA',
                'continent_code' => 'EU',
                'continent_name' => 'Europa',
                'raw_payload_json' => ['country_iso_code' => 'IT'],
                'normalized_payload_json' => ['country_iso_code' => 'IT'],
            ],
        );

        $regions = [];
        $provinces = [];
        $cities = 0;

        foreach ($rows as $row) {
            $regionKey = 'IT-'.($row['region_code'] ?: md5($row['region_name']));
            $provinceKey = $regionKey.'-'.($row['province_code'] ?: md5($row['province_name']));
            $cityKey = $row['city_istat_code'] !== '' ? $row['city_istat_code'] : $provinceKey.'-'.md5($row['city_name']);

            if ($row['region_name'] === '' || $row['province_name'] === '' || $row['city_name'] === '') {
                $this->runLogger->addIssue(
                    $run,
                    'warning',
                    'istat_incomplete_row',
                    'city',
                    'Riga ISTAT incompleta: regione, provincia o comune mancante.',
                    false,
                    'istat',
                    $cityKey,
                    $row,
                );
            }

            if (! isset($regions[$regionKey])) {
                GeoSourceRegionRaw::query()->firstOrCreate(
                    [
                        'geo_import_run_id' => $run->id,
                        'source_system' => 'istat',
                        'dataset_code' => 'italy_cities_csv',
                        'source_record_key' => $regionKey,
                    ],
                    [
                        'geo_source_file_id' => $sourceFile->id,
                        'source_parent_key' => $countryKey,
                        'source_name' => $row['region_name'],
                        'code' => $row['region_code'],
                        'istat_code' => $row['region_code'],
                        'raw_payload_json' => $row,
                        'normalized_payload_json' => $row,
                    ],
                );
                $regions[$regionKey] = true;
            }

            if (! isset($provinces[$provinceKey])) {
                GeoSourceProvinceRaw::query()->firstOrCreate(
                    [
                        'geo_import_run_id' => $run->id,
                        'source_system' => 'istat',
                        'dataset_code' => 'italy_cities_csv',
                        'source_record_key' => $provinceKey,
                    ],
                    [
                        'geo_source_file_id' => $sourceFile->id,
                        'source_parent_key' => $regionKey,
                        'source_name' => $row['province_name'],
                        'code' => $row['province_code'],
                        'istat_code' => $row['province_code'],
                        'vehicle_code' => $row['vehicle_code'],
                        'raw_payload_json' => $row,
                        'normalized_payload_json' => $row,
                    ],
                );
                $provinces[$provinceKey] = true;
            }

            GeoSourceCityRaw::query()->create([
                'geo_import_run_id' => $run->id,
                'geo_source_file_id' => $sourceFile->id,
                'source_system' => 'istat',
                'dataset_code' => 'italy_cities_csv',
                'source_record_key' => $cityKey,
                'source_parent_key' => $provinceKey,
                'source_name' => $row['city_name'],
                'istat_code' => $row['city_istat_code'] ?: null,
                'cadastre_code' => $row['cadastre_code'] ?: null,
                'postal_code' => $row['postal_code'] ?: null,
                'raw_payload_json' => $row,
                'normalized_payload_json' => $row,
            ]);
            $cities++;
        }

        return [
            'source_file_id' => $sourceFile->id,
            'countries' => 1,
            'regions' => count($regions),
            'provinces' => count($provinces),
            'cities' => $cities,
            'issues' => GeoImportIssue::query()->where('geo_import_run_id', $run->id)->count(),
        ];
    }
}
