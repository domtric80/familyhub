<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
class StaffEvaluation extends Model { use HasFactory, SoftDeletes; protected $fillable=['facility_id','staff_member_id','evaluator_user_id','period_start','period_end','evaluation_date','status','overall_score','summary','finalized_at','finalized_by_user_id']; protected function casts(): array { return ['period_start'=>'date','period_end'=>'date','evaluation_date'=>'date','finalized_at'=>'datetime','summary'=>'encrypted']; } public function staffMember(): BelongsTo { return $this->belongsTo(StaffMember::class); } public function evaluator(): BelongsTo { return $this->belongsTo(User::class,'evaluator_user_id'); } public function finalizedBy(): BelongsTo { return $this->belongsTo(User::class,'finalized_by_user_id'); } public function scores(): HasMany { return $this->hasMany(StaffEvaluationScore::class); } }
