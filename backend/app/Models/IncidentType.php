<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IncidentType extends Model
{
    protected $fillable = ['code', 'name', 'description', 'sort_order', 'is_active'];
    protected function casts(): array { return ['sort_order' => 'integer', 'is_active' => 'boolean']; }
    public function incidents(): HasMany { return $this->hasMany(MinorIncident::class); }
}
