<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorDiagnosis extends Model
{
    use HasFactory;

    protected $fillable = [
        'minor_id',
        'diagnosis_code',
        'diagnosis_label',
        'dsm_code',
        'diagnosis_notes_encrypted',
        'diagnosed_at',
        'review_due_at',
        'is_primary',
        'is_active',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'diagnosis_notes_encrypted' => 'encrypted',
            'diagnosed_at' => 'date',
            'review_due_at' => 'date',
            'is_primary' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
