<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
    ];

    public function minorContacts(): HasMany
    {
        return $this->hasMany(MinorContact::class);
    }
}
