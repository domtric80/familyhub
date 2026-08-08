<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinorExitAccompanier extends Model
{
    use HasFactory;

    public const TYPE_STAFF_MEMBER = 'staff_member';
    public const TYPE_MINOR_CONTACT = 'minor_contact';
    public const TYPE_EXTERNAL = 'external';

    protected $fillable = [
        'minor_exit_id',
        'person_type',
        'staff_member_id',
        'minor_contact_id',
        'external_name',
        'notes',
    ];

    public static function personTypes(): array
    {
        return [
            self::TYPE_STAFF_MEMBER,
            self::TYPE_MINOR_CONTACT,
            self::TYPE_EXTERNAL,
        ];
    }

    public function exit(): BelongsTo
    {
        return $this->belongsTo(MinorExit::class, 'minor_exit_id');
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function minorContact(): BelongsTo
    {
        return $this->belongsTo(MinorContact::class);
    }

    public function displayName(): ?string
    {
        return match ($this->person_type) {
            self::TYPE_STAFF_MEMBER => $this->staffMember
                ? trim(sprintf('%s %s', $this->staffMember->first_name, $this->staffMember->last_name))
                : null,
            self::TYPE_MINOR_CONTACT => $this->minorContact
                ? trim(sprintf('%s %s', $this->minorContact->first_name, $this->minorContact->last_name))
                : null,
            self::TYPE_EXTERNAL => $this->external_name,
            default => null,
        };
    }
}
