<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Minor extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'facility_id',
        'internal_code',
        'first_name',
        'last_name',
        'preferred_name',
        'birth_date',
        'birth_city_id',
        'biological_sex_id',
        'gender_identity_id',
        'tax_code',
        'entry_date',
        'minor_status_id',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'entry_date' => 'date',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function birthCity(): BelongsTo
    {
        return $this->belongsTo(City::class, 'birth_city_id');
    }

    public function genderIdentity(): BelongsTo
    {
        return $this->belongsTo(GenderIdentity::class);
    }

    public function biologicalSex(): BelongsTo
    {
        return $this->belongsTo(BiologicalSex::class);
    }

    public function minorStatus(): BelongsTo
    {
        return $this->belongsTo(MinorStatus::class);
    }

    public function profile(): HasOne
    {
        return $this->hasOne(MinorProfile::class);
    }

    public function caseDetail(): HasOne
    {
        return $this->hasOne(MinorCaseDetail::class);
    }

    public function diagnoses(): HasMany
    {
        return $this->hasMany(MinorDiagnosis::class)
            ->orderByDesc('is_primary')
            ->orderByDesc('diagnosed_at')
            ->orderByDesc('id');
    }

    public function peis(): HasMany
    {
        return $this->hasMany(MinorPei::class)
            ->orderByDesc('start_date')
            ->orderByDesc('id');
    }

    public function needs(): HasMany
    {
        return $this->hasMany(MinorNeed::class)
            ->orderBy('category_code')
            ->orderByDesc('priority')
            ->orderByDesc('id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(MinorNote::class)
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }

    public function peiHistoryEntries(): HasMany
    {
        return $this->hasMany(MinorPeiHistoryEntry::class)
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(MinorContact::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(MinorDocument::class);
    }

    public function exits(): HasMany
    {
        return $this->hasMany(MinorExit::class);
    }

    public function approaches(): HasMany
    {
        return $this->hasMany(MinorApproach::class);
    }

    public function journalEntries(): HasMany
    {
        return $this->hasMany(MinorJournalEntry::class)
            ->orderByDesc('observed_at')
            ->orderByDesc('id');
    }

    public function historyEntries(): HasMany
    {
        return $this->hasMany(MinorHistoryEntry::class)
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }

    public function userAssignments(): HasMany
    {
        return $this->hasMany(MinorUserAssignment::class);
    }

    public function publicDisplayName(): string
    {
        $preferredName = trim((string) $this->preferred_name);
        $internalCode = trim((string) $this->internal_code);

        if ($preferredName !== '' && $internalCode !== '') {
            return sprintf('%s (%s)', $preferredName, $internalCode);
        }

        if ($preferredName !== '') {
            return $preferredName;
        }

        if ($internalCode !== '') {
            return sprintf('Minore %s', $internalCode);
        }

        return sprintf('Minore #%d', $this->id);
    }
}
