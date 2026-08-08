<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class MfaService
{
    public function __construct(
        private readonly Google2FA $google2fa = new Google2FA(),
    ) {
    }

    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    public function getQrCodeUrl(User $user, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl(
            config('app.name', 'FamilyHub'),
            $user->email,
            $secret,
        );
    }

    public function verifyCode(string $secret, string $code): bool
    {
        return $this->google2fa->verifyKey($secret, $code);
    }

    public function encryptSecret(string $secret): string
    {
        return Crypt::encryptString($secret);
    }

    public function decryptSecret(?string $encryptedSecret): ?string
    {
        if (! $encryptedSecret) {
            return null;
        }

        return Crypt::decryptString($encryptedSecret);
    }

    public function generateRecoveryCodes(): array
    {
        return collect(range(1, 8))
            ->map(fn () => Str::upper(Str::random(10)))
            ->all();
    }

    public function encryptRecoveryCodes(array $codes): string
    {
        return Crypt::encryptString(json_encode($codes, JSON_THROW_ON_ERROR));
    }

    public function decryptRecoveryCodes(?string $encryptedCodes): array
    {
        if (! $encryptedCodes) {
            return [];
        }

        $decoded = json_decode(Crypt::decryptString($encryptedCodes), true, 512, JSON_THROW_ON_ERROR);

        return Arr::wrap($decoded);
    }
}
