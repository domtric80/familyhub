<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffTimesheetMonthLock extends Model
{
    use HasFactory;

    protected $fillable = [
        'facility_id',
        'year',
        'month',
        'locked_at',
        'locked_by_user_id',
        'unlocked_at',
        'unlocked_by_user_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'locked_at' => 'datetime',
            'unlocked_at' => 'datetime',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function lockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by_user_id');
    }

    public function unlockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'unlocked_by_user_id');
    }

    public function isActive(): bool
    {
        return $this->locked_at !== null && $this->unlocked_at === null;
    }
}
