<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Attachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'facility_id',
        'owner_type',
        'owner_id',
        'document_type_id',
        'disk',
        'bucket',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
        'sha256',
        'is_encrypted',
        'security_status',
        'security_notes',
        'scanned_at',
        'quarantined_at',
        'released_at',
        'scanner_engine',
        'scanner_signature',
        'uploaded_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'is_encrypted' => 'boolean',
            'scanned_at' => 'datetime',
            'quarantined_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    public function minorDocuments(): HasMany
    {
        return $this->hasMany(MinorDocument::class);
    }

    public function staffDocuments(): HasMany
    {
        return $this->hasMany(StaffDocument::class);
    }
}
