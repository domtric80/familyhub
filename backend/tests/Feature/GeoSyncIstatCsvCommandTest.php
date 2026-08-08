<?php

namespace Tests\Feature;

use App\Models\GeoImportRun;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GeoSyncIstatCsvCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_geo_sync_command_imports_istat_csv_into_raw_tables(): void
    {
        $this->artisan('familyhub:geo-sync', [
            '--source' => 'istat',
            '--scope' => 'italy_admin_csv',
            '--dry-run' => true,
            '--file' => base_path('tests/Fixtures/istat-cities-sample.csv'),
        ])->assertSuccessful();

        $run = GeoImportRun::query()->latest('id')->firstOrFail();

        $this->assertSame('completed', $run->status);
        $this->assertDatabaseCount('geo_source_countries_raw', 1);
        $this->assertDatabaseCount('geo_source_regions_raw', 2);
        $this->assertDatabaseCount('geo_source_provinces_raw', 2);
        $this->assertDatabaseCount('geo_source_cities_raw', 3);
    }
}
