<?php

return [
    'max_upload_size_bytes' => (int) env('DOCUMENT_MAX_UPLOAD_SIZE_BYTES', 10 * 1024 * 1024),
    'allowed_mime_types' => array_values(array_filter(array_map(
        static fn (string $value): string => trim($value),
        explode(',', (string) env('DOCUMENT_ALLOWED_MIME_TYPES', 'application/pdf,image/jpeg,image/png,image/webp,video/mp4,application/msword,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
    ))),
    'quarantine_prefix' => trim((string) env('DOCUMENT_QUARANTINE_PREFIX', 'quarantine'), '/'),
    'released_prefix' => trim((string) env('DOCUMENT_RELEASED_PREFIX', 'released'), '/'),
    'scan' => [
        'driver' => env('ANTIVIRUS_DRIVER', 'fake-clean'),
        'fail_closed' => filter_var(env('ANTIVIRUS_FAIL_CLOSED', true), FILTER_VALIDATE_BOOL),
        'host' => env('ANTIVIRUS_HOST', 'clamav'),
        'port' => (int) env('ANTIVIRUS_PORT', 3310),
        'timeout' => (int) env('ANTIVIRUS_TIMEOUT_SECONDS', 20),
    ],
];
