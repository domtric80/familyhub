<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\Country;
use App\Models\GeoImportRun;
use App\Models\Province;
use App\Models\Region;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class GeoLoadCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_geo_load_command_loads_seed_raw_into_canonical_tables(): void
    {
        $this->artisan('familyhub:geo-sync', [
            '--source' => 'seed',
            '--scope' => 'italy_admin_seed',
            '--dry-run' => true,
        ])->assertSuccessful();

        $runId = GeoImportRun::query()->latest('id')->value('id');

        DB::table('facilities')->delete();
        City::query()->delete();
        Province::query()->delete();
        Region::query()->delete();
        Country::query()->delete();

        $this->artisan('familyhub:geo-load', [
            '--run-id' => $runId,
            '--source' => 'seed',
            '--level' => 'countries',
            '--recursive' => true,
        ])->assertSuccessful();

        $this->assertDatabaseHas('countries', ['iso_code' => 'IT', 'name' => 'Italia']);
        $this->assertDatabaseCount('regions', 3);
        $this->assertDatabaseCount('provinces', 6);
        $this->assertDatabaseCount('cities', 8);
    }
}
