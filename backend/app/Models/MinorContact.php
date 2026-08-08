<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MinorContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'minor_id',
        'contact_type_id',
        'first_name',
        'last_name',
        'phone',
        'email',
        'city_id',
        'notes',
    ];

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function contactType(): BelongsTo
    {
        return $this->belongsTo(ContactType::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function approaches(): HasMany
    {
        return $this->hasMany(MinorApproach::class);
    }

    public function linkedApproaches(): BelongsToMany
    {
        return $this->belongsToMany(MinorApproach::class, 'minor_approach_contacts')
            ->withTimestamps()
            ->withPivot('sort_order', 'contact_type_id');
    }
}
