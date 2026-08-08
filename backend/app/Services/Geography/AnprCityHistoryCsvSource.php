<?php

namespace App\Services\Geography;

use RuntimeException;

class AnprCityHistoryCsvSource
{
    public function parseFile(string $filePath): array
    {
        if (! is_file($filePath)) {
            throw new RuntimeException("File storico ANPR non trovato: {$filePath}");
        }

        $handle = fopen($filePath, 'rb');

        if (! $handle) {
            throw new RuntimeException("Impossibile aprire il file storico ANPR: {$filePath}");
        }

        $delimiter = (string) config('geography.sources.anpr_history.delimiter', ';');
        $header = fgetcsv($handle, 0, $delimiter);

        if (! is_array($header)) {
            fclose($handle);

            throw new RuntimeException('Header CSV storico ANPR non leggibile.');
        }

        $normalizedHeader = array_map([$this, 'normalizeHeader'], $header);
        $rows = [];

        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($data === [null] || $data === []) {
                continue;
            }

            $row = [];

            foreach ($normalizedHeader as $index => $key) {
                $row[$key] = isset($data[$index]) ? trim((string) $data[$index]) : null;
            }

            $rows[] = $this->normalizeRow($row);
        }

        fclose($handle);

        return $rows;
    }

    private function normalizeHeader(string $value): string
    {
        $value = strtolower(trim($value));
        $value = preg_replace('/[^a-z0-9]+/i', '_', $value) ?? $value;

        return trim($value, '_');
    }

    private function normalizeRow(array $row): array
    {
        return [
            'event_type' => strtolower((string) ($row['event_type'] ?? $row['tipo_evento'] ?? '')),
            'event_date' => (string) ($row['event_date'] ?? $row['data_evento'] ?? ''),
            'city_name' => (string) ($row['city_name'] ?? $row['denominazione_comune'] ?? ''),
            'city_istat_code' => (string) ($row['city_istat_code'] ?? $row['codice_comune'] ?? ''),
            'related_city_name' => (string) ($row['related_city_name'] ?? $row['denominazione_comune_correlato'] ?? ''),
            'related_city_istat_code' => (string) ($row['related_city_istat_code'] ?? $row['codice_comune_correlato'] ?? ''),
            'notes' => (string) ($row['notes'] ?? $row['note'] ?? ''),
        ];
    }
}
