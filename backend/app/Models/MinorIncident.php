<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MinorIncident extends Model
{
    protected $fillable = ['facility_id', 'minor_id', 'incident_type_id', 'severity_level_id', 'status_id', 'occurred_at', 'location', 'description', 'immediate_actions', 'requires_external_notification', 'reported_by_user_id', 'updated_by_user_id'];
    protected function casts(): array
    {
        return ['occurred_at' => 'datetime', 'location' => 'encrypted', 'description' => 'encrypted', 'immediate_actions' => 'encrypted', 'requires_external_notification' => 'boolean'];
    }
    public function facility(): BelongsTo { return $this->belongsTo(Facility::class); }
    public function minor(): BelongsTo { return $this->belongsTo(Minor::class); }
    public function incidentType(): BelongsTo { return $this->belongsTo(IncidentType::class); }
    public function severityLevel(): BelongsTo { return $this->belongsTo(IncidentSeverityLevel::class); }
    public function status(): BelongsTo { return $this->belongsTo(IncidentStatus::class); }
    public function reportedBy(): BelongsTo { return $this->belongsTo(User::class, 'reported_by_user_id'); }
    public function updatedBy(): BelongsTo { return $this->belongsTo(User::class, 'updated_by_user_id'); }
    public function transitions(): HasMany { return $this->hasMany(MinorIncidentTransition::class); }
    public function analysis(): HasOne { return $this->hasOne(MinorIncidentAnalysis::class); }
    public function externalNotifications(): HasMany { return $this->hasMany(MinorIncidentExternalNotification::class); }
}
