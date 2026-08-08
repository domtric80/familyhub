<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class MinorNote extends Model
{
    protected $fillable = [
        'minor_id',
        'facility_id',
        'classification_code',
        'title',
        'body_encrypted',
        'is_encrypted',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    protected $appends = [
        'body',
    ];

    protected function casts(): array
    {
        return [
            'is_encrypted' => 'boolean',
        ];
    }

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function documentClassification(): BelongsTo
    {
        return $this->belongsTo(DocumentClassification::class, 'classification_code', 'code');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function getBodyAttribute(): ?string
    {
        if (! $this->body_encrypted) {
            return null;
        }

        return Crypt::decryptString($this->body_encrypted);
    }
}
