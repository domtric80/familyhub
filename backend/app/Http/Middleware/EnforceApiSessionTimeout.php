<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class EnforceApiSessionTimeout
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();

        if (! $user || ! $token) {
            return $next($request);
        }

        if ($token->expires_at && $token->expires_at->isPast()) {
            return $this->expireToken($token, 'Sessione scaduta: durata massima di 8 ore raggiunta.');
        }

        $idleTimeoutMinutes = max(1, (int) config('familyhub_auth.token_idle_timeout_minutes', 60));
        $lastActivity = Cache::get($this->activityCacheKey((string) $token->id));
        $lastActivityAt = $lastActivity ? now()->parse($lastActivity) : $token->created_at;

        if ($lastActivityAt && $lastActivityAt->copy()->addMinutes($idleTimeoutMinutes)->isPast()) {
            return $this->expireToken($token, 'Sessione scaduta per inattività oltre 60 minuti.');
        }

        $response = $next($request);

        if ($response->getStatusCode() < 500) {
            $ttlSeconds = max(60, now()->diffInSeconds($token->expires_at ?? now()->addMinutes($idleTimeoutMinutes), false));
            Cache::put($this->activityCacheKey((string) $token->id), now()->toISOString(), $ttlSeconds);
        }

        return $response;
    }

    private function expireToken($token, string $message): JsonResponse
    {
        Cache::forget($this->activityCacheKey((string) $token->id));
        $token->delete();

        return response()->json([
            'message' => $message,
        ], 401);
    }

    private function activityCacheKey(string $tokenId): string
    {
        return 'auth:token-activity:'.$tokenId;
    }
}
