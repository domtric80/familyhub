<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class StaffLanguage extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'description', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'sort_order' => 'integer'];
    }

    public function staffMembers(): BelongsToMany
    {
        return $this->belongsToMany(StaffMember::class, 'staff_member_languages')
            ->withPivot(['proficiency_level_code', 'notes'])
            ->withTimestamps();
    }
}
