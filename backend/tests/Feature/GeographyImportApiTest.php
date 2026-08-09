<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\Country;
use App\Models\GeographyProvider;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GeographyImportApiTest extends TestCase
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
            'device_name' => 'phpunit-geography-import',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_can_import_country_on_demand_with_generic_provider_and_load_geonames_cities(): void
    {
        $france = Country::query()->create([
            'iso_code' => 'FR',
            'name' => 'Francia',
        ]);

        $provider = GeographyProvider::query()->where('code', 'GEONAMES')->firstOrFail();
        $provider->update([
            'mode' => 'local_file',
            'source_path' => base_path('tests/Fixtures/geonames-countryInfo-fr-sample.txt'),
            'source_url' => null,
            'auth_config_json' => [
                'countries_source_path' => base_path('tests/Fixtures/geonames-countryInfo-fr-sample.txt'),
                'admin1_source_path' => base_path('tests/Fixtures/geonames-admin1CodesASCII-fr-sample.txt'),
                'admin2_source_path' => base_path('tests/Fixtures/geonames-admin2Codes-fr-sample.txt'),
                'country_dump_source_path_template' => base_path('tests/Fixtures/{ISO}.zip'),
            ],
        ]);

        $this->withToken($this->token)
            ->postJson('/api/admin/geography-imports', [
                'country_id' => $france->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.provider.code', 'GEONAMES')
            ->assertJsonPath('data.loaded.countries', 1)
            ->assertJsonPath('data.loaded.regions', 3)
            ->assertJsonPath('data.loaded.provinces', 3)
            ->assertJsonPath('data.loaded.cities', 3);

        $this->assertDatabaseHas('regions', ['country_id' => $france->id, 'code' => '11', 'name' => 'Ile-de-France']);
        $this->assertDatabaseHas('provinces', ['code' => '75', 'name' => 'Paris']);
        $this->assertDatabaseHas('cities', ['name' => 'Paris', 'geoname_id' => 2988507]);

        $paris = City::query()->where('name', 'Paris')->firstOrFail();
        $this->assertSame('Europe/Paris', $paris->timezone);
        $this->assertSame('PPLC', $paris->feature_code);
        $this->assertSame(2138551, $paris->population);
    }

    public function test_can_import_italy_on_demand_with_istat_provider(): void
    {
        $italy = Country::query()->where('iso_code', 'IT')->firstOrFail();
        $provider = GeographyProvider::query()->where('code', 'ISTAT')->firstOrFail();
        $provider->update([
            'source_path' => base_path('tests/Fixtures/istat-cities-sample.csv'),
            'source_url' => null,
            'mode' => 'local_file',
        ]);

        $this->withToken($this->token)
            ->postJson('/api/admin/geography-imports', [
                'country_id' => $italy->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.provider.code', 'ISTAT')
            ->assertJsonPath('data.loaded.regions', 2)
            ->assertJsonPath('data.loaded.provinces', 2)
            ->assertJsonPath('data.loaded.cities', 3);
    }

    public function test_import_fails_when_provider_is_not_configured(): void
    {
        $italy = Country::query()->where('iso_code', 'IT')->firstOrFail();
        GeographyProvider::query()->where('code', 'ISTAT')->update([
            'source_path' => null,
            'source_url' => null,
            'mode' => 'local_file',
        ]);

        $this->withToken($this->token)
            ->postJson('/api/admin/geography-imports', [
                'country_id' => $italy->id,
            ])
            ->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Provider ISTAT non configurato: source_path mancante.',
            ]);
    }
}
