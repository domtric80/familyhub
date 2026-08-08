<?php

namespace App\Services\Geography;

use RuntimeException;

class IstatCityCsvSource
{
    public function parseFile(string $filePath): array
    {
        if (! is_file($filePath)) {
            throw new RuntimeException("File ISTAT non trovato: {$filePath}");
        }

        $handle = fopen($filePath, 'rb');

        if (! $handle) {
            throw new RuntimeException("Impossibile aprire il file ISTAT: {$filePath}");
        }

        $delimiter = (string) config('geography.sources.istat.delimiter', ';');
        $header = fgetcsv($handle, 0, $delimiter);

        if (! is_array($header)) {
            fclose($handle);

            throw new RuntimeException('Header CSV ISTAT non leggibile.');
        }

        $normalizedHeader = array_map([$this, 'normalizeHeader'], $header);
        $rows = [];

        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($data === [null] || $data === []) {
                continue;
            }

            $row = [];

            foreach ($normalizedHeader as $index => $key) {
                $row[$key] = isset($data[$index]) ? trim($this->normalizeEncoding((string) $data[$index])) : null;
            }

            $rows[] = $this->normalizeRow($row);
        }

        fclose($handle);

        return $rows;
    }

    private function normalizeHeader(string $value): string
    {
        $value = $this->normalizeEncoding($value);
        $value = strtolower(trim($value));
        $value = preg_replace('/[^a-z0-9]+/i', '_', $value) ?? $value;

        return trim($value, '_');
    }

    private function normalizeEncoding(string $value): string
    {
        if ($value === '') {
            return $value;
        }

        if (mb_check_encoding($value, 'UTF-8')) {
            return $value;
        }

        $converted = @mb_convert_encoding($value, 'UTF-8', ['Windows-1252', 'ISO-8859-1', 'UTF-8']);

        if (is_string($converted) && mb_check_encoding($converted, 'UTF-8')) {
            return $converted;
        }

        $iconv = @iconv('Windows-1252', 'UTF-8//IGNORE', $value);

        return is_string($iconv) ? $iconv : $value;
    }

    private function normalizeRow(array $row): array
    {
        return [
            'country_iso_code' => $row['country_iso_code'] ?? $row['iso_code_paese'] ?? 'IT',
            'region_code' => strtoupper((string) ($row['region_code'] ?? $row['codice_regione'] ?? '')),
            'region_name' => (string) ($row['region_name'] ?? $row['denominazione_regione'] ?? ''),
            'province_code' => strtoupper((string) (
                $row['province_code']
                ?? $row['codice_dell_unit_territoriale_sovracomunale_valida_a_fini_statistici']
                ?? $row['codice_provincia_storico_1']
                ?? $row['sigla_provincia']
                ?? ''
            )),
            'province_name' => (string) (
                $row['province_name']
                ?? $row['denominazione_dell_unit_territoriale_sovracomunale_valida_a_fini_statistici']
                ?? $row['denominazione_provincia']
                ?? ''
            ),
            'vehicle_code' => strtoupper((string) ($row['vehicle_code'] ?? $row['sigla_automobilistica'] ?? '')),
            'city_istat_code' => (string) (
                $row['city_istat_code']
                ?? $row['codice_comune_formato_alfanumerico']
                ?? $row['codice_comune_formato_numerico']
                ?? $row['codice_comune']
                ?? ''
            ),
            'city_name' => (string) (
                $row['city_name']
                ?? $row['denominazione_in_italiano']
                ?? $row['denominazione_italiana_e_straniera']
                ?? $row['denominazione_comune']
                ?? ''
            ),
            'cadastre_code' => strtoupper((string) (
                $row['cadastre_code']
                ?? $row['codice_catastale_del_comune']
                ?? $row['codice_catastale']
                ?? ''
            )),
            'postal_code' => (string) ($row['postal_code'] ?? $row['cap'] ?? ''),
        ];
    }
}
