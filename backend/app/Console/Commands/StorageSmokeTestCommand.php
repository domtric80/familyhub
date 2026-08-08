<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class StorageSmokeTestCommand extends Command
{
    protected $signature = 'familyhub:storage-smoke
        {--disk= : Disk da verificare (default: filesystems.default)}
        {--prefix=healthchecks : Prefisso path per il file temporaneo}
        {--keep-file : Non cancellare il file temporaneo al termine}';

    protected $description = 'Esegue una verifica di scrittura, lettura e cancellazione sullo storage configurato.';

    public function handle(): int
    {
        $disk = (string) ($this->option('disk') ?: config('filesystems.default', 'local'));
        $prefix = trim((string) $this->option('prefix'), '/');
        $keepFile = (bool) $this->option('keep-file');
        $path = sprintf('%s/%s.txt', $prefix !== '' ? $prefix : 'healthchecks', (string) Str::uuid());
        $content = sprintf('familyhub-storage-smoke:%s', now()->toIso8601String());

        $this->components->info(sprintf('Verifica storage disk [%s] sul path [%s].', $disk, $path));

        try {
            $storage = Storage::disk($disk);

            $written = $storage->put($path, $content);
            if (! $written) {
                $this->components->error('Scrittura fallita: il driver ha restituito false.');

                return self::FAILURE;
            }

            if (! $storage->exists($path)) {
                $this->components->error('Scrittura fallita: il file non risulta presente dopo il put.');

                return self::FAILURE;
            }

            $readBack = $storage->get($path);
            if ($readBack !== $content) {
                $this->components->error('Lettura fallita: il contenuto letto non coincide con quello scritto.');

                return self::FAILURE;
            }

            $size = null;

            try {
                $size = $storage->size($path);
            } catch (Throwable) {
                $size = null;
            }

            $this->components->info(sprintf(
                'Storage OK: scrittura e lettura riuscite%s.',
                $size !== null ? sprintf(' (size=%d bytes)', $size) : ''
            ));

            if (! $keepFile) {
                $storage->delete($path);

                if ($storage->exists($path)) {
                    $this->components->error('Cancellazione fallita: il file temporaneo risulta ancora presente.');

                    return self::FAILURE;
                }

                $this->components->info('File temporaneo eliminato correttamente.');
            } else {
                $this->components->warn('File temporaneo mantenuto su richiesta.');
            }

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->components->error(sprintf(
                'Storage KO [%s]: %s',
                class_basename($exception),
                $exception->getMessage()
            ));

            return self::FAILURE;
        }
    }
}
