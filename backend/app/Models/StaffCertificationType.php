<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StaffCertificationType extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'description', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'sort_order' => 'integer'];
    }

    public function certifications(): HasMany
    {
        return $this->hasMany(StaffMemberCertification::class);
    }

    public function facilityRequirements(): HasMany
    {
        return $this->hasMany(FacilityCertificationRequirement::class);
    }
}
