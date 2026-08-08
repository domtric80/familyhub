<?php

namespace App\Console\Commands;

use App\Models\GeoImportRun;
use App\Services\Geography\CanonicalGeographyLoader;
use Illuminate\Console\Command;

class GeoLoadCommand extends Command
{
    protected $signature = 'familyhub:geo-load
        {--run-id= : Run raw da usare come sorgente}
        {--source=seed : Source system da caricare}
        {--latest : Usa l\'ultimo run disponibile per la sorgente}
        {--level=countries : Livello da scaricare: countries|regions|provinces|cities}
        {--recursive : Scarica anche tutti i figli dal livello corrente}
        {--continent= : Filtro continente per le nazioni}
        {--country-key= : Chiave sorgente della nazione}
        {--region-key= : Chiave sorgente della regione}
        {--province-key= : Chiave sorgente della provincia}';

    protected $description = 'Scarica i dati raw geografia nel master data canonico applicativo.';

    public function __construct(
        private readonly CanonicalGeographyLoader $loader = new CanonicalGeographyLoader(),
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $source = (string) $this->option('source');
        $runId = $this->option('run-id');
        $level = (string) $this->option('level');
        $recursive = (bool) $this->option('recursive');

        if ($this->option('latest')) {
            $runId = GeoImportRun::query()
                ->whereJsonContains('summary_json->source', $source)
                ->latest('id')
                ->value('id');
        }

        if (! $runId) {
            $this->components->error('Specificare --run-id oppure --latest.');

            return self::FAILURE;
        }

        if (! in_array($level, ['countries', 'regions', 'provinces', 'cities'], true)) {
            $this->components->error('Valore --level non valido. Usare: countries, regions, provinces, cities.');

            return self::FAILURE;
        }

        try {
            $stats = $this->loader->loadSelection(
                runId: (int) $runId,
                sourceSystem: $source,
                level: $level,
                recursive: $recursive,
                continentCode: $this->option('continent') ? (string) $this->option('continent') : null,
                countryKey: $this->option('country-key') ? (string) $this->option('country-key') : null,
                regionKey: $this->option('region-key') ? (string) $this->option('region-key') : null,
                provinceKey: $this->option('province-key') ? (string) $this->option('province-key') : null,
            );
        } catch (\RuntimeException $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->components->info('Scarico geografia completato.');
        $this->line('Run ID: '.(int) $runId);
        $this->line('Source: '.$source);
        $this->line('Level: '.$stats['level']);
        $this->line('Recursive: '.($stats['recursive'] ? 'yes' : 'no'));
        $this->line('Countries: '.$stats['countries']);
        $this->line('Regions: '.$stats['regions']);
        $this->line('Provinces: '.$stats['provinces']);
        $this->line('Cities: '.$stats['cities']);

        return self::SUCCESS;
    }
}
