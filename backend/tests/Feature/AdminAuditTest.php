<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuditTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_admin_request_is_written_to_audit_log(): void
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'audit-test',
        ])->assertOk();

        $token = $login->json('access_token');

        $this->withToken($token)
            ->getJson('/api/admin/organizations')
            ->assertOk();

        $logs = AuditLog::query()
            ->where('resource_type', 'organizations')
            ->where('action', 'read');

        $this->assertSame(1, $logs->count());

        $log = $logs->firstOrFail();

        $this->assertSame('organizations', $log->resource_type);
        $this->assertSame('read', $log->action);
        $this->assertSame('SUPER_ADMIN', $log->actor_role_name);
    }
}
