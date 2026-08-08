<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GeoImportRun extends Model
{
    protected $fillable = [
        'run_uuid',
        'trigger_mode',
        'scope',
        'status',
        'started_at',
        'finished_at',
        'source_file_count',
        'raw_record_count',
        'normalized_record_count',
        'published_record_count',
        'issue_count',
        'error_count',
        'summary_json',
        'initiated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'summary_json' => 'array',
        ];
    }

    public function initiatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by_user_id');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(GeoImportRunStep::class);
    }

    public function issues(): HasMany
    {
        return $this->hasMany(GeoImportIssue::class);
    }
}
