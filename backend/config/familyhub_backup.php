<?php

return [
    'directory' => env('FAMILYHUB_DB_BACKUP_DIR', dirname(base_path()).DIRECTORY_SEPARATOR.'backups'.DIRECTORY_SEPARATOR.'db'),
    'confirm_restore_text' => env('FAMILYHUB_DB_RESTORE_CONFIRM_TEXT', 'RIPRISTINA DATABASE'),
    'max_upload_kb' => (int) env('FAMILYHUB_DB_BACKUP_MAX_UPLOAD_KB', 512000),
];
