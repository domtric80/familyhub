<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorHealthEvent extends Model
{
    protected $fillable = ['facility_id','minor_id','category_id','status_id','scheduled_at','occurred_at','provider_staff_member_id','health_authority_document_issuer_id','linked_minor_document_id','reason','clinical_findings','outcome_notes','follow_up_at','created_by_user_id','updated_by_user_id'];

    protected function casts(): array
    {
        return ['scheduled_at'=>'datetime','occurred_at'=>'datetime','follow_up_at'=>'datetime','reason'=>'encrypted','clinical_findings'=>'encrypted','outcome_notes'=>'encrypted'];
    }

    public function minor(): BelongsTo { return $this->belongsTo(Minor::class); }
    public function category(): BelongsTo { return $this->belongsTo(MinorHealthEventCategory::class); }
    public function status(): BelongsTo { return $this->belongsTo(MinorHealthEventStatus::class); }
    public function provider(): BelongsTo { return $this->belongsTo(StaffMember::class, 'provider_staff_member_id'); }
    public function healthAuthority(): BelongsTo { return $this->belongsTo(DocumentIssuer::class, 'health_authority_document_issuer_id'); }
    public function linkedDocument(): BelongsTo { return $this->belongsTo(MinorDocument::class, 'linked_minor_document_id'); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by_user_id'); }
    public function updatedBy(): BelongsTo { return $this->belongsTo(User::class, 'updated_by_user_id'); }
}
