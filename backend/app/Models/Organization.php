<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'legal_name',
        'vat_number',
        'tax_code',
        'email',
        'phone',
    ];

    public function facilities(): HasMany
    {
        return $this->hasMany(Facility::class);
    }
}
