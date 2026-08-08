<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffStatusApiTest extends TestCase
{
    use RefreshDatabase;

    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'phpunit-staff-statuses',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_lookup_staff_statuses_returns_active_lookup_values(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/lookups/staff-statuses')
            ->assertOk()
            ->assertJsonPath('0.code', 'ACTIVE');
    }

    public function test_admin_can_create_staff_member_with_status_code(): void
    {
        $facilityId = \App\Models\Facility::query()->firstOrFail()->id;

        $this->withToken($this->token)
            ->postJson('/api/admin/staff-members', [
                'facility_id' => $facilityId,
                'employee_code' => 'QA-STATUS-01',
                'first_name' => 'Lucia',
                'last_name' => 'Verdi',
                'email' => 'lucia.verdi@example.test',
                'qualification_code' => 'EDUCATORE',
                'status_code' => 'SUSPENDED',
            ])
            ->assertCreated()
            ->assertJsonPath('status_code', 'SUSPENDED')
            ->assertJsonPath('status_lookup.code', 'SUSPENDED')
            ->assertJsonPath('status_label', 'Sospeso')
            ->assertJsonMissingPath('status');
    }
}
