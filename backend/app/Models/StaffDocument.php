<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_member_id',
        'document_type_id',
        'attachment_id',
        'issue_date',
        'expiry_date',
        'status',
        'status_code',
    ];

    protected $hidden = [
        'status',
    ];

    protected $appends = [
        'status_label',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'expiry_date' => 'date',
        ];
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function attachment(): BelongsTo
    {
        return $this->belongsTo(Attachment::class);
    }

    public function statusLookup(): BelongsTo
    {
        return $this->belongsTo(StaffDocumentStatus::class, 'status_code', 'code');
    }

    public function getStatusLabelAttribute(): ?string
    {
        return $this->statusLookup?->name ?? ($this->attributes['status'] ?? null);
    }
}
