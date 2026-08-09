<?php

namespace App\Services;

use App\Models\Attachment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use SimpleXMLElement;

class SpreadsheetPreviewService
{
    private const MAX_SHEETS = 3;
    private const MAX_ROWS_PER_SHEET = 100;
    private const MAX_COLUMNS_PER_SHEET = 20;
    private const MAX_CELL_LENGTH = 500;

    public function canRender(?string $mimeType, ?string $fileName): bool
    {
        $mime = strtolower((string) $mimeType);
        $name = strtolower((string) $fileName);

        return $mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            || str_ends_with($name, '.xlsx');
    }

    public function buildFromAttachment(Attachment $attachment): array
    {
        if (! $this->canRender($attachment->mime_type, $attachment->original_name)) {
            throw new RuntimeException('Anteprima strutturata disponibile solo per file XLSX.');
        }

        $temporaryPath = $this->copyAttachmentToTemporaryFile($attachment);

        try {
            return $this->parseXlsxFile($temporaryPath, $attachment);
        } finally {
            @unlink($temporaryPath);
        }
    }

    private function copyAttachmentToTemporaryFile(Attachment $attachment): string
    {
        $stream = Storage::disk($attachment->disk)->readStream($attachment->path);

        if ($stream === false) {
            throw new RuntimeException('Impossibile leggere lo stream del file allegato.');
        }

        $target = storage_path('app/tmp/document-previews/'.Str::uuid().'.xlsx');
        $directory = dirname($target);

        if (! is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $handle = fopen($target, 'wb');

        if ($handle === false) {
            if (is_resource($stream)) {
                fclose($stream);
            }

            throw new RuntimeException('Impossibile creare il file temporaneo per l’anteprima.');
        }

        stream_copy_to_stream($stream, $handle);
        fclose($handle);

        if (is_resource($stream)) {
            fclose($stream);
        }

        return $target;
    }

    private function parseXlsxFile(string $path, Attachment $attachment): array
    {
        $sharedStrings = $this->readSharedStrings($path);
        $workbook = $this->loadXmlEntry($path, 'xl/workbook.xml');
        $relationships = $this->readRelationships($path);
        $sheets = [];
        $sheetCount = 0;
        $truncatedSheets = false;

        foreach ($workbook->sheets->sheet as $sheetNode) {
            if ($sheetCount >= self::MAX_SHEETS) {
                $truncatedSheets = true;
                break;
            }

            $attributes = $sheetNode->attributes();
            $relationshipAttributes = $sheetNode->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
            $relationshipId = (string) ($relationshipAttributes['id'] ?? '');
            $sheetName = $this->sanitizeCellValue((string) ($attributes['name'] ?? 'Foglio'));
            $sheetTarget = $relationships[$relationshipId] ?? null;

            if (! is_string($sheetTarget) || $sheetTarget === '') {
                continue;
            }

            $sheetPath = $this->normalizeWorksheetPath($sheetTarget);
            $sheetXml = $this->loadXmlEntry($path, $sheetPath);
            $sheets[] = $this->parseSheet($sheetXml, $sheetName, $sharedStrings);
            $sheetCount++;
        }

        return [
            'kind' => 'spreadsheet',
            'format' => 'xlsx',
            'file_name' => $attachment->original_name,
            'mime_type' => $attachment->mime_type,
            'truncated_sheets' => $truncatedSheets,
            'limits' => [
                'max_sheets' => self::MAX_SHEETS,
                'max_rows_per_sheet' => self::MAX_ROWS_PER_SHEET,
                'max_columns_per_sheet' => self::MAX_COLUMNS_PER_SHEET,
                'max_cell_length' => self::MAX_CELL_LENGTH,
            ],
            'sheets' => $sheets,
        ];
    }

    private function normalizeWorksheetPath(string $target): string
    {
        $normalized = str_replace('\\', '/', trim($target));

        if (str_starts_with($normalized, '/')) {
            return ltrim($normalized, '/');
        }

        if (str_starts_with($normalized, 'xl/')) {
            return $normalized;
        }

        return 'xl/'.ltrim($normalized, '/');
    }

    private function parseSheet(SimpleXMLElement $sheetXml, string $sheetName, array $sharedStrings): array
    {
        $rows = [];
        $previewRowCount = 0;
        $maxColumnCount = 0;
        $truncatedRows = false;
        $truncatedColumns = false;

        foreach ($sheetXml->sheetData->row as $rowNode) {
            if ($previewRowCount >= self::MAX_ROWS_PER_SHEET) {
                $truncatedRows = true;
                break;
            }

            $rowValues = array_fill(0, self::MAX_COLUMNS_PER_SHEET, '');

            foreach ($rowNode->c as $cellNode) {
                $reference = (string) ($cellNode['r'] ?? '');
                $columnIndex = $this->columnIndexFromReference($reference);

                if ($columnIndex >= self::MAX_COLUMNS_PER_SHEET) {
                    $truncatedColumns = true;
                    continue;
                }

                $rowValues[$columnIndex] = $this->extractCellValue($cellNode, $sharedStrings);
            }

            $lastNonEmptyIndex = -1;
            for ($index = self::MAX_COLUMNS_PER_SHEET - 1; $index >= 0; $index--) {
                if ($rowValues[$index] !== '') {
                    $lastNonEmptyIndex = $index;
                    break;
                }
            }

            $trimmedRow = $lastNonEmptyIndex >= 0
                ? array_slice($rowValues, 0, $lastNonEmptyIndex + 1)
                : [];

            $maxColumnCount = max($maxColumnCount, count($trimmedRow));
            $rows[] = $trimmedRow;
            $previewRowCount++;
        }

        return [
            'name' => $sheetName,
            'rows' => $rows,
            'preview_row_count' => $previewRowCount,
            'max_column_count' => $maxColumnCount,
            'truncated_rows' => $truncatedRows,
            'truncated_columns' => $truncatedColumns,
        ];
    }

    private function extractCellValue(SimpleXMLElement $cellNode, array $sharedStrings): string
    {
        $type = (string) ($cellNode['t'] ?? '');

        if (isset($cellNode->is->t)) {
            return $this->sanitizeCellValue((string) $cellNode->is->t);
        }

        if ($type === 's') {
            $sharedIndex = (int) ($cellNode->v ?? 0);

            return $this->sanitizeCellValue($sharedStrings[$sharedIndex] ?? '');
        }

        if ($type === 'b') {
            return ((string) ($cellNode->v ?? '0')) === '1' ? 'TRUE' : 'FALSE';
        }

        if ($type === 'str') {
            return $this->sanitizeCellValue((string) ($cellNode->v ?? ''));
        }

        if (isset($cellNode->f) && ! isset($cellNode->v)) {
            return '[formula]';
        }

        return $this->sanitizeCellValue((string) ($cellNode->v ?? ''));
    }

    private function readSharedStrings(string $path): array
    {
        $content = $this->readZipEntry($path, 'xl/sharedStrings.xml', false);

        if ($content === null || trim($content) === '') {
            return [];
        }

        $xml = simplexml_load_string($content);

        if (! $xml instanceof SimpleXMLElement) {
            return [];
        }

        $strings = [];

        foreach ($xml->si as $sharedString) {
            if (isset($sharedString->t)) {
                $strings[] = (string) $sharedString->t;
                continue;
            }

            $parts = [];

            foreach ($sharedString->r as $run) {
                $parts[] = (string) ($run->t ?? '');
            }

            $strings[] = implode('', $parts);
        }

        return $strings;
    }

    private function readRelationships(string $path): array
    {
        $relationshipsXml = $this->loadXmlEntry($path, 'xl/_rels/workbook.xml.rels');
        $relationships = [];

        foreach ($relationshipsXml->Relationship as $relationship) {
            $attributes = $relationship->attributes();
            $id = (string) ($attributes['Id'] ?? '');
            $target = (string) ($attributes['Target'] ?? '');

            if ($id !== '' && $target !== '') {
                $relationships[$id] = $target;
            }
        }

        return $relationships;
    }

    private function loadXmlEntry(string $path, string $entryName): SimpleXMLElement
    {
        $content = $this->readZipEntry($path, $entryName);

        if (trim($content) === '') {
            throw new RuntimeException("Entry XML mancante nel file XLSX: {$entryName}");
        }

        $xml = simplexml_load_string($content);

        if (! $xml instanceof SimpleXMLElement) {
            throw new RuntimeException("Impossibile leggere il contenuto XML: {$entryName}");
        }

        return $xml;
    }

    private function readZipEntry(string $archivePath, string $entryName, bool $required = true): ?string
    {
        $command = sprintf(
            'unzip -p %s %s 2>/dev/null',
            escapeshellarg($archivePath),
            escapeshellarg($entryName)
        );

        $content = shell_exec($command);

        if (($content === null || $content === '') && ! $required) {
            return null;
        }

        if ($content === null || $content === '') {
            throw new RuntimeException("Impossibile leggere l'entry {$entryName} dal file XLSX.");
        }

        return $content;
    }

    private function columnIndexFromReference(string $reference): int
    {
        if (! preg_match('/([A-Z]+)/i', $reference, $matches)) {
            return 0;
        }

        $letters = strtoupper($matches[1]);
        $index = 0;

        for ($position = 0, $length = strlen($letters); $position < $length; $position++) {
            $index = ($index * 26) + (ord($letters[$position]) - 64);
        }

        return max(0, $index - 1);
    }

    private function sanitizeCellValue(string $value): string
    {
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
        $value = str_replace(["\r\n", "\r"], "\n", $value);
        $value = trim($value);

        if (mb_strlen($value) > self::MAX_CELL_LENGTH) {
            return mb_substr($value, 0, self::MAX_CELL_LENGTH).'…';
        }

        return $value;
    }
}
