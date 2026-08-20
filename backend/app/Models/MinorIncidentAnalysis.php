<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorIncidentAnalysis extends Model
{
    protected $fillable = ['minor_incident_id', 'root_cause', 'corrective_measures', 'responsible_staff_member_id', 'due_date', 'completed_at', 'updated_by_user_id'];
    protected function casts(): array { return ['root_cause' => 'encrypted', 'corrective_measures' => 'encrypted', 'due_date' => 'date', 'completed_at' => 'datetime']; }
    public function incident(): BelongsTo { return $this->belongsTo(MinorIncident::class, 'minor_incident_id'); }
    public function responsibleStaffMember(): BelongsTo { return $this->belongsTo(StaffMember::class); }
    public function updatedBy(): BelongsTo { return $this->belongsTo(User::class, 'updated_by_user_id'); }
}
