<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'minor_id',
        'document_type_id',
        'attachment_id',
        'label',
        'document_issuer_id',
        'issued_by',
        'issue_date',
        'expiry_date',
        'classification',
        'classification_code',
    ];

    protected $hidden = [
        'classification',
    ];

    protected $appends = [
        'classification_label',
        'issuer_label',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'expiry_date' => 'date',
        ];
    }

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function attachment(): BelongsTo
    {
        return $this->belongsTo(Attachment::class);
    }

    public function documentIssuer(): BelongsTo
    {
        return $this->belongsTo(DocumentIssuer::class);
    }

    public function documentClassification(): BelongsTo
    {
        return $this->belongsTo(DocumentClassification::class, 'classification_code', 'code');
    }

    public function getClassificationLabelAttribute(): ?string
    {
        return $this->documentClassification?->name ?? ($this->attributes['classification'] ?? null);
    }

    public function getIssuerLabelAttribute(): ?string
    {
        return $this->documentIssuer?->name ?? ($this->attributes['issued_by'] ?? null);
    }
}
