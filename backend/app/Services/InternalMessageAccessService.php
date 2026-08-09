<?php

namespace App\Services;

use App\Models\DocumentClassification;
use App\Models\InternalMessageThread;
use App\Models\Minor;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class InternalMessageAccessService
{
    public function scopeVisibleThreadsForUser(Builder $query, User $user): Builder
    {
        return $query->whereHas('participants', fn (Builder $participantQuery) => $participantQuery
            ->where('user_id', $user->id)
            ->where('is_active', true));
    }

    public function canAccessThread(User $user, InternalMessageThread $thread, string $permission): bool
    {
        if (! $user->hasPermission($permission, $thread->facility_id)) {
            return false;
        }

        $isParticipant = $thread->participants()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();

        if (! $isParticipant) {
            return false;
        }

        return $this->canUseClassification(
            $user,
            $thread->classification_code ?: 'internal',
            (int) $thread->facility_id,
            $thread->minor_id ? $thread->minor : null
        );
    }

    public function canUseClassification(User $user, string $classificationCode, int $facilityId, ?Minor $minor = null): bool
    {
        $classification = DocumentClassification::query()
            ->where('is_active', true)
            ->where('code', $classificationCode)
            ->first();

        if (! $classification) {
            return false;
        }

        $allowedRoles = $classification->allowed_role_codes ?? [];

        if (! empty($allowedRoles) && ! $user->userFacilityRoles()
            ->where('facility_id', $facilityId)
            ->where('is_active', true)
            ->where(function ($query): void {
                $query->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', now());
            })
            ->whereHas('role', fn ($query) => $query->whereIn('code', $allowedRoles))
            ->exists()) {
            return false;
        }

        if ($minor) {
            return app(MinorAccessService::class)->hasActiveAssignment($user, $minor);
        }

        return true;
    }
}
