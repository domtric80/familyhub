<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeoImportRunStep extends Model
{
    protected $fillable = [
        'geo_import_run_id',
        'step_code',
        'status',
        'started_at',
        'finished_at',
        'records_in',
        'records_out',
        'message',
        'metrics_json',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'metrics_json' => 'array',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(GeoImportRun::class, 'geo_import_run_id');
    }
}
