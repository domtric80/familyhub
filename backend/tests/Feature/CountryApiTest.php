<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CountryApiTest extends TestCase
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
            'device_name' => 'phpunit-country-api',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_admin_countries_index_returns_flat_country_list(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/admin/countries')
            ->assertOk();

        $response->assertJsonFragment([
            'iso_code' => 'IT',
            'name' => 'Italia',
        ]);

        $first = $response->json('0');

        $this->assertIsArray($first);
        $this->assertArrayNotHasKey('regions', $first);
    }
}
