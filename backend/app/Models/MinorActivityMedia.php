<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorActivityMedia extends Model
{
    protected $table = 'minor_activity_media';

    protected $fillable = [
        'minor_activity_id',
        'media_document_id',
        'consent_document_id',
        'captured_at',
        'consent_revoked_at',
        'consent_revoked_by_user_id',
        'consent_revocation_reason_encrypted',
        'created_by_user_id',
    ];

    protected $hidden = ['consent_revocation_reason_encrypted'];

    protected function casts(): array
    {
        return [
            'captured_at' => 'datetime',
            'consent_revoked_at' => 'datetime',
            'consent_revocation_reason_encrypted' => 'encrypted',
        ];
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(MinorActivity::class, 'minor_activity_id');
    }

    public function mediaDocument(): BelongsTo
    {
        return $this->belongsTo(MinorDocument::class, 'media_document_id');
    }

    public function consentDocument(): BelongsTo
    {
        return $this->belongsTo(MinorDocument::class, 'consent_document_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function consentRevokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consent_revoked_by_user_id');
    }
}
