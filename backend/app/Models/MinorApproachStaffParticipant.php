<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorApproachStaffParticipant extends Model
{
    protected $fillable = [
        'minor_approach_id',
        'staff_member_id',
        'qualification_code',
        'sort_order',
    ];

    public function approach(): BelongsTo
    {
        return $this->belongsTo(MinorApproach::class, 'minor_approach_id');
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function qualificationLookup(): BelongsTo
    {
        return $this->belongsTo(StaffQualification::class, 'qualification_code', 'code');
    }
}
