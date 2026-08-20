<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FacilityBulletin extends Model
{
    use HasFactory;

    protected $fillable = ['facility_id', 'title', 'body', 'status', 'expires_at', 'published_at', 'created_by_user_id', 'published_by_user_id'];
    protected function casts(): array { return ['title' => 'encrypted', 'body' => 'encrypted', 'expires_at' => 'datetime', 'published_at' => 'datetime']; }
    public function facility(): BelongsTo { return $this->belongsTo(Facility::class); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by_user_id'); }
    public function publishedBy(): BelongsTo { return $this->belongsTo(User::class, 'published_by_user_id'); }
    public function targetRoles(): BelongsToMany { return $this->belongsToMany(Role::class, 'facility_bulletin_role_targets')->withTimestamps(); }
    public function acknowledgements(): HasMany { return $this->hasMany(FacilityBulletinAcknowledgement::class); }
}
