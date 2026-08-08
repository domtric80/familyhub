<?php

namespace Tests\Feature;

use App\Models\GeoImportRun;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GeoSyncItalySeedCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_geo_sync_command_imports_italy_seed_into_raw_tables(): void
    {
        $this->artisan('familyhub:geo-sync', [
            '--source' => 'seed',
            '--scope' => 'italy_admin_seed',
            '--dry-run' => true,
        ])->assertSuccessful();

        $run = GeoImportRun::query()->latest('id')->firstOrFail();

        $this->assertSame('completed', $run->status);
        $this->assertDatabaseCount('geo_source_countries_raw', 1);
        $this->assertDatabaseCount('geo_source_regions_raw', 3);
        $this->assertDatabaseCount('geo_source_provinces_raw', 6);
        $this->assertDatabaseCount('geo_source_cities_raw', 8);
    }
}
