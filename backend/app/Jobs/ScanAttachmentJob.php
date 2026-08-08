<?php

namespace App\Jobs;

use App\Models\Attachment;
use App\Models\Minor;
use App\Services\AttachmentSecurityScanner;
use App\Services\MinorHistoryService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ScanAttachmentJob implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly int $attachmentId)
    {
    }

    public function handle(AttachmentSecurityScanner $scanner, MinorHistoryService $historyService): void
    {
        $attachment = Attachment::query()->find($this->attachmentId);

        if (! $attachment || $attachment->security_status !== 'pending') {
            return;
        }

        $disk = Storage::disk($attachment->disk);
        $tmpPath = tempnam(sys_get_temp_dir(), 'fh-scan-');

        if (! $tmpPath) {
            throw new RuntimeException('Impossibile creare file temporaneo per la scansione.');
        }

        file_put_contents($tmpPath, $disk->get($attachment->path));

        try {
            $result = $scanner->scan($tmpPath);

            if (($result['status'] ?? null) === 'clean') {
                $releasedPath = $this->buildReleasedPath($attachment->path);

                if ($releasedPath !== $attachment->path) {
                    $disk->move($attachment->path, $releasedPath);
                }

                $attachment->forceFill([
                    'path' => $releasedPath,
                    'security_status' => 'clean',
                    'security_notes' => $result['notes'] ?? null,
                    'scanned_at' => now(),
                    'released_at' => now(),
                    'scanner_engine' => $result['engine'] ?? null,
                    'scanner_signature' => null,
                ])->save();

                $this->recordMinorHistory($attachment, $historyService, 'minor_document_scan_clean');

                return;
            }

            $attachment->forceFill([
                'security_status' => 'infected',
                'security_notes' => $result['notes'] ?? null,
                'scanned_at' => now(),
                'quarantined_at' => now(),
                'scanner_engine' => $result['engine'] ?? null,
                'scanner_signature' => $result['signature'] ?? null,
            ])->save();

            $this->recordMinorHistory($attachment, $historyService, 'minor_document_scan_infected');
        } catch (\Throwable $throwable) {
            $attachment->forceFill([
                'security_status' => config('document_security.scan.fail_closed', true) ? 'rejected' : 'pending',
                'security_notes' => $throwable->getMessage(),
                'scanned_at' => now(),
                'quarantined_at' => now(),
                'scanner_engine' => config('document_security.scan.driver'),
            ])->save();

            $this->recordMinorHistory($attachment, $historyService, 'minor_document_scan_failed');

            Log::warning('Attachment scan failed', [
                'attachment_id' => $attachment->id,
                'message' => $throwable->getMessage(),
            ]);
        } finally {
            @unlink($tmpPath);
        }
    }

    private function buildReleasedPath(string $currentPath): string
    {
        $quarantinePrefix = trim((string) config('document_security.quarantine_prefix', 'quarantine'), '/');
        $releasedPrefix = trim((string) config('document_security.released_prefix', 'released'), '/');

        if (str_starts_with($currentPath, $quarantinePrefix.'/')) {
            return $releasedPrefix.'/'.substr($currentPath, strlen($quarantinePrefix) + 1);
        }

        return $currentPath;
    }

    private function recordMinorHistory(Attachment $attachment, MinorHistoryService $historyService, string $eventType): void
    {
        if ($attachment->owner_type !== Minor::class) {
            return;
        }

        $minor = Minor::query()->find($attachment->owner_id);

        if (! $minor) {
            return;
        }

        $historyService->record($minor, $eventType, null, [
            'attachment_id' => $attachment->id,
            'security_status' => $attachment->security_status,
            'scanner_engine' => $attachment->scanner_engine,
            'scanner_signature' => $attachment->scanner_signature,
        ]);
    }
}
