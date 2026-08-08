<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    use HasFactory;

    protected $fillable = [
        'iso_code',
        'name',
    ];

    public function regions(): HasMany
    {
        return $this->hasMany(Region::class);
    }

    public function providers(): BelongsToMany
    {
        return $this->belongsToMany(GeographyProvider::class, 'country_geography_provider')
            ->withPivot(['id', 'is_default', 'priority', 'is_active'])
            ->withTimestamps();
    }
}
