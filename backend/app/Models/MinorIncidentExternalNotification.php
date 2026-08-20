<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorIncidentExternalNotification extends Model
{
    protected $fillable = ['minor_incident_id', 'document_issuer_id', 'notified_at', 'reference', 'notes', 'sent_by_user_id'];
    protected function casts(): array { return ['notified_at' => 'datetime', 'reference' => 'encrypted', 'notes' => 'encrypted']; }
    public function incident(): BelongsTo { return $this->belongsTo(MinorIncident::class, 'minor_incident_id'); }
    public function documentIssuer(): BelongsTo { return $this->belongsTo(DocumentIssuer::class); }
    public function sentBy(): BelongsTo { return $this->belongsTo(User::class, 'sent_by_user_id'); }
}
