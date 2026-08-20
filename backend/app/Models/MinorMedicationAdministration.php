<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class MinorMedicationAdministration extends Model { protected $fillable=['minor_medication_plan_id','minor_medication_schedule_id','scheduled_for','administered_at','outcome_id','notes','administered_by_user_id','signature_type','signed_at']; protected function casts():array{return ['scheduled_for'=>'datetime','administered_at'=>'datetime','notes'=>'encrypted','signed_at'=>'datetime'];} public function plan():BelongsTo{return $this->belongsTo(MinorMedicationPlan::class,'minor_medication_plan_id');} public function schedule():BelongsTo{return $this->belongsTo(MinorMedicationSchedule::class,'minor_medication_schedule_id');} public function outcome():BelongsTo{return $this->belongsTo(MedicationAdministrationOutcome::class);} public function administeredBy():BelongsTo{return $this->belongsTo(User::class,'administered_by_user_id');} }
