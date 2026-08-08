<?php

namespace Tests\Feature;

use App\Models\GeoImportRun;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GeoSyncCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_geo_sync_command_parses_geonames_countries_file_in_dry_run_mode(): void
    {
        Storage::fake('local');

        $file = base_path('tests/Fixtures/geonames-countryInfo-sample.txt');

        $this->artisan('familyhub:geo-sync', [
            '--source' => 'geonames',
            '--dry-run' => true,
            '--file' => $file,
        ])->assertSuccessful();

        $run = GeoImportRun::query()->latest('id')->firstOrFail();

        $this->assertSame('completed', $run->status);
        $this->assertSame(3, $run->raw_record_count);
        $this->assertSame(0, $run->published_record_count);
        $this->assertSame(0, $run->issue_count);
        $this->assertNotNull($run->summary_json);
        $this->assertSame('geonames', $run->summary_json['source']);
    }

    public function test_geo_sync_command_fails_when_country_has_invalid_iso_code(): void
    {
        Storage::fake('local');

        $file = base_path('tests/Fixtures/geonames-countryInfo-invalid-sample.txt');

        $this->artisan('familyhub:geo-sync', [
            '--source' => 'geonames',
            '--dry-run' => true,
            '--file' => $file,
        ])->assertFailed();

        $run = GeoImportRun::query()->latest('id')->firstOrFail();

        $this->assertSame('failed', $run->status);
        $this->assertGreaterThan(0, $run->issue_count);
        $this->assertGreaterThan(0, $run->error_count);
        $this->assertDatabaseHas('geo_import_issues', [
            'geo_import_run_id' => $run->id,
            'issue_type' => 'invalid_iso_code',
            'severity' => 'error',
            'is_blocking' => true,
        ]);
    }
}
