<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DatabaseBackupRestoreRequest;
use App\Services\AuditLogService;
use App\Services\DatabaseBackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DatabaseBackupController extends Controller
{
    public function __construct(
        private readonly DatabaseBackupService $databaseBackupService = new DatabaseBackupService(),
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'items' => $this->databaseBackupService->listBackups(),
            'restore_confirm_text' => (string) config('familyhub_backup.confirm_restore_text'),
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $backup = $this->databaseBackupService->createBackup((string) $request->input('label', 'manual-export'));

        $this->auditLogService->record($request, [
            'actor_user' => $request->user(),
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($request->user()),
            'action' => 'create',
            'resource_type' => 'database_backups',
            'resource_label' => $backup['filename'],
            'operation_summary' => sprintf('%s ha creato un export del database (%s).', $this->auditLogService->resolveActorDisplayName($request->user()), $backup['filename']),
            'new_values_json' => $backup,
        ]);

        return response()->json($backup, 201);
    }

    public function download(Request $request): BinaryFileResponse
    {
        $filename = (string) $request->query('filename', '');
        $path = $this->databaseBackupService->getBackupPath($filename);

        $this->auditLogService->record($request, [
            'actor_user' => $request->user(),
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($request->user()),
            'action' => 'read',
            'resource_type' => 'database_backups',
            'resource_label' => $filename,
            'operation_summary' => sprintf('%s ha scaricato un backup database (%s).', $this->auditLogService->resolveActorDisplayName($request->user()), $filename),
        ]);

        return response()->download($path, $filename, [
            'Content-Type' => 'application/sql',
        ]);
    }

    public function restore(DatabaseBackupRestoreRequest $request): JsonResponse
    {
        $result = $request->hasFile('sql_file')
            ? $this->databaseBackupService->restoreFromUploadedFile(
                $request->file('sql_file'),
                (bool) $request->boolean('create_pre_restore_backup', true)
            )
            : $this->databaseBackupService->restoreFromExistingBackup(
                (string) $request->input('backup_filename'),
                (bool) $request->boolean('create_pre_restore_backup', true)
            );

        $this->auditLogService->record($request, [
            'actor_user' => $request->user(),
            'facility_id' => $this->auditLogService->resolveFacilityIdForUser($request->user()),
            'action' => 'update',
            'resource_type' => 'database_backups',
            'resource_label' => $result['source']['filename'] ?? 'restore',
            'operation_summary' => sprintf('%s ha eseguito un import/restore database da %s.', $this->auditLogService->resolveActorDisplayName($request->user()), $result['source']['filename'] ?? 'file SQL'),
            'new_values_json' => $result,
        ]);

        return response()->json($result);
    }
}
