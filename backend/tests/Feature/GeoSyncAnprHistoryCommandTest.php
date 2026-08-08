<?php

namespace Tests\Feature;

use App\Models\GeoImportRun;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GeoSyncAnprHistoryCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_geo_sync_command_imports_anpr_history_into_raw_tables(): void
    {
        $this->artisan('familyhub:geo-sync', [
            '--source' => 'anpr_history',
            '--scope' => 'history_only',
            '--dry-run' => true,
            '--file' => base_path('tests/Fixtures/anpr-city-history-sample.csv'),
        ])->assertSuccessful();

        $run = GeoImportRun::query()->latest('id')->firstOrFail();

        $this->assertSame('completed', $run->status);
        $this->assertDatabaseCount('geo_source_city_history_raw', 3);
    }
}
