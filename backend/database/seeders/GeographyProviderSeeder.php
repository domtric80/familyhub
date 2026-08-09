<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\GeographyProvider;
use Illuminate\Database\Seeder;

class GeographyProviderSeeder extends Seeder
{
    public function run(): void
    {
        GeographyProvider::query()->updateOrCreate(
            ['code' => 'GEONAMES'],
            [
                'name' => 'GeoNames Generic',
                'type' => 'generic',
                'driver' => 'geonames',
                'mode' => 'remote_file',
                'format' => 'txt',
                'source_url' => env('GEOGRAPHY_GEONAMES_COUNTRIES_URL', 'https://download.geonames.org/export/dump/countryInfo.txt'),
                'source_path' => null,
                'auth_type' => 'none',
                'auth_config_json' => [
                    'countries_source_url' => env('GEOGRAPHY_GEONAMES_COUNTRIES_URL', 'https://download.geonames.org/export/dump/countryInfo.txt'),
                    'admin1_source_url' => env('GEOGRAPHY_GEONAMES_ADMIN1_URL', 'https://download.geonames.org/export/dump/admin1CodesASCII.txt'),
                    'admin2_source_url' => env('GEOGRAPHY_GEONAMES_ADMIN2_URL', 'https://download.geonames.org/export/dump/admin2Codes.txt'),
                    'country_dump_url_template' => env('GEOGRAPHY_GEONAMES_COUNTRY_DUMP_URL_TEMPLATE', 'https://download.geonames.org/export/dump/{ISO}.zip'),
                ],
                'priority' => 100,
                'is_active' => true,
                'notes' => 'Provider generico mondiale GeoNames per nazioni, suddivisioni amministrative e città.',
            ],
        );

        $istat = GeographyProvider::query()->updateOrCreate(
            ['code' => 'ISTAT'],
            [
                'name' => 'ISTAT Italia',
                'type' => 'country_specific',
                'driver' => 'istat',
                'mode' => env('GEOGRAPHY_ISTAT_MODE', 'remote_file'),
                'format' => env('GEOGRAPHY_ISTAT_FORMAT', 'csv'),
                'source_url' => env('GEOGRAPHY_ISTAT_SOURCE_URL', 'https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv'),
                'source_path' => env('GEOGRAPHY_ISTAT_SOURCE_PATH') ?: null,
                'auth_type' => 'none',
                'auth_config_json' => null,
                'priority' => 10,
                'is_active' => true,
                'notes' => 'Provider specifico per l’Italia basato su file ufficiali ISTAT.',
            ],
        );

        $italy = Country::query()->where('iso_code', 'IT')->first();

        if ($italy) {
            $italy->providers()->syncWithoutDetaching([
                $istat->id => [
                    'is_default' => true,
                    'priority' => 10,
                    'is_active' => true,
                ],
            ]);
        }
    }
}
