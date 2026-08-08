<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeoSyncDecision extends Model
{
    protected $fillable = [
        'geo_import_run_id',
        'entity_level',
        'action',
        'target_table',
        'target_record_id',
        'source_system',
        'source_record_key',
        'before_json',
        'after_json',
        'reason_code',
        'executed',
    ];

    protected function casts(): array
    {
        return [
            'before_json' => 'array',
            'after_json' => 'array',
            'executed' => 'boolean',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(GeoImportRun::class, 'geo_import_run_id');
    }
}
