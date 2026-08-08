<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ConfirmMfaRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegenerateMfaRecoveryCodesRequest;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\LoginContextService;
use App\Services\MfaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService = new AuditLogService(),
        private readonly MfaService $mfaService = new MfaService(),
        private readonly LoginContextService $loginContextService = new LoginContextService(),
    ) {
    }

    public function loginContext(Request $request): JsonResponse
    {
        $context = $this->loginContextService->issue();

        return response()->json([
            'token' => $context['token'],
            'issued_at' => $context['issued_at'],
            'expires_at' => $context['expires_at'],
        ]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $loginContextToken = $request->string('login_context_token')->toString();

        if ($loginContextToken !== '' && ! $this->loginContextService->validate($loginContextToken)) {
            return response()->json([
                'message' => 'Sessione login scaduta. Ricarica la pagina ed effettua nuovamente l’accesso.',
            ], 419);
        }

        if (! app()->environment('testing') && $loginContextToken === '') {
            return response()->json([
                'message' => 'Sessione login scaduta. Ricarica la pagina ed effettua nuovamente l’accesso.',
            ], 419);
        }

        $email = trim($request->string('email')->toString());
        $password = $request->string('password')->toString();
        $deviceName = $request->string('device_name')->toString() ?: 'api-token';

        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            $this->auditLogService->record($request, [
                'actor_display_name' => $email,
                'action' => 'auth_failed',
                'resource_type' => 'auth_login',
                'resource_label' => $email,
                'operation_summary' => sprintf('Tentativo di login fallito per email %s.', $email),
            ]);

            return response()->json([
                'message' => 'Credenziali non valide.',
            ], 422);
        }

        if (! $user->is_active) {
            $this->auditLogService->record($request, [
                'actor_user' => $user,
                'facility_id' => $this->auditLogService->resolveFacilityIdForUser($user),
                'action' => 'auth_blocked',
                'resource_type' => 'auth_login',
                'resource_label' => $user->email,
                'operation_summary' => sprintf('Login bloccato: utente %s disattivato.', $user->email),
            ]);

            return response()->json([
                'message' => 'Utente disattivato.',
            ], 403);
        }

        if ($user->hasMfaEnabled()) {
            $secret = $this->mfaService->decryptSecret($user->mfa_secret_encrypted);
            $otp = $request->string('otp')->toString();

            if (! $otp || ! $secret || ! $this->mfaService->verifyCode($secret, $otp)) {
                $this->auditLogService->record($request, [
                    'actor_user' => $user,
                    'facility_id' => $this->auditLogService->resolveFacilityIdForUser($user),
                    'action' => 'mfa_failed',
                    'resource_type' => 'auth_login',
                    'resource_label' => $user->email,
                    'operation_summary' => sprintf('Login MFA fallito per utente %s: codice non valido o mancante.', $user->email),
                ]);

                return response()->json([
                    'message' => 'Codice MFA non valido o mancante.',
                    'mfa_required' => true,
                ], 422);
            }
        }

        $token = $user->createToken(
            $deviceName,
            ['*'],
            Carbon::now()->addMinutes((int) config('familyhub_auth.token_absolute_ttl_minutes', 480)),
        );

        if ($loginContextToken !== '') {
            $this->loginContextService->consume($loginContextToken);
        }

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        $this->auditLogService->record($request, [
            'actor_user' => $user,
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($user),
            'action' => 'auth_login',
            'resource_type' => 'auth_login',
            'resource_id' => (string) $user->id,
            'resource_label' => $user->email,
            'operation_summary' => sprintf(
                '%s ha effettuato il login. Device: %s. Token valido fino al %s.',
                $this->auditLogService->resolveActorDisplayName($user),
                $deviceName,
                optional($token->accessToken->expires_at)?->toISOString() ?? 'senza scadenza'
            ),
            'new_values_json' => [
                'device_name' => $deviceName,
                'expires_at' => optional($token->accessToken->expires_at)?->toISOString(),
                'mfa_enabled' => $user->hasMfaEnabled(),
            ],
        ]);

        return response()->json([
            'token_type' => 'Bearer',
            'access_token' => $token->plainTextToken,
            'expires_at' => optional($token->accessToken->expires_at)?->toISOString(),
            'user' => $user->only([
                'id',
                'uuid',
                'email',
                'first_name',
                'last_name',
                'is_active',
                'mfa_required',
            ]),
            'mfa' => [
                'required' => (bool) $user->mfa_required,
                'enabled' => $user->hasMfaEnabled(),
                'confirmed' => filled($user->mfa_confirmed_at),
                'setup_required' => (bool) $user->mfa_required && ! $user->hasMfaEnabled(),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->load([
            'userFacilityRoles' => fn ($query) => $query
                ->where('is_active', true)
                ->where(function ($inner) {
                    $inner->whereNull('valid_to')
                        ->orWhere('valid_to', '>=', now());
                })
                ->with(['role.permissions', 'facility'])
                ->orderBy('facility_id')
                ->orderBy('id'),
        ]);

        return response()->json([
            'user' => [
                ...$user->toArray(),
                'mfa' => [
                    'required' => (bool) $user->mfa_required,
                    'enabled' => $user->hasMfaEnabled(),
                    'confirmed' => filled($user->mfa_confirmed_at),
                    'setup_required' => (bool) $user->mfa_required && ! $user->hasMfaEnabled(),
                ],
                'capabilities' => [
                    'permissions' => $user->effectivePermissions(),
                    'document_classifications' => $user->allowedDocumentClassifications(),
                ],
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $tokenId = $user?->currentAccessToken()?->id;

        $this->auditLogService->record($request, [
            'actor_user' => $user,
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($user),
            'action' => 'auth_logout',
            'resource_type' => 'auth_logout',
            'resource_id' => $tokenId ? (string) $tokenId : null,
            'resource_label' => $user?->email,
            'operation_summary' => sprintf('%s ha effettuato il logout.', $this->auditLogService->resolveActorDisplayName($user)),
        ]);

        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout eseguito.',
        ]);
    }

    public function mfaSetup(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasMfaEnabled()) {
            $secret = $this->mfaService->decryptSecret($user->mfa_secret_encrypted);

            $this->auditLogService->record($request, [
                'actor_user' => $user,
                'facility_id' => $this->auditLogService->resolveFacilityIdForUser($user),
                'action' => 'mfa_read',
                'resource_type' => 'mfa_setup',
                'resource_id' => (string) $user->id,
                'resource_label' => $user->email,
                'operation_summary' => sprintf('%s ha richiesto la configurazione MFA ma la MFA era già attiva.', $this->auditLogService->resolveActorDisplayName($user)),
            ]);

            return response()->json([
                'message' => 'MFA già attiva.',
                'secret' => $secret,
                'otp_auth_url' => $secret ? $this->mfaService->getQrCodeUrl($user, $secret) : null,
                'recovery_codes' => [],
                'confirmed' => true,
                'already_enabled' => true,
            ]);
        }

        $secret = $this->mfaService->decryptSecret($user->mfa_secret_encrypted) ?: $this->mfaService->generateSecret();
        $recoveryCodes = $this->mfaService->decryptRecoveryCodes($user->mfa_recovery_codes_encrypted);

        if ($recoveryCodes === []) {
            $recoveryCodes = $this->mfaService->generateRecoveryCodes();
        }

        $user->forceFill([
            'mfa_required' => true,
            'mfa_secret_encrypted' => $this->mfaService->encryptSecret($secret),
            'mfa_recovery_codes_encrypted' => $this->mfaService->encryptRecoveryCodes($recoveryCodes),
            'mfa_confirmed_at' => $user->mfa_confirmed_at,
        ])->save();

        $this->auditLogService->record($request, [
            'actor_user' => $user,
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($user),
            'action' => 'mfa_setup',
            'resource_type' => 'mfa_setup',
            'resource_id' => (string) $user->id,
            'resource_label' => $user->email,
            'operation_summary' => sprintf('%s ha avviato la configurazione MFA.', $this->auditLogService->resolveActorDisplayName($user)),
        ]);

        return response()->json([
            'secret' => $secret,
            'otp_auth_url' => $this->mfaService->getQrCodeUrl($user, $secret),
            'recovery_codes' => $recoveryCodes,
            'confirmed' => false,
            'already_enabled' => false,
        ]);
    }

    public function mfaStatus(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'required' => (bool) $user->mfa_required,
            'enabled' => $user->hasMfaEnabled(),
            'confirmed' => filled($user->mfa_confirmed_at),
            'recovery_codes_remaining' => count($this->mfaService->decryptRecoveryCodes($user->mfa_recovery_codes_encrypted)),
        ]);
    }

    public function mfaConfirm(ConfirmMfaRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $secret = $this->mfaService->decryptSecret($user->mfa_secret_encrypted);

        if (! $secret || ! $this->mfaService->verifyCode($secret, $request->string('code')->toString())) {
            return response()->json([
                'message' => 'Codice MFA non valido.',
            ], 422);
        }

        $user->forceFill([
            'mfa_required' => true,
            'mfa_confirmed_at' => now(),
        ])->save();

        $this->auditLogService->record($request, [
            'actor_user' => $user,
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($user),
            'action' => 'mfa_confirm',
            'resource_type' => 'mfa_confirm',
            'resource_id' => (string) $user->id,
            'resource_label' => $user->email,
            'operation_summary' => sprintf('%s ha confermato correttamente la MFA.', $this->auditLogService->resolveActorDisplayName($user)),
        ]);

        return response()->json([
            'message' => 'MFA confermata.',
            'confirmed' => true,
        ]);
    }

    public function mfaDisable(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->forceFill([
            'mfa_required' => false,
            'mfa_secret_encrypted' => null,
            'mfa_recovery_codes_encrypted' => null,
            'mfa_confirmed_at' => null,
        ])->save();

        $this->auditLogService->record($request, [
            'actor_user' => $user,
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($user),
            'action' => 'mfa_disable',
            'resource_type' => 'mfa_disable',
            'resource_id' => (string) $user->id,
            'resource_label' => $user->email,
            'operation_summary' => sprintf('%s ha disabilitato la MFA.', $this->auditLogService->resolveActorDisplayName($user)),
        ]);

        return response()->json([
            'message' => 'MFA disabilitata.',
        ]);
    }

    public function mfaRegenerateRecoveryCodes(RegenerateMfaRecoveryCodesRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $secret = $this->mfaService->decryptSecret($user->mfa_secret_encrypted);

        if (! $user->hasMfaEnabled() || ! $secret || ! $this->mfaService->verifyCode($secret, $request->string('code')->toString())) {
            return response()->json([
                'message' => 'Codice MFA non valido.',
            ], 422);
        }

        $recoveryCodes = $this->mfaService->generateRecoveryCodes();

        $user->forceFill([
            'mfa_recovery_codes_encrypted' => $this->mfaService->encryptRecoveryCodes($recoveryCodes),
        ])->save();

        $this->auditLogService->record($request, [
            'actor_user' => $user,
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($user),
            'action' => 'mfa_recovery_codes_regenerated',
            'resource_type' => 'mfa_recovery_codes',
            'resource_id' => (string) $user->id,
            'resource_label' => $user->email,
            'operation_summary' => sprintf('%s ha rigenerato i recovery code MFA.', $this->auditLogService->resolveActorDisplayName($user)),
        ]);

        return response()->json([
            'message' => 'Recovery codes rigenerate.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }
}
