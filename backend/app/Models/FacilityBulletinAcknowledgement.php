<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacilityBulletinAcknowledgement extends Model
{
    use HasFactory;
    protected $fillable = ['facility_bulletin_id', 'user_id', 'acknowledged_at'];
    protected function casts(): array { return ['acknowledged_at' => 'datetime']; }
    public function bulletin(): BelongsTo { return $this->belongsTo(FacilityBulletin::class, 'facility_bulletin_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
