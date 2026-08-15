<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffDocument extends Model
{
    use HasFactory;
    use SoftDeletes;

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
        'expiry_status',
        'days_until_expiry',
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

    public function getDaysUntilExpiryAttribute(): ?int
    {
        if (! $this->expiry_date) {
            return null;
        }

        return now()->startOfDay()->diffInDays($this->expiry_date->copy()->startOfDay(), false);
    }

    public function getExpiryStatusAttribute(): string
    {
        if (! $this->expiry_date) {
            return 'no_expiry';
        }

        if ($this->days_until_expiry < 0) {
            return 'expired';
        }

        if ($this->days_until_expiry <= (int) config('staff_documents.expiry_alert_days', 30)) {
            return 'expiring';
        }

        return 'valid';
    }
}
