<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminApiAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return new JsonResponse([
                'message' => 'Non autenticato.',
            ], 401);
        }

        if (! $user->hasRoleIn(['SUPER_ADMIN', 'ADMIN_IT', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA'])) {
            return new JsonResponse([
                'message' => 'Accesso amministrativo negato.',
            ], 403);
        }

        return $next($request);
    }
}
