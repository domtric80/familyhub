<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacilityStatusApiTest extends TestCase
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
            'device_name' => 'phpunit-facility-statuses',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_lookup_facility_statuses_returns_active_lookup_values(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/lookups/facility-statuses')
            ->assertOk()
            ->assertJsonPath('0.code', 'ACTIVE');
    }

    public function test_admin_can_update_facility_with_status_code(): void
    {
        $facility = \App\Models\Facility::query()->firstOrFail();
        $organization = \App\Models\Organization::query()->firstOrFail();
        $city = \App\Models\City::query()->firstOrFail();

        $this->withToken($this->token)
            ->putJson("/api/admin/facilities/{$facility->id}", [
                'organization_id' => $organization->id,
                'code' => $facility->code,
                'name' => 'Struttura aggiornata',
                'address_line' => 'Via aggiornata 1',
                'city_id' => $city->id,
                'postal_code' => '70100',
                'capacity' => 12,
                'status_code' => 'SUSPENDED',
            ])
            ->assertOk()
            ->assertJsonPath('status_code', 'SUSPENDED')
            ->assertJsonPath('status_lookup.code', 'SUSPENDED')
            ->assertJsonPath('status_label', 'Sospesa')
            ->assertJsonMissingPath('status');
    }
}
