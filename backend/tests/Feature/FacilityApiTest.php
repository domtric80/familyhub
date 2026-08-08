<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacilityApiTest extends TestCase
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
            'device_name' => 'phpunit-facilities',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_admin_can_update_facility(): void
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
                'status' => 'attiva',
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Struttura aggiornata');
    }
}
