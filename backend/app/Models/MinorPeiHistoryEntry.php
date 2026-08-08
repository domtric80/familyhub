<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorPeiHistoryEntry extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'minor_id',
        'minor_pei_id',
        'event_type',
        'version_number',
        'snapshot',
        'metadata',
        'actor_user_id',
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

    public function pei(): BelongsTo
    {
        return $this->belongsTo(MinorPei::class, 'minor_pei_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
