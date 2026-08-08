<?php

namespace App\Services;

use App\Models\InternalMessageThread;
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

        if ($thread->minor_id) {
            return app(MinorAccessService::class)->hasActiveAssignment($user, $thread->minor);
        }

        return true;
    }
}
