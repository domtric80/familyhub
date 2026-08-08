<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeoSourceFile extends Model
{
    protected $fillable = [
        'source_system',
        'source_domain',
        'dataset_code',
        'dataset_name',
        'dataset_version',
        'source_url',
        'storage_disk',
        'storage_path',
        'file_name',
        'mime_type',
        'file_size_bytes',
        'sha256',
        'downloaded_at',
        'published_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'downloaded_at' => 'datetime',
            'published_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }
}
