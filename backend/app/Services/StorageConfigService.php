<?php

namespace App\Services;

use App\Models\SystemStorageConfig;
use App\Models\User;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class StorageConfigService
{
    public function currentSource(): string
    {
        return $this->activeConfig() instanceof SystemStorageConfig ? 'DB' : 'ENV';
    }

    public function applyRuntimeConfiguration(): void
    {
        try {
            $config = $this->activeConfig();
            if (! $config) {
                return;
            }

            Config::set('filesystems.default', 's3');
            Config::set('filesystems.disks.s3', $this->diskConfiguration($config));
        } catch (Throwable) {
        }
    }

    public function indexPayload(): array
    {
        $activeConfig = $this->activeConfig();

        return [
            'current_source' => $this->currentSource(),
            'active_config_id' => $activeConfig?->id,
            'active_config' => $activeConfig ? $this->toArray($activeConfig) : null,
            'env_fallback' => $this->envSummary(),
            'items' => SystemStorageConfig::query()
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get()
                ->map(fn (SystemStorageConfig $config): array => $this->toArray($config))
                ->all(),
        ];
    }

    public function create(array $payload, ?User $actor = null): SystemStorageConfig
    {
        $model = new SystemStorageConfig();

        $this->fillModel($model, $payload, $actor, true);

        if ($model->is_default) {
            $this->clearDefaultFlag();
        }

        $model->save();

        return $model->refresh();
    }

    public function update(SystemStorageConfig $config, array $payload, ?User $actor = null): SystemStorageConfig
    {
        if (($payload['is_default'] ?? false) === true) {
            $this->clearDefaultFlag($config->id);
        }

        $this->fillModel($config, $payload, $actor, false);
        $config->save();

        return $config->refresh();
    }

    public function activate(SystemStorageConfig $config, ?User $actor = null): SystemStorageConfig
    {
        DB::transaction(function () use ($config, $actor): void {
            SystemStorageConfig::query()->update(['is_default' => false]);

            $config->forceFill([
                'is_active' => true,
                'is_default' => true,
                'updated_by_user_id' => $actor?->id,
            ])->save();
        });

        return $config->refresh();
    }

    public function delete(SystemStorageConfig $config): void
    {
        $config->delete();
    }

    public function test(SystemStorageConfig $config): array
    {
        return $this->testDiskConfiguration($this->diskConfiguration($config), $config);
    }

    public function testPayloadFromRequest(array $payload): array
    {
        $temporaryModel = new SystemStorageConfig();
        $this->fillModel($temporaryModel, $payload, null, ! isset($payload['id']));

        return $this->testDiskConfiguration($this->diskConfiguration($temporaryModel), $temporaryModel);
    }

    public function toArray(SystemStorageConfig $config): array
    {
        return [
            'id' => $config->id,
            'code' => $config->code,
            'name' => $config->name,
            'provider_type' => $config->provider_type,
            'bucket' => $config->bucket,
            'region' => $config->region,
            'endpoint' => $config->endpoint,
            'use_path_style_endpoint' => (bool) $config->use_path_style_endpoint,
            'prefix' => $config->prefix,
            'is_active' => (bool) $config->is_active,
            'is_default' => (bool) $config->is_default,
            'last_tested_at' => $config->last_tested_at?->toIso8601String(),
            'last_test_status' => $config->last_test_status,
            'last_test_message' => $config->last_test_message,
            'access_key_masked' => $config->maskAccessKey(),
            'secret_key_masked' => $config->maskSecretKey(),
            'has_access_key' => filled($config->access_key_encrypted),
            'has_secret_key' => filled($config->secret_key_encrypted),
            'created_at' => $config->created_at?->toIso8601String(),
            'updated_at' => $config->updated_at?->toIso8601String(),
        ];
    }

    public function activeConfig(): ?SystemStorageConfig
    {
        if (! $this->storageTableExists()) {
            return null;
        }

        return SystemStorageConfig::query()
            ->where('is_active', true)
            ->where('is_default', true)
            ->first();
    }

    private function fillModel(SystemStorageConfig $model, array $payload, ?User $actor, bool $isCreate): void
    {
        if ($isCreate) {
            $model->created_by_user_id = $actor?->id;
        }

        foreach ([
            'code',
            'name',
            'provider_type',
            'bucket',
            'region',
            'endpoint',
            'prefix',
        ] as $field) {
            if (array_key_exists($field, $payload)) {
                $model->{$field} = $payload[$field];
            }
        }

        if (array_key_exists('use_path_style_endpoint', $payload)) {
            $model->use_path_style_endpoint = (bool) $payload['use_path_style_endpoint'];
        }

        if (array_key_exists('is_active', $payload)) {
            $model->is_active = (bool) $payload['is_active'];
        }

        if (array_key_exists('is_default', $payload)) {
            $model->is_default = (bool) $payload['is_default'];
        }

        if (array_key_exists('access_key', $payload)) {
            $model->access_key_encrypted = filled($payload['access_key'])
                ? Crypt::encryptString((string) $payload['access_key'])
                : null;
        }

        if (array_key_exists('secret_key', $payload)) {
            $model->secret_key_encrypted = filled($payload['secret_key'])
                ? Crypt::encryptString((string) $payload['secret_key'])
                : null;
        }

        $model->updated_by_user_id = $actor?->id;
    }

    private function clearDefaultFlag(?int $exceptId = null): void
    {
        $query = SystemStorageConfig::query();

        if ($exceptId !== null) {
            $query->whereKeyNot($exceptId);
        }

        $query->update(['is_default' => false]);
    }

    private function testDiskConfiguration(array $diskConfiguration, ?SystemStorageConfig $config = null): array
    {
        $path = sprintf('healthchecks/%s.txt', (string) Str::uuid());
        $content = sprintf('familyhub-storage-test:%s', now()->toIso8601String());

        try {
            /** @var Filesystem $disk */
            $disk = Storage::build($diskConfiguration);

            $written = $disk->put($path, $content);
            if (! $written || ! $disk->exists($path)) {
                return $this->persistTestResult($config, 'error', 'Scrittura storage non riuscita.');
            }

            $read = $disk->get($path);
            $disk->delete($path);

            if ($read !== $content) {
                return $this->persistTestResult($config, 'error', 'Lettura storage non coerente con il contenuto scritto.');
            }

            return $this->persistTestResult($config, 'ok', 'Connessione storage verificata con successo.');
        } catch (Throwable $exception) {
            return $this->persistTestResult($config, 'error', $exception->getMessage());
        }
    }

    private function persistTestResult(?SystemStorageConfig $config, string $status, string $message): array
    {
        if ($config && $config->exists) {
            $config->forceFill([
                'last_tested_at' => now(),
                'last_test_status' => $status,
                'last_test_message' => $message,
            ])->save();
        }

        return [
            'status' => $status,
            'message' => $message,
            'tested_at' => now()->toIso8601String(),
        ];
    }

    private function diskConfiguration(SystemStorageConfig $config): array
    {
        return [
            'driver' => 's3',
            'key' => $config->decryptAccessKey(),
            'secret' => $config->decryptSecretKey(),
            'region' => $config->region ?: env('AWS_DEFAULT_REGION', 'eu-south-1'),
            'bucket' => $config->bucket,
            'endpoint' => $config->endpoint,
            'use_path_style_endpoint' => (bool) $config->use_path_style_endpoint,
            'root' => $config->prefix ?: null,
            'throw' => false,
            'report' => false,
        ];
    }

    private function envSummary(): array
    {
        return [
            'provider_type' => $this->inferProviderTypeFromEnv(),
            'bucket' => (string) env('AWS_BUCKET', ''),
            'region' => (string) env('AWS_DEFAULT_REGION', ''),
            'endpoint' => (string) env('AWS_ENDPOINT', ''),
            'use_path_style_endpoint' => filter_var(env('AWS_USE_PATH_STYLE_ENDPOINT', false), FILTER_VALIDATE_BOOL),
            'access_key_masked' => $this->maskValue((string) env('AWS_ACCESS_KEY_ID', '')),
            'secret_key_masked' => $this->maskValue((string) env('AWS_SECRET_ACCESS_KEY', '')),
            'disk' => (string) env('FILESYSTEM_DISK', 'local'),
        ];
    }

    private function inferProviderTypeFromEnv(): string
    {
        $endpoint = strtolower((string) env('AWS_ENDPOINT', ''));

        if (str_contains($endpoint, 'minio')) {
            return 'minio';
        }

        if (str_contains($endpoint, 'amazonaws.com')) {
            return 'aws_s3';
        }

        return 's3_compatible';
    }

    private function maskValue(?string $value): ?string
    {
        if (! filled($value)) {
            return null;
        }

        return sprintf('****%s', substr((string) $value, -4));
    }

    private function storageTableExists(): bool
    {
        try {
            return Schema::hasTable('system_storage_configs');
        } catch (Throwable) {
            return false;
        }
    }
}
