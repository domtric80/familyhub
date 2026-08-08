<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeoSourceCountryRaw extends Model
{
    protected $table = 'geo_source_countries_raw';

    protected $fillable = [
        'geo_import_run_id',
        'geo_source_file_id',
        'source_system',
        'dataset_code',
        'source_record_key',
        'source_name',
        'iso_code',
        'iso3_code',
        'continent_code',
        'continent_name',
        'raw_payload_json',
        'normalized_payload_json',
    ];

    protected function casts(): array
    {
        return [
            'raw_payload_json' => 'array',
            'normalized_payload_json' => 'array',
        ];
    }
}
