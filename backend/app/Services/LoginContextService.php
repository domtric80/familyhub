<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class LoginContextService
{
    public function issue(): array
    {
        $token = Str::random(64);
        $issuedAt = now();
        $expiresAt = $issuedAt->copy()->addMinutes($this->ttlMinutes());

        Cache::put($this->cacheKey($token), [
            'issued_at' => $issuedAt->toISOString(),
            'expires_at' => $expiresAt->toISOString(),
        ], $expiresAt);

        return [
            'token' => $token,
            'issued_at' => $issuedAt->toISOString(),
            'expires_at' => $expiresAt->toISOString(),
        ];
    }

    public function validate(string $token): bool
    {
        $payload = Cache::get($this->cacheKey($token));

        if (! is_array($payload)) {
            return false;
        }

        $expiresAt = Carbon::parse((string) ($payload['expires_at'] ?? now()->subSecond()->toISOString()));

        return $expiresAt->isFuture();
    }

    public function consume(string $token): void
    {
        Cache::forget($this->cacheKey($token));
    }

    private function cacheKey(string $token): string
    {
        return 'auth:login-context:'.$token;
    }

    private function ttlMinutes(): int
    {
        return max(1, (int) config('familyhub_auth.login_context_ttl_minutes', 10));
    }
}
