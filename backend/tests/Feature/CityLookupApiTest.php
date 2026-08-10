<?php

namespace Tests\Feature;

use App\Models\City;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CityLookupApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_city_lookup_returns_empty_list_without_filters(): void
    {
        $this->getJson('/api/lookups/cities')
            ->assertOk()
            ->assertExactJson([]);
    }

    public function test_city_lookup_can_load_selected_city_by_id(): void
    {
        $city = City::query()->with('province.region.country')->firstOrFail();

        $this->getJson('/api/lookups/cities?id=' . $city->id)
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $city->id)
            ->assertJsonPath('0.name', $city->name);
    }

    public function test_city_lookup_can_search_by_name(): void
    {
        $city = City::query()->firstOrFail();

        $response = $this->getJson('/api/lookups/cities?q=' . urlencode(substr($city->name, 0, 3)) . '&limit=10')
            ->assertOk();

        $this->assertNotEmpty($response->json());
    }
}
