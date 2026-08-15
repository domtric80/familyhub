<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacilityCertificationRequirement extends Model
{
    use HasFactory;

    protected $fillable = ['facility_id', 'staff_certification_type_id', 'qualification_code', 'is_required', 'alert_days', 'notes'];

    protected $appends = ['certification_type_id', 'is_mandatory', 'advance_notice_days'];

    protected function casts(): array
    {
        return ['is_required' => 'boolean', 'alert_days' => 'integer'];
    }

    public function facility(): BelongsTo { return $this->belongsTo(Facility::class); }
    public function certificationType(): BelongsTo { return $this->belongsTo(StaffCertificationType::class, 'staff_certification_type_id'); }
    public function qualificationLookup(): BelongsTo { return $this->belongsTo(StaffQualification::class, 'qualification_code', 'code'); }

    public function getCertificationTypeIdAttribute(): int { return $this->staff_certification_type_id; }
    public function getIsMandatoryAttribute(): bool { return $this->is_required; }
    public function getAdvanceNoticeDaysAttribute(): int { return $this->alert_days; }
}
