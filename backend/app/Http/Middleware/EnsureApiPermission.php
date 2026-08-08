<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiPermission
{
    public function handle(Request $request, Closure $next, string $permissionCode, ?string $facilityResolver = null): Response
    {
        $user = $request->user();

        if (! $user) {
            return new JsonResponse([
                'message' => 'Non autenticato.',
            ], 401);
        }

        $facilityId = $this->resolveFacilityId($request, $facilityResolver);

        if (! $user->hasPermission($permissionCode, $facilityId)) {
            return new JsonResponse([
                'message' => "Permesso insufficiente: {$permissionCode}.",
            ], 403);
        }

        return $next($request);
    }

    private function resolveFacilityId(Request $request, ?string $facilityResolver): ?int
    {
        if (! $facilityResolver) {
            return null;
        }

        if (str_starts_with($facilityResolver, 'request:')) {
            $field = substr($facilityResolver, strlen('request:'));

            return $request->filled($field) ? $request->integer($field) : null;
        }

        $routeValue = $request->route($facilityResolver);

        if (is_numeric($routeValue)) {
            return (int) $routeValue;
        }

        if (is_object($routeValue)) {
            if (isset($routeValue->facility_id) && is_numeric($routeValue->facility_id)) {
                return (int) $routeValue->facility_id;
            }

            if (method_exists($routeValue, 'getAttribute')) {
                $facilityId = $routeValue->getAttribute('facility_id');

                if (is_numeric($facilityId)) {
                    return (int) $facilityId;
                }
            }
        }

        return null;
    }
}
