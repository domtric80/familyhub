<?php

namespace App\Services;

use App\Models\DocumentClassification;
use App\Models\Minor;
use App\Models\MinorUserAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class MinorAccessService
{
    public function scopeVisibleMinorsForUser(Builder $query, User $user): Builder
    {
        if ($user->hasRoleIn(config('minor_access.privileged_role_codes', []))) {
            return $query;
        }

        return $query->whereExists(function ($subQuery) use ($user): void {
            $subQuery
                ->selectRaw('1')
                ->from('minor_user_assignments')
                ->whereColumn('minor_user_assignments.minor_id', 'minors.id')
                ->where('minor_user_assignments.user_id', $user->id)
                ->where('minor_user_assignments.is_active', true)
                ->where(function ($dateQuery): void {
                    $dateQuery
                        ->whereNull('minor_user_assignments.valid_to')
                        ->orWhereDate('minor_user_assignments.valid_to', '>=', now()->toDateString());
                })
                ->whereDate('minor_user_assignments.valid_from', '<=', now()->toDateString());
        });
    }

    public function hasActiveAssignment(User $user, Minor $minor): bool
    {
        if ($user->hasRoleIn(config('minor_access.privileged_role_codes', []))) {
            return true;
        }

        return $this->activeAssignment($user, $minor) !== null;
    }

    public function canAccessMinor(User $user, Minor $minor, string $requiredPermission): bool
    {
        if (! $user->hasPermission($requiredPermission, $minor->facility_id)) {
            return false;
        }

        return $this->hasActiveAssignment($user, $minor);
    }

    public function canAccessDocumentClassification(User $user, Minor $minor, string $classification, string $action = 'read'): bool
    {
        if (! $user->hasPermission("attachments.{$action}", $minor->facility_id)) {
            return false;
        }

        $classificationRules = DocumentClassification::query()
            ->where('is_active', true)
            ->where('code', $classification)
            ->first();

        if (! $classificationRules) {
            $classificationRules = collect(config('document_classifications', []))
                ->firstWhere('code', $classification);
        }

        $allowedRoles = match ($action) {
            'download' => $classificationRules instanceof DocumentClassification
                ? ($classificationRules->allowed_download_role_codes ?? $classificationRules->allowed_role_codes ?? null)
                : ($classificationRules['allowed_download_roles'] ?? $classificationRules['allowed_roles'] ?? null),
            default => $classificationRules instanceof DocumentClassification
                ? ($classificationRules->allowed_role_codes ?? null)
                : ($classificationRules['allowed_roles'] ?? null),
        };

        if (is_array($allowedRoles) && ! $user->hasRoleIn($allowedRoles)) {
            return false;
        }

        return $this->hasActiveAssignment($user, $minor);
    }

    private function activeAssignment(User $user, Minor $minor): ?MinorUserAssignment
    {
        return MinorUserAssignment::query()
            ->where('minor_id', $minor->id)
            ->where('user_id', $user->id)
            ->where('facility_id', $minor->facility_id)
            ->where('is_active', true)
            ->whereDate('valid_from', '<=', now()->toDateString())
            ->where(function ($query): void {
                $query
                    ->whereNull('valid_to')
                    ->orWhereDate('valid_to', '>=', now()->toDateString());
            })
            ->orderByDesc('valid_from')
            ->first();
    }
}
