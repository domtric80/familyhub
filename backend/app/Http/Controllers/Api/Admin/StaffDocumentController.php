<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStaffDocumentRequest;
use App\Http\Requests\Admin\UpdateStaffDocumentRequest;
use App\Jobs\ScanAttachmentJob;
use App\Models\Attachment;
use App\Models\StaffDocument;
use App\Models\StaffMember;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class StaffDocumentController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService = new AuditLogService())
    {
    }

    public function index(StaffMember $staffMember): JsonResponse
    {
        return response()->json(
            $staffMember->documents()
                ->with(['documentType', 'statusLookup', 'attachment'])
                ->latest('id')
                ->get()
                ->each->append(['expiry_status', 'days_until_expiry'])
        );
    }

    public function store(StoreStaffDocumentRequest $request, StaffMember $staffMember): JsonResponse
    {
        $file = $request->file('file');
        $mimeType = $file->getClientMimeType() ?: 'application/octet-stream';
        $this->assertDocumentUploadSecurity($mimeType, (int) $file->getSize());

        $disk = config('filesystems.default', 's3');
        $bucket = (string) config("filesystems.disks.{$disk}.bucket", '');
        $extension = $file->getClientOriginalExtension();
        $path = sprintf(
            '%s/staff-members/%d/documents/%s%s',
            trim((string) config('document_security.quarantine_prefix', 'quarantine'), '/'),
            $staffMember->id,
            (string) Str::uuid(),
            $extension ? '.'.$extension : ''
        );
        $sha256 = hash_file('sha256', $file->getRealPath());

        $document = DB::transaction(function () use ($request, $staffMember, $file, $mimeType, $disk, $bucket, $path, $sha256) {
            Storage::disk($disk)->put($path, file_get_contents($file->getRealPath()));

            $attachment = Attachment::query()->create([
                'facility_id' => $staffMember->facility_id,
                'owner_type' => StaffMember::class,
                'owner_id' => $staffMember->id,
                'document_type_id' => $request->integer('document_type_id'),
                'disk' => $disk,
                'bucket' => $bucket,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $mimeType,
                'size_bytes' => $file->getSize(),
                'sha256' => $sha256,
                'is_encrypted' => true,
                'security_status' => 'pending',
                'quarantined_at' => now(),
                'uploaded_by_user_id' => $request->user()?->id,
            ]);

            return StaffDocument::query()->create([
                'staff_member_id' => $staffMember->id,
                'document_type_id' => $request->integer('document_type_id'),
                'attachment_id' => $attachment->id,
                'issue_date' => $request->input('issue_date'),
                'expiry_date' => $request->input('expiry_date'),
                'status_code' => $request->input('status_code'),
                'status' => strtolower((string) $request->input('status_code')),
            ]);
        });

        $this->recordAudit($request, $staffMember, $document, 'create', 'ha caricato il documento');
        ScanAttachmentJob::dispatch($document->attachment_id);

        return response()->json($this->loadDocument($document), 201);
    }

    public function show(StaffMember $staffMember, StaffDocument $document): JsonResponse
    {
        $this->assertBelongsToStaffMember($staffMember, $document);

        return response()->json($this->loadDocument($document));
    }

    public function update(UpdateStaffDocumentRequest $request, StaffMember $staffMember, StaffDocument $document): JsonResponse
    {
        $this->assertBelongsToStaffMember($staffMember, $document);
        $before = $this->auditSnapshot($document);
        $document->update($request->validated());
        $document = $this->loadDocument($document);

        $this->recordAudit($request, $staffMember, $document, 'update', 'ha aggiornato i metadati del documento', $before);

        return response()->json($document);
    }

    public function destroy(Request $request, StaffMember $staffMember, StaffDocument $document): JsonResponse
    {
        $this->assertBelongsToStaffMember($staffMember, $document);
        $before = $this->auditSnapshot($document);
        $document->delete();

        $this->recordAudit($request, $staffMember, $document, 'delete', 'ha archiviato logicamente il documento', $before);

        return response()->json([
            'message' => 'Documento archiviato. Il file resta conservato per audit e retention.',
        ]);
    }

    public function expirySummary(Request $request): JsonResponse
    {
        $days = (int) config('staff_documents.expiry_alert_days', 30);
        $query = StaffDocument::query()
            ->with(['staffMember.facility', 'documentType', 'statusLookup', 'attachment'])
            ->whereNotNull('expiry_date');

        if ($request->filled('facility_id')) {
            $query->whereHas('staffMember', fn ($builder) => $builder->where('facility_id', $request->integer('facility_id')));
        }

        $documents = $query->orderBy('expiry_date')->get()->each->append(['expiry_status', 'days_until_expiry']);

        return response()->json([
            'alert_days' => $days,
            'summary' => [
                'expired' => $documents->where('expiry_status', 'expired')->count(),
                'expiring' => $documents->filter(fn (StaffDocument $document) => $document->days_until_expiry !== null && $document->days_until_expiry >= 0 && $document->days_until_expiry <= $days)->count(),
                'valid' => $documents->filter(fn (StaffDocument $document) => $document->days_until_expiry !== null && $document->days_until_expiry > $days)->count(),
            ],
            'documents' => $documents->values(),
        ]);
    }

    private function loadDocument(StaffDocument $document): StaffDocument
    {
        return $document->fresh(['documentType', 'statusLookup', 'attachment'])
            ->append(['expiry_status', 'days_until_expiry']);
    }

    private function assertBelongsToStaffMember(StaffMember $staffMember, StaffDocument $document): void
    {
        abort_unless($document->staff_member_id === $staffMember->id, 404);
    }

    private function assertDocumentUploadSecurity(string $mimeType, int $sizeBytes): void
    {
        $allowedMimeTypes = config('document_security.allowed_mime_types', []);
        $maxSizeBytes = (int) config('document_security.max_upload_size_bytes', 0);

        if ($allowedMimeTypes !== [] && ! in_array($mimeType, $allowedMimeTypes, true)) {
            throw new HttpException(422, 'Mime type del documento non consentito.');
        }

        if ($maxSizeBytes > 0 && $sizeBytes > $maxSizeBytes) {
            throw new HttpException(422, 'Dimensione del documento superiore al limite consentito.');
        }
    }

    private function auditSnapshot(StaffDocument $document): array
    {
        return [
            'document_type_id' => $document->document_type_id,
            'issue_date' => optional($document->issue_date)->toDateString(),
            'expiry_date' => optional($document->expiry_date)->toDateString(),
            'status_code' => $document->status_code,
            'attachment_id' => $document->attachment_id,
        ];
    }

    private function recordAudit(Request $request, StaffMember $staffMember, StaffDocument $document, string $action, string $verb, ?array $oldValues = null): void
    {
        $document->loadMissing(['documentType', 'attachment']);
        $documentName = $document->attachment?->original_name ?: ($document->documentType?->name ?: 'documento senza nome');

        $this->auditLogService->record($request, [
            'facility_id' => $staffMember->facility_id,
            'action' => $action,
            'resource_type' => 'staff_document',
            'resource_id' => (string) $document->id,
            'resource_label' => $documentName,
            'operation_summary' => sprintf(
                '%s %s %s dell\'educatore %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $verb,
                $documentName,
                $staffMember->first_name,
                $staffMember->last_name,
                $staffMember->employee_code
            ),
            'old_values_json' => $oldValues,
            'new_values_json' => $this->auditSnapshot($document),
        ]);
        $this->auditLogService->markHandled($request);
    }
}
