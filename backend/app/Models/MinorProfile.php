<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'minor_id',
        'family_background',
        'life_history',
        'learning_styles',
        'interests',
        'hobbies',
        'strengths',
        'risk_factors',
        'crisis_indicators',
        'clinical_notes_encrypted',
        'updated_by_user_id',
    ];

    public function minor(): BelongsTo
    {
        return $this->belongsTo(Minor::class);
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
