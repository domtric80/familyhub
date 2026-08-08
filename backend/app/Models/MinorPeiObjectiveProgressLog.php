<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorPeiObjectiveProgressLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'minor_id',
        'minor_pei_id',
        'minor_pei_objective_id',
        'progress_percent',
        'status',
        'notes',
        'source_type',
        'source_id',
        'source_label',
        'actor_user_id',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'progress_percent' => 'integer',
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

    public function objective(): BelongsTo
    {
        return $this->belongsTo(MinorPeiObjective::class, 'minor_pei_objective_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
