<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeoImportIssue extends Model
{
    protected $fillable = [
        'geo_import_run_id',
        'severity',
        'issue_type',
        'entity_level',
        'source_system',
        'source_record_key',
        'target_table',
        'target_record_id',
        'message',
        'details_json',
        'is_blocking',
        'resolved_at',
        'resolution_notes',
    ];

    protected function casts(): array
    {
        return [
            'details_json' => 'array',
            'is_blocking' => 'boolean',
            'resolved_at' => 'datetime',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(GeoImportRun::class, 'geo_import_run_id');
    }
}
