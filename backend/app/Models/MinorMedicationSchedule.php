<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class MinorMedicationSchedule extends Model { protected $fillable=['minor_medication_plan_id','time_of_day','days_of_week','as_needed','created_by_user_id']; protected function casts():array{return ['days_of_week'=>'array','as_needed'=>'boolean'];} public function plan():BelongsTo{return $this->belongsTo(MinorMedicationPlan::class,'minor_medication_plan_id');} }
