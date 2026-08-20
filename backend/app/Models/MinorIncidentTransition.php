<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorIncidentTransition extends Model
{
    protected $fillable = ['minor_incident_id', 'from_status_id', 'to_status_id', 'notes', 'performed_by_user_id', 'performed_at'];
    protected function casts(): array { return ['notes' => 'encrypted', 'performed_at' => 'datetime']; }
    public function incident(): BelongsTo { return $this->belongsTo(MinorIncident::class, 'minor_incident_id'); }
    public function fromStatus(): BelongsTo { return $this->belongsTo(IncidentStatus::class, 'from_status_id'); }
    public function toStatus(): BelongsTo { return $this->belongsTo(IncidentStatus::class, 'to_status_id'); }
    public function performedBy(): BelongsTo { return $this->belongsTo(User::class, 'performed_by_user_id'); }
}
