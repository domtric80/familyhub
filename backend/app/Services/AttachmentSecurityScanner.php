<?php

namespace App\Services;

use RuntimeException;

class AttachmentSecurityScanner
{
    public function scan(string $absolutePath): array
    {
        return match (config('document_security.scan.driver', 'fake-clean')) {
            'fake-clean' => [
                'status' => 'clean',
                'engine' => 'fake-clean',
                'signature' => null,
                'notes' => 'Scansione simulata pulita per ambiente locale/test.',
            ],
            'fake-infected' => [
                'status' => 'infected',
                'engine' => 'fake-infected',
                'signature' => 'Simulated.Test.Signature',
                'notes' => 'Scansione simulata infetta per test.',
            ],
            'clamav' => $this->scanWithClamAv($absolutePath),
            default => throw new RuntimeException('Driver antivirus non supportato.'),
        };
    }

    private function scanWithClamAv(string $absolutePath): array
    {
        $host = (string) config('document_security.scan.host', 'clamav');
        $port = (int) config('document_security.scan.port', 3310);
        $timeout = (int) config('document_security.scan.timeout', 20);

        $socket = @stream_socket_client(
            "tcp://{$host}:{$port}",
            $errorCode,
            $errorMessage,
            $timeout
        );

        if (! $socket) {
            throw new RuntimeException("Scanner ClamAV non raggiungibile: {$errorMessage}", $errorCode);
        }

        stream_set_timeout($socket, $timeout);
        fwrite($socket, "zINSTREAM\0");

        $handle = fopen($absolutePath, 'rb');

        if (! $handle) {
            fclose($socket);
            throw new RuntimeException('Impossibile aprire il file per la scansione.');
        }

        while (! feof($handle)) {
            $chunk = fread($handle, 8192);

            if ($chunk === false) {
                fclose($handle);
                fclose($socket);
                throw new RuntimeException('Errore durante la lettura del file da scansionare.');
            }

            $length = strlen($chunk);

            if ($length === 0) {
                continue;
            }

            fwrite($socket, pack('N', $length).$chunk);
        }

        fwrite($socket, pack('N', 0));
        fclose($handle);

        $response = stream_get_contents($socket) ?: '';
        fclose($socket);

        if (str_contains($response, 'FOUND')) {
            preg_match('/stream: (.+) FOUND/', $response, $matches);

            return [
                'status' => 'infected',
                'engine' => 'clamav',
                'signature' => $matches[1] ?? 'UNKNOWN',
                'notes' => trim($response),
            ];
        }

        if (str_contains($response, 'OK')) {
            return [
                'status' => 'clean',
                'engine' => 'clamav',
                'signature' => null,
                'notes' => trim($response),
            ];
        }

        throw new RuntimeException('Risposta scanner non riconosciuta: '.trim($response));
    }
}
