<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use RuntimeException;

class DatabaseBackupService
{
    public function listBackups(): array
    {
        $dir = $this->backupDirectory();

        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0775, true);
        }

        return collect(File::files($dir))
            ->filter(fn (\SplFileInfo $file): bool => str_ends_with(strtolower($file->getFilename()), '.sql'))
            ->map(fn (\SplFileInfo $file): array => [
                'filename' => $file->getFilename(),
                'path' => $file->getRealPath(),
                'size_bytes' => $file->getSize(),
                'created_at' => Carbon::createFromTimestamp($file->getMTime())->toISOString(),
                'download_url' => '/api/admin/database-backups/download?filename='.rawurlencode($file->getFilename()),
            ])
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }

    public function createBackup(?string $label = null): array
    {
        $dir = $this->backupDirectory();

        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0775, true);
        }

        $timestamp = now()->format('Ymd-His');
        $suffix = $label ? '-'.$this->sanitizeLabel($label) : '';
        $filename = "familyhub-{$timestamp}{$suffix}.sql";
        $fullPath = $dir.DIRECTORY_SEPARATOR.$filename;

        $command = sprintf(
            'PGPASSWORD=%s pg_dump -h %s -p %s -U %s -d %s --no-owner --no-privileges > %s',
            escapeshellarg((string) config('database.connections.pgsql.password')),
            escapeshellarg((string) config('database.connections.pgsql.host')),
            escapeshellarg((string) config('database.connections.pgsql.port')),
            escapeshellarg((string) config('database.connections.pgsql.username')),
            escapeshellarg((string) config('database.connections.pgsql.database')),
            escapeshellarg($fullPath),
        );

        $this->runShell($command, 'Backup database fallito.');

        return $this->describeBackup($filename);
    }

    public function restoreFromExistingBackup(string $filename, bool $createPreRestoreBackup = true): array
    {
        $path = $this->backupDirectory().DIRECTORY_SEPARATOR.$filename;

        if (! File::exists($path)) {
            throw new RuntimeException('Backup file non trovato.');
        }

        return $this->restoreFromPath($path, $filename, $createPreRestoreBackup);
    }

    public function restoreFromUploadedFile(UploadedFile $file, bool $createPreRestoreBackup = true): array
    {
        $dir = $this->backupDirectory();

        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0775, true);
        }

        $filename = 'upload-restore-'.now()->format('Ymd-His').'-'.$this->sanitizeLabel(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.sql';
        $path = $dir.DIRECTORY_SEPARATOR.$filename;

        File::put($path, $file->get());

        return $this->restoreFromPath($path, $filename, $createPreRestoreBackup, true);
    }

    public function getBackupPath(string $filename): string
    {
        $path = $this->backupDirectory().DIRECTORY_SEPARATOR.$filename;

        if (! File::exists($path)) {
            throw new RuntimeException('Backup file non trovato.');
        }

        return $path;
    }

    private function restoreFromPath(string $path, string $sourceLabel, bool $createPreRestoreBackup = true, bool $uploaded = false): array
    {
        $preRestoreBackup = $createPreRestoreBackup ? $this->createBackup('pre-restore') : null;

        DB::disconnect('pgsql');

        $dropSchemaCommand = sprintf(
            'PGPASSWORD=%s psql -h %s -p %s -U %s -d %s -v ON_ERROR_STOP=1 -c %s',
            escapeshellarg((string) config('database.connections.pgsql.password')),
            escapeshellarg((string) config('database.connections.pgsql.host')),
            escapeshellarg((string) config('database.connections.pgsql.port')),
            escapeshellarg((string) config('database.connections.pgsql.username')),
            escapeshellarg((string) config('database.connections.pgsql.database')),
            escapeshellarg('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO familyhub; GRANT ALL ON SCHEMA public TO public;'),
        );

        $restoreCommand = sprintf(
            'PGPASSWORD=%s psql -h %s -p %s -U %s -d %s -v ON_ERROR_STOP=1 < %s',
            escapeshellarg((string) config('database.connections.pgsql.password')),
            escapeshellarg((string) config('database.connections.pgsql.host')),
            escapeshellarg((string) config('database.connections.pgsql.port')),
            escapeshellarg((string) config('database.connections.pgsql.username')),
            escapeshellarg((string) config('database.connections.pgsql.database')),
            escapeshellarg($path),
        );

        $this->runShell($dropSchemaCommand, 'Reset schema pre-restore fallito.');
        $this->runShell($restoreCommand, 'Import backup fallito.');

        DB::reconnect('pgsql');

        return [
            'restored' => true,
            'source' => [
                'filename' => $sourceLabel,
                'uploaded' => $uploaded,
            ],
            'pre_restore_backup' => $preRestoreBackup,
            'post_restore_counts' => $this->criticalCounts(),
        ];
    }

    private function describeBackup(string $filename): array
    {
        $path = $this->backupDirectory().DIRECTORY_SEPARATOR.$filename;

        return [
            'filename' => $filename,
            'path' => $path,
            'size_bytes' => File::size($path),
            'created_at' => Carbon::createFromTimestamp(File::lastModified($path))->toISOString(),
            'download_url' => '/api/admin/database-backups/download?filename='.rawurlencode($filename),
        ];
    }

    private function criticalCounts(): array
    {
        return [
            'users' => DB::table('users')->count(),
            'organizations' => DB::table('organizations')->count(),
            'facilities' => DB::table('facilities')->count(),
            'minors' => DB::table('minors')->count(),
            'attachments' => DB::table('attachments')->count(),
        ];
    }

    private function sanitizeLabel(string $label): string
    {
        $sanitized = preg_replace('/[^a-zA-Z0-9-_]+/', '-', $label) ?: 'backup';

        return trim($sanitized, '-_');
    }

    private function backupDirectory(): string
    {
        return (string) config('familyhub_backup.directory');
    }

    private function runShell(string $command, string $errorMessage): void
    {
        $output = [];
        $exitCode = 0;

        exec('/bin/sh -lc '.escapeshellarg($command).' 2>&1', $output, $exitCode);

        if ($exitCode !== 0) {
            throw new RuntimeException($errorMessage.' '.implode("\n", $output));
        }
    }
}
