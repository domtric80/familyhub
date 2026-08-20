<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class StaffEvaluationScore extends Model { use HasFactory; protected $fillable=['staff_evaluation_id','staff_evaluation_criterion_id','score','notes']; protected function casts(): array { return ['notes'=>'encrypted']; } public function criterion(): BelongsTo { return $this->belongsTo(StaffEvaluationCriterion::class,'staff_evaluation_criterion_id'); } }
