<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use App\Services\SystemHealthService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class SystemHealthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_admin_can_read_system_health_snapshot(): void
    {
        $mock = Mockery::mock(SystemHealthService::class);
        $mock->shouldReceive('snapshot')
            ->once()
            ->andReturn([
                'generated_at' => now()->toIso8601String(),
                'storage_config_source' => 'ENV',
                'summary' => [
                    'ok' => 3,
                    'warning' => 1,
                    'error' => 0,
                    'not_configured' => 2,
                ],
                'services' => [
                    [
                        'service' => 'api_backend',
                        'label' => 'API backend',
                        'status' => 'ok',
                        'checked_at' => now()->toIso8601String(),
                        'latency_ms' => 1.23,
                        'message' => 'API applicativa disponibile.',
                        'error' => null,
                        'meta' => [],
                    ],
                ],
            ]);

        $this->app->instance(SystemHealthService::class, $mock);

        $token = $this->login('admin@familyhub.local', 'phpunit-system-health-admin');

        $this->withToken($token)
            ->getJson('/api/admin/system/health')
            ->assertOk()
            ->assertJsonPath('storage_config_source', 'ENV')
            ->assertJsonPath('summary.ok', 3)
            ->assertJsonPath('services.0.service', 'api_backend');
    }

    public function test_admin_can_run_manual_system_health_check(): void
    {
        $mock = Mockery::mock(SystemHealthService::class);
        $mock->shouldReceive('snapshot')
            ->once()
            ->andReturn([
                'generated_at' => now()->toIso8601String(),
                'storage_config_source' => 'ENV',
                'summary' => [
                    'ok' => 4,
                    'warning' => 0,
                    'error' => 0,
                    'not_configured' => 1,
                ],
                'services' => [],
            ]);

        $this->app->instance(SystemHealthService::class, $mock);

        $token = $this->login('admin@familyhub.local', 'phpunit-system-health-run');

        $this->withToken($token)
            ->postJson('/api/admin/system/health/run')
            ->assertOk()
            ->assertJsonPath('summary.ok', 4);

        $this->assertDatabaseHas('audit_logs', [
            'resource_type' => 'system_health',
            'resource_label' => 'manual-run',
        ]);
    }

    public function test_educator_cannot_read_system_health_snapshot(): void
    {
        $facility = Facility::query()->firstOrFail();
        $role = Role::query()->where('code', 'EDUCATORE')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $educator = User::query()->create([
            'uuid' => '22222222-2222-2222-2222-222222222222',
            'first_name' => 'Luca',
            'last_name' => 'Verdi',
            'email' => 'qa.educatore.health@familyhub.local',
            'password' => 'password',
            'mfa_required' => false,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $educator->id,
            'facility_id' => $facility->id,
            'role_id' => $role->id,
            'valid_from' => now(),
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $token = $this->login('qa.educatore.health@familyhub.local', 'phpunit-system-health-educator');

        $this->withToken($token)
            ->getJson('/api/admin/system/health')
            ->assertForbidden();
    }

    private function login(string $email, string $deviceName): string
    {
        return (string) $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password',
            'device_name' => $deviceName,
        ])->assertOk()->json('access_token');
    }
}
