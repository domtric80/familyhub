<?php

namespace Tests\Feature;

use App\Models\Country;
use App\Models\Region;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GeographyHierarchyApiTest extends TestCase
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
            'device_name' => 'phpunit-geography-hierarchy-api',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_regions_index_returns_flat_filtered_list(): void
    {
        $country = Country::query()->where('iso_code', 'IT')->firstOrFail();

        $response = $this->withToken($this->token)
            ->getJson("/api/admin/regions?country_id={$country->id}")
            ->assertOk();

        $first = $response->json('0');

        $this->assertIsArray($first);
        $this->assertSame($country->id, $first['country_id']);
        $this->assertArrayHasKey('country', $first);
        $this->assertArrayHasKey('provinces_count', $first);
        $this->assertArrayNotHasKey('provinces', $first);
    }

    public function test_provinces_index_returns_flat_filtered_list(): void
    {
        $region = Region::query()->orderBy('id')->firstOrFail();

        $response = $this->withToken($this->token)
            ->getJson("/api/admin/provinces?region_id={$region->id}")
            ->assertOk();

        $first = $response->json('0');

        $this->assertIsArray($first);
        $this->assertSame($region->id, $first['region_id']);
        $this->assertArrayHasKey('region', $first);
        $this->assertArrayHasKey('cities_count', $first);
        $this->assertArrayNotHasKey('cities', $first);
    }
}
