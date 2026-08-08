<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorageSmokeTestCommandTest extends TestCase
{
    public function test_storage_smoke_command_succeeds_on_fake_disk(): void
    {
        Storage::fake('smoke');

        config([
            'filesystems.disks.smoke' => [
                'driver' => 'local',
                'root' => storage_path('framework/testing/disks/smoke'),
                'throw' => false,
            ],
        ]);

        $this->artisan('familyhub:storage-smoke', [
            '--disk' => 'smoke',
            '--prefix' => 'tests',
        ])->assertSuccessful();
    }
}
