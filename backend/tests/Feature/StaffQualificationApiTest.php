<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffQualificationApiTest extends TestCase
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
            'device_name' => 'phpunit-staff-qualifications',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_lookup_staff_qualifications_returns_active_lookup_values(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/lookups/staff-qualifications')
            ->assertOk()
            ->assertJsonPath('0.code', 'EDUCATORE');
    }

    public function test_admin_can_create_staff_member_with_qualification_code(): void
    {
        $facilityId = \App\Models\Facility::query()->firstOrFail()->id;

        $this->withToken($this->token)
            ->postJson('/api/admin/staff-members', [
                'facility_id' => $facilityId,
                'employee_code' => 'QA-QUAL-01',
                'first_name' => 'Mario',
                'last_name' => 'Rossi',
                'email' => 'mario.rossi@example.test',
                'qualification_code' => 'PEDIATRA',
                'status' => 'active',
            ])
            ->assertCreated()
            ->assertJsonPath('qualification_code', 'PEDIATRA')
            ->assertJsonPath('qualification_lookup.code', 'PEDIATRA')
            ->assertJsonPath('qualification_label', 'Pediatra')
            ->assertJsonMissingPath('qualification');
    }
}
