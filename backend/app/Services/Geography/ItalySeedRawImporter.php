<?php

namespace App\Services\Geography;

use App\Models\GeoImportRun;
use App\Models\GeoSourceCityRaw;
use App\Models\GeoSourceCountryRaw;
use App\Models\GeoSourceProvinceRaw;
use App\Models\GeoSourceRegionRaw;

class ItalySeedRawImporter
{
    public function __construct(
        private readonly ItalySeedSource $source = new ItalySeedSource(),
    ) {
    }

    public function import(GeoImportRun $run): array
    {
        $dataset = $this->source->dataset();

        GeoSourceCountryRaw::query()->create([
            'geo_import_run_id' => $run->id,
            'geo_source_file_id' => null,
            'source_system' => 'seed',
            'dataset_code' => 'italy_admin_seed',
            'source_record_key' => $dataset['country']['source_record_key'],
            'source_name' => $dataset['country']['name'],
            'iso_code' => $dataset['country']['iso_code'],
            'iso3_code' => 'ITA',
            'continent_code' => 'EU',
            'continent_name' => 'Europa',
            'raw_payload_json' => $dataset['country'],
            'normalized_payload_json' => $dataset['country'],
        ]);

        $regionCount = 0;
        $provinceCount = 0;
        $cityCount = 0;

        foreach ($dataset['regions'] as $region) {
            GeoSourceRegionRaw::query()->create([
                'geo_import_run_id' => $run->id,
                'geo_source_file_id' => null,
                'source_system' => 'seed',
                'dataset_code' => 'italy_admin_seed',
                'source_record_key' => $region['source_record_key'],
                'source_parent_key' => $region['source_parent_key'],
                'source_name' => $region['name'],
                'code' => $region['code'],
                'istat_code' => null,
                'raw_payload_json' => $region,
                'normalized_payload_json' => $region,
            ]);
            $regionCount++;

            foreach ($region['provinces'] as $province) {
                GeoSourceProvinceRaw::query()->create([
                    'geo_import_run_id' => $run->id,
                    'geo_source_file_id' => null,
                    'source_system' => 'seed',
                    'dataset_code' => 'italy_admin_seed',
                    'source_record_key' => $province['source_record_key'],
                    'source_parent_key' => $province['source_parent_key'],
                    'source_name' => $province['name'],
                    'code' => $province['code'],
                    'istat_code' => null,
                    'vehicle_code' => $province['vehicle_code'],
                    'raw_payload_json' => $province,
                    'normalized_payload_json' => $province,
                ]);
                $provinceCount++;

                foreach ($province['cities'] as $city) {
                    GeoSourceCityRaw::query()->create([
                        'geo_import_run_id' => $run->id,
                        'geo_source_file_id' => null,
                        'source_system' => 'seed',
                        'dataset_code' => 'italy_admin_seed',
                        'source_record_key' => $city['source_record_key'],
                        'source_parent_key' => $province['source_record_key'],
                        'source_name' => $city['name'],
                        'istat_code' => null,
                        'cadastre_code' => $city['cadastre_code'],
                        'postal_code' => $city['postal_code'],
                        'raw_payload_json' => $city,
                        'normalized_payload_json' => $city,
                    ]);
                    $cityCount++;
                }
            }
        }

        return [
            'countries' => 1,
            'regions' => $regionCount,
            'provinces' => $provinceCount,
            'cities' => $cityCount,
        ];
    }
}
