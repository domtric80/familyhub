<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'scope',
    ];

    protected $hidden = [
        'scope',
    ];

    protected $appends = [
        'document_scope_code',
    ];

    public function getDocumentScopeCodeAttribute(): ?string
    {
        return $this->attributes['scope'] ?? null;
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function documentScope(): BelongsTo
    {
        return $this->belongsTo(DocumentScope::class, 'scope', 'code');
    }
}
