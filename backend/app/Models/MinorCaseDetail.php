<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorCaseDetail extends Model
{
    protected $fillable = [
        'minor_id',
        'entry_city_id',
        'origin_facility_id',
        'origin_structure_name',
        'placement_order_reference',
        'placement_order_minor_document_id',
        'judicial_authority_document_issuer_id',
        'proceeding_number',
        'next_hearing_at',
        'general_practitioner_staff_member_id',
        'pediatrician_staff_member_id',
        'health_authority_document_issuer_id',
        'vaccination_minor_document_id',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'next_hearing_at' => 'datetime',
        ];
    }

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function entryCity(): BelongsTo
    {
        return $this->belongsTo(City::class, 'entry_city_id');
    }

    public function originFacility(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'origin_facility_id');
    }

    public function placementOrderDocument(): BelongsTo
    {
        return $this->belongsTo(MinorDocument::class, 'placement_order_minor_document_id');
    }

    public function judicialAuthority(): BelongsTo
    {
        return $this->belongsTo(DocumentIssuer::class, 'judicial_authority_document_issuer_id');
    }

    public function generalPractitioner(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class, 'general_practitioner_staff_member_id');
    }

    public function pediatrician(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class, 'pediatrician_staff_member_id');
    }

    public function healthAuthority(): BelongsTo
    {
        return $this->belongsTo(DocumentIssuer::class, 'health_authority_document_issuer_id');
    }

    public function vaccinationDocument(): BelongsTo
    {
        return $this->belongsTo(MinorDocument::class, 'vaccination_minor_document_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
