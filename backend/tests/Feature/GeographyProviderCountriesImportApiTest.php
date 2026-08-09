<?php

namespace Tests\Feature;

use App\Models\Country;
use App\Models\GeographyProvider;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GeographyProviderCountriesImportApiTest extends TestCase
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
            'device_name' => 'phpunit-geography-provider-import',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_can_import_all_countries_from_geonames_global_provider(): void
    {
        $provider = GeographyProvider::query()->where('code', 'GEONAMES')->firstOrFail();
        $provider->update([
            'mode' => 'local_file',
            'format' => 'txt',
            'source_path' => base_path('tests/Fixtures/geonames-countryInfo-sample.txt'),
            'source_url' => null,
            'auth_config_json' => null,
        ]);

        $this->withToken($this->token)
            ->postJson("/api/admin/geography-providers/{$provider->id}/import-countries")
            ->assertCreated()
            ->assertJsonPath('data.provider.code', 'GEONAMES')
            ->assertJsonPath('data.loaded.countries', 3)
            ->assertJsonPath('data.stats.created_countries', 3);

        $this->assertDatabaseHas('countries', ['iso_code' => 'AD', 'name' => 'Andorra']);
        $this->assertDatabaseHas('countries', ['iso_code' => 'AE', 'name' => 'United Arab Emirates']);
        $this->assertDatabaseHas('countries', ['iso_code' => 'AF', 'name' => 'Afghanistan']);
    }

    public function test_global_countries_import_rejects_country_dump_provider(): void
    {
        $provider = GeographyProvider::query()->where('code', 'GEONAMES')->firstOrFail();
        $provider->update([
            'mode' => 'remote_file',
            'format' => 'zip',
            'source_url' => 'https://download.geonames.org/export/dump/{ISO}.zip',
        ]);

        $this->withToken($this->token)
            ->postJson("/api/admin/geography-providers/{$provider->id}/import-countries")
            ->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Il provider GEONAMES è configurato come dump paese. Per importare tutte le nazioni usa un provider GeoNames con sorgente countryInfo.txt.',
            ]);
    }
}
