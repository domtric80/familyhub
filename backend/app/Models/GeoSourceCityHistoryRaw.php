<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeoSourceCityHistoryRaw extends Model
{
    protected $table = 'geo_source_city_history_raw';

    protected $fillable = [
        'geo_import_run_id',
        'geo_source_file_id',
        'source_system',
        'dataset_code',
        'source_record_key',
        'related_source_record_key',
        'event_type',
        'event_date',
        'source_name',
        'notes',
        'raw_payload_json',
        'normalized_payload_json',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'raw_payload_json' => 'array',
            'normalized_payload_json' => 'array',
        ];
    }
}
