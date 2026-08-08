<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StaffShiftTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'facility_id',
        'code',
        'name',
        'start_time',
        'end_time',
        'minimum_staff_required',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'minimum_staff_required' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(StaffShiftAssignment::class, 'shift_template_id');
    }
}
