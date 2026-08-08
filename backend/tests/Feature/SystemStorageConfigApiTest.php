<?php

namespace Tests\Feature;

use App\Models\SystemStorageConfig;
use App\Models\User;
use App\Services\StorageConfigService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class SystemStorageConfigApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_admin_can_list_storage_configs(): void
    {
        $mock = Mockery::mock(StorageConfigService::class);
        $mock->shouldReceive('indexPayload')
            ->once()
            ->andReturn([
                'current_source' => 'ENV',
                'active_config_id' => null,
                'active_config' => null,
                'env_fallback' => ['disk' => 's3'],
                'items' => [],
            ]);

        $this->app->instance(StorageConfigService::class, $mock);

        $token = $this->login('admin@familyhub.local', 'phpunit-storage-index');

        $this->withToken($token)
            ->getJson('/api/admin/system/storage-configs')
            ->assertOk()
            ->assertJsonPath('current_source', 'ENV');
    }

    public function test_admin_can_create_storage_config(): void
    {
        $admin = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $config = new SystemStorageConfig([
            'id' => 1,
            'code' => 'MINIO_MAIN',
            'name' => 'MinIO principale',
            'provider_type' => 'minio',
            'bucket' => 'familyhub-private',
            'region' => 'eu-south-1',
            'endpoint' => 'http://minio:9000',
            'use_path_style_endpoint' => true,
            'is_active' => true,
            'is_default' => false,
        ]);
        $config->exists = true;

        $mock = Mockery::mock(StorageConfigService::class);
        $mock->shouldReceive('create')->once()->andReturn($config);
        $mock->shouldReceive('toArray')->twice()->andReturn([
            'id' => 1,
            'code' => 'MINIO_MAIN',
            'name' => 'MinIO principale',
            'provider_type' => 'minio',
            'bucket' => 'familyhub-private',
            'access_key_masked' => '****hub1',
            'secret_key_masked' => '****ret1',
        ]);

        $this->app->instance(StorageConfigService::class, $mock);

        $token = $this->login($admin->email, 'phpunit-storage-create');

        $this->withToken($token)
            ->postJson('/api/admin/system/storage-configs', [
                'code' => 'MINIO_MAIN',
                'name' => 'MinIO principale',
                'provider_type' => 'minio',
                'bucket' => 'familyhub-private',
                'region' => 'eu-south-1',
                'endpoint' => 'http://minio:9000',
                'use_path_style_endpoint' => true,
                'access_key' => 'familyhub1',
                'secret_key' => 'secret1',
            ])
            ->assertCreated()
            ->assertJsonPath('code', 'MINIO_MAIN');
    }

    public function test_admin_can_activate_storage_config(): void
    {
        $config = SystemStorageConfig::query()->create([
            'code' => 'MINIO_MAIN',
            'name' => 'MinIO principale',
            'provider_type' => 'minio',
            'bucket' => 'familyhub-private',
            'region' => 'eu-south-1',
            'endpoint' => 'http://minio:9000',
            'use_path_style_endpoint' => true,
            'access_key_encrypted' => encrypt('familyhub'),
            'secret_key_encrypted' => encrypt('secret'),
            'is_active' => true,
            'is_default' => false,
        ]);

        $mock = Mockery::mock(StorageConfigService::class);
        $mock->shouldReceive('activate')->once()->andReturn($config);
        $mock->shouldReceive('applyRuntimeConfiguration')->once();
        $mock->shouldReceive('toArray')->twice()->andReturn([
            'id' => $config->id,
            'code' => 'MINIO_MAIN',
            'name' => 'MinIO principale',
            'is_default' => true,
        ]);
        $mock->shouldReceive('currentSource')->once()->andReturn('DB');

        $this->app->instance(StorageConfigService::class, $mock);

        $token = $this->login('admin@familyhub.local', 'phpunit-storage-activate');

        $this->withToken($token)
            ->postJson("/api/admin/system/storage-configs/{$config->id}/activate")
            ->assertOk()
            ->assertJsonPath('current_source', 'DB');
    }

    public function test_admin_can_test_storage_config(): void
    {
        $config = SystemStorageConfig::query()->create([
            'code' => 'MINIO_MAIN',
            'name' => 'MinIO principale',
            'provider_type' => 'minio',
            'bucket' => 'familyhub-private',
            'region' => 'eu-south-1',
            'endpoint' => 'http://minio:9000',
            'use_path_style_endpoint' => true,
            'access_key_encrypted' => encrypt('familyhub'),
            'secret_key_encrypted' => encrypt('secret'),
            'is_active' => true,
            'is_default' => false,
        ]);

        $mock = Mockery::mock(StorageConfigService::class);
        $mock->shouldReceive('test')->once()->andReturn([
            'status' => 'ok',
            'message' => 'Connessione storage verificata con successo.',
            'tested_at' => now()->toIso8601String(),
        ]);

        $this->app->instance(StorageConfigService::class, $mock);

        $token = $this->login('admin@familyhub.local', 'phpunit-storage-test');

        $this->withToken($token)
            ->postJson("/api/admin/system/storage-configs/{$config->id}/test")
            ->assertOk()
            ->assertJsonPath('status', 'ok');
    }

    private function login(string $email, string $deviceName): string
    {
        return (string) $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password',
            'device_name' => $deviceName,
        ])->assertOk()->json('access_token');
    }
}
