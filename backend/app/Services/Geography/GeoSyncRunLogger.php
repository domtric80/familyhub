<?php

namespace App\Services\Geography;

use App\Models\GeoImportIssue;
use App\Models\GeoImportRun;
use App\Models\GeoImportRunStep;

class GeoSyncRunLogger
{
    public function startStep(GeoImportRun $run, string $stepCode, int $recordsIn = 0): GeoImportRunStep
    {
        return $run->steps()->create([
            'step_code' => $stepCode,
            'status' => 'running',
            'started_at' => now(),
            'records_in' => $recordsIn,
            'records_out' => 0,
        ]);
    }

    public function completeStep(GeoImportRunStep $step, int $recordsOut = 0, ?string $message = null, ?array $metrics = null): void
    {
        $step->update([
            'status' => 'completed',
            'finished_at' => now(),
            'records_out' => $recordsOut,
            'message' => $message,
            'metrics_json' => $metrics,
        ]);
    }

    public function failStep(GeoImportRunStep $step, string $message, ?array $metrics = null): void
    {
        $step->update([
            'status' => 'failed',
            'finished_at' => now(),
            'message' => $message,
            'metrics_json' => $metrics,
        ]);
    }

    public function addIssue(
        GeoImportRun $run,
        string $severity,
        string $issueType,
        string $entityLevel,
        string $message,
        bool $isBlocking = false,
        ?string $sourceSystem = null,
        ?string $sourceRecordKey = null,
        ?array $details = null,
    ): GeoImportIssue {
        return $run->issues()->create([
            'severity' => $severity,
            'issue_type' => $issueType,
            'entity_level' => $entityLevel,
            'source_system' => $sourceSystem,
            'source_record_key' => $sourceRecordKey,
            'message' => $message,
            'details_json' => $this->sanitizeForJson($details),
            'is_blocking' => $isBlocking,
        ]);
    }

    private function sanitizeForJson(mixed $value): mixed
    {
        if (is_array($value)) {
            $sanitized = [];

            foreach ($value as $key => $item) {
                $sanitized[$this->sanitizeScalar($key)] = $this->sanitizeForJson($item);
            }

            return $sanitized;
        }

        return $this->sanitizeScalar($value);
    }

    private function sanitizeScalar(mixed $value): mixed
    {
        if (! is_string($value)) {
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
}
