<?php

namespace App\Console\Commands;

use App\Models\GeoImportRun;
use App\Models\GeoSourceCountryRaw;
use App\Services\Geography\AnprCityHistoryRawImporter;
use App\Services\Geography\GeoNamesCountrySource;
use App\Services\Geography\IstatCsvRawImporter;
use App\Services\Geography\ItalySeedRawImporter;
use App\Services\Geography\GeoSyncRunLogger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class GeoSyncCommand extends Command
{
    protected $signature = 'familyhub:geo-sync
        {--scope=full : Ambito di esecuzione}
        {--source=geonames : Sorgente da elaborare}
        {--dry-run : Esegue parse e quality checks senza publish}
        {--publish : Riservato a fasi successive}
        {--file= : File locale alternativo da usare come sorgente}';

    protected $description = 'Esegue la sincronizzazione geografica in modalità controllata.';

    public function __construct(
        private readonly GeoNamesCountrySource $geoNamesCountrySource = new GeoNamesCountrySource(),
        private readonly AnprCityHistoryRawImporter $anprCityHistoryRawImporter = new AnprCityHistoryRawImporter(),
        private readonly IstatCsvRawImporter $istatCsvRawImporter = new IstatCsvRawImporter(),
        private readonly ItalySeedRawImporter $italySeedRawImporter = new ItalySeedRawImporter(),
        private readonly GeoSyncRunLogger $runLogger = new GeoSyncRunLogger(),
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        if ($this->option('publish')) {
            $this->components->error('La pubblicazione automatica non è ancora disponibile in questa fase. Usa --dry-run.');

            return self::FAILURE;
        }

        $source = (string) $this->option('source');

        if (! in_array($source, ['geonames', 'seed', 'istat', 'anpr_history'], true)) {
            $this->components->error("Sorgente non supportata in questa fase: {$source}");

            return self::FAILURE;
        }

        $scope = (string) $this->option('scope');

        $run = GeoImportRun::query()->create([
            'run_uuid' => (string) Str::uuid(),
            'trigger_mode' => 'manual',
            'scope' => $scope,
            'status' => 'running',
            'started_at' => now(),
            'initiated_by_user_id' => null,
        ]);

        try {
            $summary = DB::transaction(function () use ($run, $source, $scope): array {
                if ($source === 'seed' || $scope === 'italy_admin_seed') {
                    return $this->runItalySeedImport($run);
                }

                if ($source === 'istat') {
                    return $this->runIstatCsvImport($run);
                }

                if ($source === 'anpr_history' || $scope === 'history_only') {
                    return $this->runAnprHistoryImport($run);
                }

                $acquireStep = $this->runLogger->startStep($run, 'download');
                $payload = $this->geoNamesCountrySource->fetch($this->option('file'));
                $sourceFile = $this->geoNamesCountrySource->persistFile($payload);
                $this->runLogger->completeStep($acquireStep, 1, 'Sorgente acquisita.', [
                    'file_name' => $sourceFile->file_name,
                    'storage_path' => $sourceFile->storage_path,
                    'sha256' => $sourceFile->sha256,
                ]);

                $parseStep = $this->runLogger->startStep($run, 'parse', 1);
                $countries = $this->geoNamesCountrySource->parseCountries($payload['content']);
                $this->runLogger->completeStep($parseStep, count($countries), 'Sorgente GeoNames parse completato.');

                $validateStep = $this->runLogger->startStep($run, 'validate', count($countries));
                $stats = $this->validateCountries($run, $countries);
                $this->runLogger->completeStep($validateStep, count($countries), 'Quality checks completati.', $stats);

                foreach ($countries as $country) {
                    GeoSourceCountryRaw::query()->create([
                        'geo_import_run_id' => $run->id,
                        'geo_source_file_id' => $sourceFile->id,
                        'source_system' => 'geonames',
                        'dataset_code' => 'countries',
                        'source_record_key' => $country['source_record_key'],
                        'source_name' => $country['name'],
                        'iso_code' => $country['iso_code'] ?: null,
                        'iso3_code' => $country['iso3_code'] ?: null,
                        'continent_code' => $country['continent_code'] ?? null,
                        'continent_name' => $country['continent_name'] ?? null,
                        'raw_payload_json' => $country,
                        'normalized_payload_json' => $country,
                    ]);
                }

                $reportStep = $this->runLogger->startStep($run, 'report', count($countries));
                $summary = [
                    'source' => 'geonames',
                    'dataset' => 'countries',
                    'mode' => $this->option('dry-run') ? 'dry-run' : 'check-only',
                    'countries_parsed' => count($countries),
                    ...$stats,
                ];
                $this->runLogger->completeStep($reportStep, count($countries), 'Report sintetico generato.', $summary);

                return [
                    'source_file_count' => 1,
                    'raw_record_count' => count($countries),
                    'normalized_record_count' => count($countries),
                    'published_record_count' => 0,
                    'issue_count' => $run->issues()->count(),
                    'error_count' => $run->issues()->whereIn('severity', ['error', 'critical'])->count(),
                    'summary_json' => $summary,
                ];
            });

            $hasBlockingIssues = $run->issues()->where('is_blocking', true)->exists();
            $hasWarnings = $run->issues()->exists();

            $run->update([
                ...$summary,
                'status' => $hasBlockingIssues ? 'failed' : ($hasWarnings ? 'completed_with_warnings' : 'completed'),
                'finished_at' => now(),
            ]);

            $this->components->info('Geo sync dry-run completato.');
            $this->line("Run UUID: {$run->run_uuid}");
            $this->line('Paesi letti: '.$run->raw_record_count);
            $this->line('Issue: '.$run->issue_count);
            $this->line('Errori: '.$run->error_count);

            return $hasBlockingIssues ? self::FAILURE : self::SUCCESS;
        } catch (Throwable $throwable) {
            $run->update([
                'status' => 'failed',
                'finished_at' => now(),
                'summary_json' => [
                    'message' => $throwable->getMessage(),
                ],
                'issue_count' => $run->issues()->count(),
                'error_count' => max(1, $run->issues()->whereIn('severity', ['error', 'critical'])->count()),
            ]);

            $this->components->error($throwable->getMessage());

            return self::FAILURE;
        }
    }

    private function validateCountries(GeoImportRun $run, array $countries): array
    {
        $seenIsoCodes = [];
        $valid = 0;
        $warnings = 0;
        $errors = 0;

        foreach ($countries as $country) {
            $isoCode = (string) ($country['iso_code'] ?? '');
            $name = trim((string) ($country['name'] ?? ''));
            $sourceRecordKey = (string) ($country['source_record_key'] ?? $isoCode);

            $blocking = false;

            if (strlen($isoCode) !== 2) {
                $blocking = true;
                $errors++;
                $this->runLogger->addIssue(
                    $run,
                    'error',
                    'invalid_iso_code',
                    'country',
                    "Codice ISO non valido per il record {$sourceRecordKey}.",
                    true,
                    'geonames',
                    $sourceRecordKey,
                    ['iso_code' => $isoCode, 'name' => $name],
                );
            }

            if ($name === '') {
                $blocking = true;
                $errors++;
                $this->runLogger->addIssue(
                    $run,
                    'error',
                    'missing_name',
                    'country',
                    "Nome nazione mancante per il record {$sourceRecordKey}.",
                    true,
                    'geonames',
                    $sourceRecordKey,
                    ['iso_code' => $isoCode],
                );
            }

            if ($isoCode !== '') {
                if (isset($seenIsoCodes[$isoCode])) {
                    $blocking = true;
                    $errors++;
                    $this->runLogger->addIssue(
                        $run,
                        'error',
                        'duplicate_iso_code',
                        'country',
                        "Codice ISO duplicato rilevato: {$isoCode}.",
                        true,
                        'geonames',
                        $sourceRecordKey,
                        ['iso_code' => $isoCode, 'name' => $name],
                    );
                } else {
                    $seenIsoCodes[$isoCode] = true;
                }
            }

            if (($country['iso3_code'] ?? '') === '') {
                $warnings++;
                $this->runLogger->addIssue(
                    $run,
                    'warning',
                    'missing_iso3_code',
                    'country',
                    "Codice ISO3 mancante per {$name}.",
                    false,
                    'geonames',
                    $sourceRecordKey,
                    ['iso_code' => $isoCode, 'name' => $name],
                );
            }

            if (! $blocking) {
                $valid++;
            }
        }

        return [
            'valid_countries' => $valid,
            'warning_count' => $warnings,
            'error_count' => $errors,
        ];
    }

    private function runItalySeedImport(GeoImportRun $run): array
    {
        $parseStep = $this->runLogger->startStep($run, 'parse');
        $stats = $this->italySeedRawImporter->import($run);
        $rawCount = $stats['countries'] + $stats['regions'] + $stats['provinces'] + $stats['cities'];
        $this->runLogger->completeStep($parseStep, $rawCount, 'Seed Italia importato nelle raw tables.', $stats);

        $validateStep = $this->runLogger->startStep($run, 'validate', $rawCount);
        $this->runLogger->completeStep($validateStep, $rawCount, 'Validazione seed iniziale completata.', [
            'warning_count' => 0,
            'error_count' => 0,
        ]);

        $reportStep = $this->runLogger->startStep($run, 'report', $rawCount);
        $summary = [
            'source' => 'seed',
            'dataset' => 'italy_admin_seed',
            'mode' => 'dry-run',
            'countries_parsed' => $stats['countries'],
            'regions_parsed' => $stats['regions'],
            'provinces_parsed' => $stats['provinces'],
            'cities_parsed' => $stats['cities'],
            'warning_count' => 0,
            'error_count' => 0,
        ];
        $this->runLogger->completeStep($reportStep, $rawCount, 'Report seed Italia generato.', $summary);

        return [
            'source_file_count' => 0,
            'raw_record_count' => $rawCount,
            'normalized_record_count' => $rawCount,
            'published_record_count' => 0,
            'issue_count' => 0,
            'error_count' => 0,
            'summary_json' => $summary,
        ];
    }

    private function runIstatCsvImport(GeoImportRun $run): array
    {
        $file = $this->option('file');

        if (! is_string($file) || trim($file) === '') {
            throw new \RuntimeException('Per source=istat è obbligatorio fornire --file con export CSV.');
        }

        $parseStep = $this->runLogger->startStep($run, 'parse');
        $stats = $this->istatCsvRawImporter->import($run, $file);
        $rawCount = $stats['countries'] + $stats['regions'] + $stats['provinces'] + $stats['cities'];
        $this->runLogger->completeStep($parseStep, $rawCount, 'CSV ISTAT importato nelle raw tables.', $stats);

        $validateStep = $this->runLogger->startStep($run, 'validate', $rawCount);
        $warningCount = (int) $stats['issues'];
        $this->runLogger->completeStep($validateStep, $rawCount, 'Validazione CSV ISTAT completata.', [
            'warning_count' => $warningCount,
            'error_count' => 0,
        ]);

        $reportStep = $this->runLogger->startStep($run, 'report', $rawCount);
        $summary = [
            'source' => 'istat',
            'dataset' => 'italy_cities_csv',
            'mode' => 'dry-run',
            'countries_parsed' => $stats['countries'],
            'regions_parsed' => $stats['regions'],
            'provinces_parsed' => $stats['provinces'],
            'cities_parsed' => $stats['cities'],
            'warning_count' => $warningCount,
            'error_count' => 0,
        ];
        $this->runLogger->completeStep($reportStep, $rawCount, 'Report CSV ISTAT generato.', $summary);

        return [
            'source_file_count' => 1,
            'raw_record_count' => $rawCount,
            'normalized_record_count' => $rawCount,
            'published_record_count' => 0,
            'issue_count' => $warningCount,
            'error_count' => 0,
            'summary_json' => $summary,
        ];
    }

    private function runAnprHistoryImport(GeoImportRun $run): array
    {
        $file = $this->option('file');

        if (! is_string($file) || trim($file) === '') {
            throw new \RuntimeException('Per source=anpr_history è obbligatorio fornire --file con export CSV storico.');
        }

        $parseStep = $this->runLogger->startStep($run, 'parse');
        $stats = $this->anprCityHistoryRawImporter->import($run, $file);
        $rawCount = $stats['history_events'];
        $this->runLogger->completeStep($parseStep, $rawCount, 'CSV storico ANPR importato nelle raw tables.', $stats);

        $validateStep = $this->runLogger->startStep($run, 'validate', $rawCount);
        $warningCount = (int) $stats['issues'];
        $this->runLogger->completeStep($validateStep, $rawCount, 'Validazione storico ANPR completata.', [
            'warning_count' => $warningCount,
            'error_count' => 0,
        ]);

        $reportStep = $this->runLogger->startStep($run, 'report', $rawCount);
        $summary = [
            'source' => 'anpr_history',
            'dataset' => 'city_history_csv',
            'mode' => 'dry-run',
            'history_events_parsed' => $rawCount,
            'warning_count' => $warningCount,
            'error_count' => 0,
        ];
        $this->runLogger->completeStep($reportStep, $rawCount, 'Report storico ANPR generato.', $summary);

        return [
            'source_file_count' => 1,
            'raw_record_count' => $rawCount,
            'normalized_record_count' => $rawCount,
            'published_record_count' => 0,
            'issue_count' => $warningCount,
            'error_count' => 0,
            'summary_json' => $summary,
        ];
    }
}
