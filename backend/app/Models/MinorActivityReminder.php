<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorActivityReminder extends Model
{
    use HasFactory;
    protected $fillable = ['minor_activity_id', 'recipient_user_id', 'remind_at', 'acknowledged_at', 'created_by_user_id'];
    protected $appends = ['is_due'];
    protected function casts(): array { return ['remind_at' => 'datetime', 'acknowledged_at' => 'datetime']; }
    public function activity(): BelongsTo { return $this->belongsTo(MinorActivity::class, 'minor_activity_id'); }
    public function recipient(): BelongsTo { return $this->belongsTo(User::class, 'recipient_user_id'); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by_user_id'); }
    public function getIsDueAttribute(): bool { return ! $this->acknowledged_at && $this->remind_at->isPast(); }
}
