<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentClassification extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'allowed_role_codes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'allowed_role_codes' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
