<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorNeed extends Model
{
    use HasFactory;

    protected $fillable = [
        'minor_id',
        'category_code',
        'title',
        'description',
        'priority',
        'status',
        'responsible_staff_member_id',
        'attachment_minor_document_id',
        'updated_by_user_id',
    ];

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function responsibleStaffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class, 'responsible_staff_member_id');
    }

    public function attachmentDocument(): BelongsTo
    {
        return $this->belongsTo(MinorDocument::class, 'attachment_minor_document_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
