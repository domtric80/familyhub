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
                'auth_config_json' => null,
                'priority' => 100,
                'is_active' => true,
                'notes' => 'Provider generico mondiale per continenti, nazioni e dati geografici di base.',
            ],
        );

        $istat = GeographyProvider::query()->updateOrCreate(
            ['code' => 'ISTAT'],
            [
                'name' => 'ISTAT Italia',
                'type' => 'country_specific',
                'driver' => 'istat',
                'mode' => env('GEOGRAPHY_ISTAT_MODE', 'local_file'),
                'format' => env('GEOGRAPHY_ISTAT_FORMAT', 'csv'),
                'source_url' => env('GEOGRAPHY_ISTAT_SOURCE_URL') ?: null,
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
