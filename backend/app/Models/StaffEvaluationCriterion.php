<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class StaffEvaluationCriterion extends Model { use HasFactory; protected $fillable=['code','name','description','is_active','sort_order']; protected function casts(): array { return ['is_active'=>'boolean']; } public function scores(): HasMany { return $this->hasMany(StaffEvaluationScore::class); } }
