<?php

namespace Tests\Feature;

use App\Services\DatabaseBackupService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Mockery;
use Tests\TestCase;

class DatabaseBackupApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_admin_can_list_database_backups(): void
    {
        $mock = Mockery::mock(DatabaseBackupService::class);
        $mock->shouldReceive('listBackups')
            ->once()
            ->andReturn([
                [
                    'filename' => 'familyhub-20260713-100000.sql',
                    'path' => '/tmp/familyhub-20260713-100000.sql',
                    'size_bytes' => 123,
                    'created_at' => now()->toISOString(),
                    'download_url' => '/api/admin/database-backups/download?filename=familyhub-20260713-100000.sql',
                ],
            ]);

        $this->app->instance(DatabaseBackupService::class, $mock);

        $token = $this->loginAsAdmin();

        $this->withToken($token)
            ->getJson('/api/admin/database-backups')
            ->assertOk()
            ->assertJsonPath('items.0.filename', 'familyhub-20260713-100000.sql')
            ->assertJsonPath('restore_confirm_text', config('familyhub_backup.confirm_restore_text'));
    }

    public function test_admin_can_trigger_database_backup_export(): void
    {
        $mock = Mockery::mock(DatabaseBackupService::class);
        $mock->shouldReceive('createBackup')
            ->once()
            ->with('manual-export')
            ->andReturn([
                'filename' => 'familyhub-20260713-100001-manual-export.sql',
                'path' => '/tmp/familyhub-20260713-100001-manual-export.sql',
                'size_bytes' => 456,
                'created_at' => now()->toISOString(),
                'download_url' => '/api/admin/database-backups/download?filename=familyhub-20260713-100001-manual-export.sql',
            ]);

        $this->app->instance(DatabaseBackupService::class, $mock);

        $token = $this->loginAsAdmin();

        $this->withToken($token)
            ->postJson('/api/admin/database-backups/export', ['label' => 'manual-export'])
            ->assertCreated()
            ->assertJsonPath('filename', 'familyhub-20260713-100001-manual-export.sql');
    }

    public function test_admin_can_restore_from_existing_backup_with_confirmation(): void
    {
        $mock = Mockery::mock(DatabaseBackupService::class);
        $mock->shouldReceive('restoreFromExistingBackup')
            ->once()
            ->with('familyhub-20260713-100002.sql', true)
            ->andReturn([
                'restored' => true,
                'source' => ['filename' => 'familyhub-20260713-100002.sql', 'uploaded' => false],
                'pre_restore_backup' => ['filename' => 'familyhub-20260713-095959-pre-restore.sql'],
                'post_restore_counts' => ['users' => 5, 'organizations' => 1, 'facilities' => 2, 'minors' => 7, 'attachments' => 12],
            ]);

        $this->app->instance(DatabaseBackupService::class, $mock);

        $token = $this->loginAsAdmin();

        $this->withToken($token)
            ->postJson('/api/admin/database-backups/restore', [
                'backup_filename' => 'familyhub-20260713-100002.sql',
                'confirm_text' => config('familyhub_backup.confirm_restore_text'),
                'create_pre_restore_backup' => true,
            ])
            ->assertOk()
            ->assertJsonPath('restored', true)
            ->assertJsonPath('source.filename', 'familyhub-20260713-100002.sql');
    }

    public function test_admin_can_restore_from_uploaded_sql_file(): void
    {
        $file = UploadedFile::fake()->createWithContent('restore.sql', '-- test sql');

        $mock = Mockery::mock(DatabaseBackupService::class);
        $mock->shouldReceive('restoreFromUploadedFile')
            ->once()
            ->andReturn([
                'restored' => true,
                'source' => ['filename' => 'upload-restore.sql', 'uploaded' => true],
                'pre_restore_backup' => ['filename' => 'familyhub-pre-restore.sql'],
                'post_restore_counts' => ['users' => 3, 'organizations' => 1, 'facilities' => 1, 'minors' => 4, 'attachments' => 9],
            ]);

        $this->app->instance(DatabaseBackupService::class, $mock);

        $token = $this->loginAsAdmin();

        $this->withToken($token)
            ->post('/api/admin/database-backups/restore', [
                'sql_file' => $file,
                'confirm_text' => config('familyhub_backup.confirm_restore_text'),
                'create_pre_restore_backup' => '1',
            ])
            ->assertOk();
    }

    public function test_admin_can_download_existing_backup(): void
    {
        $tempDir = storage_path('framework/testing-backups');
        File::ensureDirectoryExists($tempDir);
        $tempFile = $tempDir.DIRECTORY_SEPARATOR.'familyhub-test-download.sql';
        File::put($tempFile, '-- sql');

        $mock = Mockery::mock(DatabaseBackupService::class);
        $mock->shouldReceive('getBackupPath')
            ->once()
            ->with('familyhub-test-download.sql')
            ->andReturn($tempFile);

        $this->app->instance(DatabaseBackupService::class, $mock);

        $token = $this->loginAsAdmin();

        $this->withToken($token)
            ->get('/api/admin/database-backups/download?filename=familyhub-test-download.sql')
            ->assertOk()
            ->assertHeader('content-disposition', 'attachment; filename=familyhub-test-download.sql');
    }

    private function loginAsAdmin(): string
    {
        return (string) $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'phpunit-database-backups',
        ])->assertOk()->json('access_token');
    }
}
