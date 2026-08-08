<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MinorExit extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const STATUS_PLANNED = 'planned';
    public const STATUS_OUT = 'out';
    public const STATUS_RETURNED = 'returned';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'facility_id',
        'minor_id',
        'exit_type_id',
        'destination',
        'reason',
        'accompanied_by',
        'authorized_by_user_id',
        'created_by_user_id',
        'updated_by_user_id',
        'planned_exit_at',
        'expected_return_at',
        'actual_exit_at',
        'actual_return_at',
        'status',
        'return_condition',
        'follow_up_required',
        'follow_up_notes',
        'outcome_notes',
        'cancellation_reason',
    ];

    protected $appends = [
        'is_overdue',
        'delay_minutes',
    ];

    protected function casts(): array
    {
        return [
            'planned_exit_at' => 'datetime',
            'expected_return_at' => 'datetime',
            'actual_exit_at' => 'datetime',
            'actual_return_at' => 'datetime',
            'follow_up_required' => 'boolean',
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_PLANNED,
            self::STATUS_OUT,
            self::STATUS_RETURNED,
            self::STATUS_CANCELLED,
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function exitType(): BelongsTo
    {
        return $this->belongsTo(ExitType::class);
    }

    public function authorizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'authorized_by_user_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function accompaniers(): HasMany
    {
        return $this->hasMany(MinorExitAccompanier::class)->orderBy('id');
    }

    public function getIsOverdueAttribute(): bool
    {
        if ($this->status !== self::STATUS_OUT || ! $this->expected_return_at || $this->actual_return_at) {
            return false;
        }

        return $this->expected_return_at->isPast();
    }

    public function getDelayMinutesAttribute(): ?int
    {
        if (! $this->expected_return_at || ! $this->actual_return_at) {
            return null;
        }

        $delay = $this->expected_return_at->diffInMinutes($this->actual_return_at, false);

        return $delay > 0 ? $delay : 0;
    }
}
