<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Throwable;

class SystemHealthService
{
    public const WORKER_HEARTBEAT_CACHE_KEY = 'system_health.worker.last_seen_at';

    public const SCHEDULER_HEARTBEAT_CACHE_KEY = 'system_health.scheduler.last_seen_at';

    public function __construct(
        private readonly StorageConfigService $storageConfigService = new StorageConfigService,
    ) {}

    public function snapshot(): array
    {
        $services = [
            $this->apiCheck(),
            $this->databaseCheck(),
            $this->redisCheck(),
            $this->queueWorkerCheck(),
            $this->schedulerCheck(),
            $this->storageCheck(),
            $this->antivirusCheck(),
            $this->smtpCheck(),
        ];

        $minioConsole = $this->minioConsoleCheck();
        if ($minioConsole !== null) {
            $services[] = $minioConsole;
        }

        return [
            'generated_at' => now()->toIso8601String(),
            'storage_config_source' => $this->storageConfigService->currentSource(),
            'summary' => [
                'ok' => count(array_filter($services, fn (array $service): bool => $service['status'] === 'ok')),
                'warning' => count(array_filter($services, fn (array $service): bool => $service['status'] === 'warning')),
                'error' => count(array_filter($services, fn (array $service): bool => $service['status'] === 'error')),
                'not_configured' => count(array_filter($services, fn (array $service): bool => $service['status'] === 'not_configured')),
            ],
            'services' => $services,
        ];
    }

    public function markWorkerHeartbeat(): void
    {
        Cache::forever(self::WORKER_HEARTBEAT_CACHE_KEY, now()->toIso8601String());
    }

    public function markSchedulerHeartbeat(): void
    {
        Cache::forever(self::SCHEDULER_HEARTBEAT_CACHE_KEY, now()->toIso8601String());
    }

    private function apiCheck(): array
    {
        return $this->result('api_backend', 'API backend', 'ok', 'API applicativa disponibile.');
    }

    private function databaseCheck(): array
    {
        $startedAt = microtime(true);

        try {
            DB::connection()->select('select 1');

            return $this->result(
                'database',
                'PostgreSQL',
                'ok',
                'Connessione database riuscita.',
                $this->latency($startedAt),
                null,
                null,
                [
                    'connection' => (string) config('database.default'),
                    'database' => (string) config('database.connections.'.config('database.default').'.database'),
                ],
            );
        } catch (Throwable $exception) {
            return $this->result(
                'database',
                'PostgreSQL',
                'error',
                'Connessione database non riuscita.',
                $this->latency($startedAt),
                $exception->getMessage(),
            );
        }
    }

    private function redisCheck(): array
    {
        $startedAt = microtime(true);

        try {
            $response = Redis::connection()->command('PING');
            $isPong = $response === true || strtoupper(trim((string) $response)) === 'PONG';

            return $this->result(
                'redis',
                'Redis',
                $isPong ? 'ok' : 'warning',
                $isPong ? 'Redis raggiungibile.' : 'Redis risponde in modo inatteso.',
                $this->latency($startedAt),
                null,
                null,
                [
                    'client' => (string) config('database.redis.client'),
                    'response' => $isPong ? 'PONG' : (string) $response,
                ],
            );
        } catch (Throwable $exception) {
            return $this->result(
                'redis',
                'Redis',
                'error',
                'Connessione Redis non riuscita.',
                $this->latency($startedAt),
                $exception->getMessage(),
            );
        }
    }

    private function queueWorkerCheck(): array
    {
        $connection = (string) config('queue.default');
        if ($connection === 'sync') {
            return $this->result(
                'queue_worker',
                'Queue worker',
                'not_configured',
                'Queue in modalità sync: worker dedicato non richiesto.',
                null,
                null,
                null,
                ['queue_connection' => $connection],
            );
        }

        return $this->heartbeatResult(
            'queue_worker',
            'Queue worker',
            self::WORKER_HEARTBEAT_CACHE_KEY,
            15,
            'Nessun heartbeat worker recente rilevato.',
            'Heartbeat worker recente rilevato.',
            ['queue_connection' => $connection],
        );
    }

    private function schedulerCheck(): array
    {
        return $this->heartbeatResult(
            'scheduler',
            'Scheduler',
            self::SCHEDULER_HEARTBEAT_CACHE_KEY,
            5,
            'Nessun heartbeat scheduler recente rilevato.',
            'Heartbeat scheduler recente rilevato.',
        );
    }

    private function storageCheck(): array
    {
        $disk = (string) config('filesystems.default');
        $startedAt = microtime(true);

        try {
            Storage::disk($disk)->exists('__familyhub_healthcheck__');

            return $this->result(
                'storage',
                'Storage documentale',
                'ok',
                'Storage raggiungibile.',
                $this->latency($startedAt),
                null,
                null,
                [
                    'disk' => $disk,
                    'driver' => (string) config("filesystems.disks.{$disk}.driver"),
                    'bucket' => (string) config("filesystems.disks.{$disk}.bucket"),
                    'endpoint' => (string) config("filesystems.disks.{$disk}.endpoint"),
                ],
            );
        } catch (Throwable $exception) {
            return $this->result(
                'storage',
                'Storage documentale',
                'error',
                'Storage non raggiungibile.',
                $this->latency($startedAt),
                $exception->getMessage(),
                null,
                [
                    'disk' => $disk,
                    'driver' => (string) config("filesystems.disks.{$disk}.driver"),
                ],
            );
        }
    }

    private function antivirusCheck(): array
    {
        $driver = (string) config('document_security.scan.driver');

        if ($driver !== 'clamav') {
            return $this->result(
                'antivirus',
                'Antivirus ClamAV',
                'not_configured',
                sprintf('Driver antivirus attivo "%s": test ClamAV non applicabile.', $driver),
                null,
                null,
                null,
                ['driver' => $driver],
            );
        }

        $host = (string) config('document_security.scan.host');
        $port = (int) config('document_security.scan.port');

        if ($host === '' || $port <= 0) {
            return $this->result(
                'antivirus',
                'Antivirus ClamAV',
                'warning',
                'Configurazione ClamAV incompleta.',
                null,
                null,
                null,
                ['driver' => $driver],
            );
        }

        return $this->socketCheck(
            'antivirus',
            'Antivirus ClamAV',
            $host,
            $port,
            'Servizio antivirus raggiungibile.',
            'Servizio antivirus non raggiungibile.',
        );
    }

    private function smtpCheck(): array
    {
        $mailer = (string) config('mail.default');
        if ($mailer !== 'smtp') {
            return $this->result(
                'smtp',
                'SMTP',
                'not_configured',
                sprintf('Mailer attivo "%s": test SMTP non applicabile.', $mailer),
                null,
                null,
                null,
                ['mailer' => $mailer],
            );
        }

        $host = (string) config('mail.mailers.smtp.host');
        $port = (int) config('mail.mailers.smtp.port');

        if ($host === '' || $port <= 0) {
            return $this->result(
                'smtp',
                'SMTP',
                'warning',
                'Configurazione SMTP incompleta.',
                null,
                null,
                null,
                ['mailer' => $mailer],
            );
        }

        return $this->socketCheck(
            'smtp',
            'SMTP',
            $host,
            $port,
            'Server SMTP raggiungibile.',
            'Server SMTP non raggiungibile.',
            ['mailer' => $mailer, 'host' => $host, 'port' => $port],
        );
    }

    private function minioConsoleCheck(): ?array
    {
        $endpoint = (string) config('filesystems.disks.s3.endpoint');
        if ($endpoint === '' || ! str_contains($endpoint, 'minio')) {
            return null;
        }

        $host = parse_url($endpoint, PHP_URL_HOST);
        if (! is_string($host) || $host === '') {
            return null;
        }

        return $this->socketCheck(
            'minio_console',
            'MinIO console',
            $host,
            9001,
            'Console MinIO raggiungibile.',
            'Console MinIO non raggiungibile.',
        );
    }

    private function socketCheck(
        string $service,
        string $label,
        string $host,
        int $port,
        string $successMessage,
        string $failureMessage,
        array $meta = [],
    ): array {
        $startedAt = microtime(true);
        $errno = 0;
        $errstr = '';
        $socket = @fsockopen($host, $port, $errno, $errstr, 3.0);

        if ($socket !== false) {
            fclose($socket);

            return $this->result(
                $service,
                $label,
                'ok',
                $successMessage,
                $this->latency($startedAt),
                null,
                null,
                array_merge($meta, ['host' => $host, 'port' => $port]),
            );
        }

        return $this->result(
            $service,
            $label,
            'error',
            $failureMessage,
            $this->latency($startedAt),
            trim(sprintf('%s (%s)', $errstr, $errno)),
            null,
            array_merge($meta, ['host' => $host, 'port' => $port]),
        );
    }

    private function heartbeatResult(
        string $service,
        string $label,
        string $cacheKey,
        int $freshWithinMinutes,
        string $staleMessage,
        string $okMessage,
        array $meta = [],
    ): array {
        $raw = Cache::get($cacheKey);
        if (! is_string($raw) || $raw === '') {
            return $this->result($service, $label, 'warning', $staleMessage, null, null, null, $meta);
        }

        try {
            $seenAt = Carbon::parse($raw);
            $minutes = $seenAt->diffInMinutes(now());
            $status = $minutes <= $freshWithinMinutes ? 'ok' : 'warning';

            return $this->result(
                $service,
                $label,
                $status,
                $status === 'ok' ? $okMessage : $staleMessage,
                null,
                null,
                $seenAt->toIso8601String(),
                array_merge($meta, ['last_seen_at' => $seenAt->toIso8601String()]),
            );
        } catch (Throwable) {
            return $this->result($service, $label, 'warning', $staleMessage, null, null, null, $meta);
        }
    }

    private function result(
        string $service,
        string $label,
        string $status,
        string $message,
        ?float $latencyMs = null,
        ?string $error = null,
        ?string $checkedAt = null,
        array $meta = [],
    ): array {
        return [
            'service' => $service,
            'label' => $label,
            'status' => $status,
            'checked_at' => $checkedAt ?? now()->toIso8601String(),
            'latency_ms' => $latencyMs !== null ? round($latencyMs, 2) : null,
            'message' => $message,
            'error' => $error,
            'meta' => $meta,
        ];
    }

    private function latency(float $startedAt): float
    {
        return (microtime(true) - $startedAt) * 1000;
    }
}
