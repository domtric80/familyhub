<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Carbon;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_user_can_login_and_receive_bearer_token(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure([
                'token_type',
                'access_token',
                'expires_at',
                'mfa' => [
                    'required',
                    'enabled',
                    'confirmed',
                    'setup_required',
                ],
                'user' => [
                    'id',
                    'uuid',
                    'email',
                    'first_name',
                    'last_name',
                    'is_active',
                    'mfa_required',
                ],
            ]);
    }

    public function test_admin_routes_require_authentication(): void
    {
        $this->getJson('/api/admin/organizations')
            ->assertUnauthorized();
    }

    public function test_authenticated_super_admin_can_access_admin_routes(): void
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'phpunit-admin',
        ])->assertOk();

        $token = $login->json('access_token');

        $this->withToken($token)
            ->getJson('/api/admin/organizations')
            ->assertOk();
    }

    public function test_expired_bearer_token_is_rejected(): void
    {
        $user = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $token = $user->createToken(
            'expired-test-token',
            ['*'],
            Carbon::now()->subMinute(),
        );

        $this->withToken($token->plainTextToken)
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_idle_bearer_token_is_rejected_after_sixty_minutes_of_inactivity(): void
    {
        config()->set('familyhub_auth.token_idle_timeout_minutes', 60);

        $user = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $token = $user->createToken(
            'idle-timeout-test-token',
            ['*'],
            Carbon::now()->addHours(8),
        );

        Cache::put(
            'auth:token-activity:'.$token->accessToken->id,
            Carbon::now()->subMinutes(61)->toISOString(),
            3600
        );

        $this->withToken($token->plainTextToken)
            ->getJson('/api/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Sessione scaduta per inattività oltre 60 minuti.');
    }

    public function test_active_bearer_token_remains_valid_within_idle_window(): void
    {
        config()->set('familyhub_auth.token_idle_timeout_minutes', 60);

        $user = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $token = $user->createToken(
            'active-window-test-token',
            ['*'],
            Carbon::now()->addHours(8),
        );

        Cache::put(
            'auth:token-activity:'.$token->accessToken->id,
            Carbon::now()->subMinutes(59)->toISOString(),
            3600
        );

        $this->withToken($token->plainTextToken)
            ->getJson('/api/auth/me')
            ->assertOk();
    }

    public function test_login_context_older_than_ten_minutes_is_rejected(): void
    {
        config()->set('app.env', 'local');
        config()->set('familyhub_auth.login_context_ttl_minutes', 10);

        $context = $this->getJson('/api/auth/login-context')
            ->assertOk();

        Carbon::setTestNow(now()->addMinutes(11));

        $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'expired-login-context',
            'login_context_token' => $context->json('token'),
        ])->assertStatus(419);

        Carbon::setTestNow();
    }

    public function test_login_context_within_ten_minutes_allows_login(): void
    {
        config()->set('app.env', 'local');

        $context = $this->getJson('/api/auth/login-context')
            ->assertOk();

        $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'valid-login-context',
            'login_context_token' => $context->json('token'),
        ])->assertOk();
    }

    public function test_user_with_confirmed_mfa_must_provide_valid_otp_to_login(): void
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'mfa-bootstrap',
        ])->assertOk();

        $token = $login->json('access_token');

        $setup = $this->withToken($token)
            ->postJson('/api/auth/mfa/setup')
            ->assertOk();

        $secret = $setup->json('secret');
        $otp = app(Google2FA::class)->getCurrentOtp($secret);

        $this->withToken($token)
            ->postJson('/api/auth/mfa/confirm', [
                'code' => $otp,
            ])
            ->assertOk();

        User::query()->where('email', 'admin@familyhub.local')->firstOrFail()->tokens()->delete();

        $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'mfa-enforced',
        ])->assertStatus(422);

        $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'otp' => app(Google2FA::class)->getCurrentOtp($secret),
            'device_name' => 'mfa-enforced',
        ])->assertOk();
    }

    public function test_authenticated_user_can_read_mfa_status_and_regenerate_recovery_codes(): void
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'mfa-status',
        ])->assertOk();

        $token = $login->json('access_token');

        $this->withToken($token)
            ->getJson('/api/auth/mfa/status')
            ->assertOk()
            ->assertJsonPath('required', true)
            ->assertJsonPath('enabled', false)
            ->assertJsonPath('confirmed', false);

        $setup = $this->withToken($token)
            ->postJson('/api/auth/mfa/setup')
            ->assertOk();

        $secret = $setup->json('secret');
        $otp = app(Google2FA::class)->getCurrentOtp($secret);

        $this->withToken($token)
            ->postJson('/api/auth/mfa/confirm', [
                'code' => $otp,
            ])
            ->assertOk();

        $this->withToken($token)
            ->getJson('/api/auth/mfa/status')
            ->assertOk()
            ->assertJsonPath('required', true)
            ->assertJsonPath('enabled', true)
            ->assertJsonPath('confirmed', true);

        $this->withToken($token)
            ->postJson('/api/auth/mfa/recovery-codes/regenerate', [
                'code' => app(Google2FA::class)->getCurrentOtp($secret),
            ])
            ->assertOk()
            ->assertJsonCount(8, 'recovery_codes');
    }

    public function test_authenticated_user_profile_exposes_capabilities_for_frontend(): void
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'capabilities-profile',
        ])->assertOk();

        $token = $login->json('access_token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@familyhub.local')
            ->assertJsonStructure([
                'user' => [
                    'mfa' => [
                        'required',
                        'enabled',
                        'confirmed',
                        'setup_required',
                    ],
                    'user_facility_roles',
                    'capabilities' => [
                        'permissions',
                        'document_classifications',
                    ],
                ],
            ])
            ->assertJsonFragment(['code' => 'restricted'])
            ->assertJsonFragment(['code' => 'attachments.upload']);
    }

    public function test_mfa_setup_is_idempotent_for_user_with_already_confirmed_mfa(): void
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'mfa-idempotent',
        ])->assertOk();

        $token = $login->json('access_token');

        $setup = $this->withToken($token)
            ->postJson('/api/auth/mfa/setup')
            ->assertOk();

        $secret = $setup->json('secret');
        $otp = app(Google2FA::class)->getCurrentOtp($secret);

        $this->withToken($token)
            ->postJson('/api/auth/mfa/confirm', [
                'code' => $otp,
            ])
            ->assertOk();

        $confirmedAt = User::query()->where('email', 'admin@familyhub.local')->value('mfa_confirmed_at');

        $this->withToken($token)
            ->postJson('/api/auth/mfa/setup')
            ->assertOk()
            ->assertJsonPath('already_enabled', true)
            ->assertJsonPath('confirmed', true);

        $this->assertEquals(
            $confirmedAt,
            User::query()->where('email', 'admin@familyhub.local')->value('mfa_confirmed_at')
        );
    }
}
