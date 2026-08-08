<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeoSourceRegionRaw extends Model
{
    protected $table = 'geo_source_regions_raw';

    protected $fillable = [
        'geo_import_run_id',
        'geo_source_file_id',
        'source_system',
        'dataset_code',
        'source_record_key',
        'source_parent_key',
        'source_name',
        'code',
        'istat_code',
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
