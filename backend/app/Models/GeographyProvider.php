<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class GeographyProvider extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'type',
        'driver',
        'mode',
        'format',
        'source_path',
        'source_url',
        'auth_type',
        'auth_config_json',
        'priority',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'auth_config_json' => 'array',
        ];
    }

    public function countries(): BelongsToMany
    {
        return $this->belongsToMany(Country::class, 'country_geography_provider')
            ->withPivot(['id', 'is_default', 'priority', 'is_active'])
            ->withTimestamps();
    }
}
