<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorHistoryEntry extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'minor_id',
        'facility_id',
        'event_type',
        'actor_user_id',
        'snapshot',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
