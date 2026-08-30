<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Facility;
use App\Models\Minor;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogService
{
    public function record(Request $request, array $data): AuditLog
    {
        /** @var User|null $user */
        $user = $data['actor_user'] ?? $request->user();
        $facilityId = $data['facility_id'] ?? $this->resolveFacilityId($request, $user);
        $minorId = $data['minor_id'] ?? $this->resolveMinorId($request);

        return AuditLog::query()->create([
            'facility_id' => $facilityId,
            'minor_id' => $minorId,
            'actor_user_id' => $user?->id,
            'actor_display_name' => $data['actor_display_name'] ?? $this->resolveActorDisplayName($user),
            'actor_role_name' => $data['actor_role_name'] ?? $this->resolveRoleName($user, $facilityId),
            'action' => $data['action'] ?? $this->resolveAction($request),
            'resource_type' => $data['resource_type'] ?? $this->resolveResourceType($request),
            'resource_id' => $data['resource_id'] ?? $this->resolveResourceId($request),
            'resource_label' => $data['resource_label'] ?? $request->path(),
            'operation_summary' => $data['operation_summary'] ?? $this->buildGenericSummary($request, $user),
            'ip_address' => $data['ip_address'] ?? $request->ip(),
            'user_agent' => $data['user_agent'] ?? $request->userAgent(),
            'old_values_json' => $data['old_values_json'] ?? null,
            'new_values_json' => $data['new_values_json'] ?? null,
            'occurred_at_utc' => $data['occurred_at_utc'] ?? now()->utc(),
        ]);
    }

    public function markHandled(Request $request): void
    {
        $request->attributes->set('audit.manual_handled', true);
    }

    public function isHandled(Request $request): bool
    {
        return (bool) $request->attributes->get('audit.manual_handled', false);
    }

    public function resolveActorDisplayName(?User $user): string
    {
        $displayName = trim((string) ($user ? "{$user->first_name} {$user->last_name}" : ''));

        return $displayName !== '' ? $displayName : ($user?->email ?? 'anonymous');
    }

    public function resolveAction(Request $request): string
    {
        return match ($request->method()) {
            'GET', 'HEAD' => 'read',
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => strtolower($request->method()),
        };
    }

    public function resolveResourceType(Request $request): string
    {
        $segments = $request->segments();

        if (($segments[1] ?? null) === 'admin') {
            return $segments[2] ?? 'admin';
        }

        return $segments[1] ?? 'api';
    }

    public function resolveResourceId(Request $request): ?string
    {
        foreach (['document', 'contact', 'activity', 'exit', 'approach', 'journal', 'thread', 'minor', 'role', 'facility', 'country', 'region', 'province', 'city', 'user', 'organization'] as $parameter) {
            $value = $request->route($parameter);

            if (is_object($value) && isset($value->id)) {
                return (string) $value->id;
            }

            if (is_scalar($value)) {
                return (string) $value;
            }
        }

        return $request->route('id')
            ?? ($request->filled('id') ? (string) $request->input('id') : null);
    }

    public function resolveFacilityId(Request $request, ?User $user): ?int
    {
        if ($request->filled('facility_id')) {
            return (int) $request->integer('facility_id');
        }

        if ($request->route('minor') instanceof Minor) {
            return $request->route('minor')->facility_id;
        }

        if ($request->route('facility') && isset($request->route('facility')->id)) {
            return (int) $request->route('facility')->id;
        }

        return $user?->userFacilityRoles()
            ->where('is_active', true)
            ->orderByDesc('valid_from')
            ->value('facility_id');
    }

    public function resolveFacilityIdForUser(?User $user): ?int
    {
        if (! $user) {
            return null;
        }

        return $user->userFacilityRoles()
            ->where('is_active', true)
            ->orderByDesc('valid_from')
            ->value('facility_id');
    }

    public function resolveMinorId(Request $request): ?int
    {
        $minor = $request->route('minor');

        if ($minor instanceof Minor) {
            return (int) $minor->id;
        }

        $document = $request->route('document');

        if (is_object($document) && isset($document->minor_id)) {
            return (int) $document->minor_id;
        }

        return $request->filled('minor_id') ? (int) $request->integer('minor_id') : null;
    }

    public function resolveRoleName(?User $user, ?int $facilityId): ?string
    {
        if (! $user || ! $facilityId) {
            return null;
        }

        return $user->userFacilityRoles()
            ->where('facility_id', $facilityId)
            ->where('is_active', true)
            ->whereHas('role')
            ->with('role')
            ->orderByDesc('valid_from')
            ->first()
            ?->role
            ?->code;
    }

    public function buildGenericSummary(Request $request, ?User $user): string
    {
        $actor = $this->resolveActorDisplayName($user);
        $action = $this->resolveAction($request);
        $resourceType = $this->resolveResourceType($request);
        $resourceId = $this->resolveResourceId($request);

        return match ($action) {
            'read' => sprintf('%s ha visualizzato la risorsa %s%s.', $actor, $resourceType, $resourceId ? " #{$resourceId}" : ''),
            'create' => sprintf('%s ha creato la risorsa %s.', $actor, $resourceType),
            'update' => sprintf('%s ha aggiornato la risorsa %s%s.', $actor, $resourceType, $resourceId ? " #{$resourceId}" : ''),
            'delete' => sprintf('%s ha eliminato la risorsa %s%s.', $actor, $resourceType, $resourceId ? " #{$resourceId}" : ''),
            default => sprintf('%s ha eseguito l\'operazione %s su %s%s.', $actor, $action, $resourceType, $resourceId ? " #{$resourceId}" : ''),
        };
    }
}
