<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffMemberCertification extends Model
{
    use HasFactory;

    protected $fillable = ['staff_member_id', 'staff_certification_type_id', 'staff_document_id', 'reference_number', 'issued_at', 'expires_at', 'status_code', 'notes'];

    protected $appends = ['validity_status', 'days_until_expiry', 'certification_type_id', 'document_id', 'issue_date', 'expiry_date', 'reference'];

    protected function casts(): array
    {
        return ['issued_at' => 'date', 'expires_at' => 'date'];
    }

    public function staffMember(): BelongsTo { return $this->belongsTo(StaffMember::class); }
    public function certificationType(): BelongsTo { return $this->belongsTo(StaffCertificationType::class, 'staff_certification_type_id'); }
    public function document(): BelongsTo { return $this->belongsTo(StaffDocument::class, 'staff_document_id'); }
    public function statusLookup(): BelongsTo { return $this->belongsTo(StaffDocumentStatus::class, 'status_code', 'code'); }

    public function getDaysUntilExpiryAttribute(): ?int
    {
        return $this->expires_at ? now()->startOfDay()->diffInDays($this->expires_at->copy()->startOfDay(), false) : null;
    }

    public function getValidityStatusAttribute(): string
    {
        if ($this->status_code === 'REVOKED') return 'revoked';
        if (! $this->expires_at) return 'valid';
        if ($this->days_until_expiry < 0) return 'expired';
        if ($this->days_until_expiry <= 30) return 'expiring';
        return 'valid';
    }

    public function getCertificationTypeIdAttribute(): int { return $this->staff_certification_type_id; }
    public function getDocumentIdAttribute(): ?int { return $this->staff_document_id; }
    public function getIssueDateAttribute(): ?string { return $this->issued_at?->toDateString(); }
    public function getExpiryDateAttribute(): ?string { return $this->expires_at?->toDateString(); }
    public function getReferenceAttribute(): ?string { return $this->reference_number; }
}
