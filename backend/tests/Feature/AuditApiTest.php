<?php

namespace Tests\Feature;

use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\DocumentType;
use App\Models\Facility;
use App\Models\StaffDocument;
use App\Models\StaffMember;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AuditApiTest extends TestCase
{
    use RefreshDatabase;

    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'audit-test',
        ])->assertOk();

        $this->token = $login->json('access_token');
    }

    public function test_audit_logs_index_show_and_filters_work(): void
    {
        $facility = Facility::query()->firstOrFail();
        $documentType = DocumentType::query()->firstOrFail();

        $audit = AuditLog::query()->create([
            'facility_id' => $facility->id,
            'actor_display_name' => 'System Admin',
            'action' => 'read',
            'resource_type' => 'minor_document_preview',
            'resource_id' => '10',
            'resource_label' => 'doc.pdf',
            'operation_summary' => 'System Admin ha visualizzato il documento doc.pdf.',
            'occurred_at_utc' => now()->utc(),
        ]);

        $this->withToken($this->token)
            ->getJson('/api/admin/audit-logs?resource_type=minor_document_preview')
            ->assertOk()
            ->assertJsonPath('data.0.id', $audit->id);

        $this->withToken($this->token)
            ->getJson("/api/admin/audit-logs/{$audit->id}")
            ->assertOk()
            ->assertJsonPath('id', $audit->id);

        $this->withToken($this->token)
            ->getJson('/api/admin/audit-logs/filters')
            ->assertOk()
            ->assertJsonStructure([
                'actions',
                'resource_types',
                'presets',
            ]);
    }

    public function test_audit_kpis_and_csv_export_work(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/admin/audit-logs/kpis')
            ->assertOk()
            ->assertJsonStructure([
                'summary' => [
                    'login_failures',
                    'document_access_events',
                    'permission_change_events',
                    'minor_read_events',
                    'total_events',
                ],
                'top_actors',
                'resource_breakdown',
            ]);

        $response = $this->withToken($this->token)
            ->get('/api/admin/audit-logs/export.csv');

        $response->assertOk();
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));
    }

    public function test_staff_document_preview_and_download_are_audited(): void
    {
        Storage::fake('local');

        $facility = Facility::query()->firstOrFail();
        $documentType = DocumentType::query()->firstOrFail();

        $staffMember = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'EMP-001',
            'first_name' => 'Giulia',
            'last_name' => 'Neri',
            'email' => 'giulia.neri@example.test',
            'status' => 'active',
        ]);

        Storage::disk('local')->put('tests/staff-doc.txt', 'test');

        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => StaffMember::class,
            'owner_id' => $staffMember->id,
            'document_type_id' => $documentType->id,
            'disk' => 'local',
            'bucket' => '',
            'path' => 'tests/staff-doc.txt',
            'original_name' => 'staff-doc.txt',
            'mime_type' => 'text/plain',
            'size_bytes' => 4,
            'sha256' => hash('sha256', 'test'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'uploaded_by_user_id' => 1,
        ]);

        $document = StaffDocument::query()->create([
            'staff_member_id' => $staffMember->id,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'status' => 'valid',
        ]);

        $this->withToken($this->token)
            ->get("/api/admin/staff-members/{$staffMember->id}/documents/{$document->id}/preview")
            ->assertOk();

        $this->withToken($this->token)
            ->get("/api/admin/staff-members/{$staffMember->id}/documents/{$document->id}/download")
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'resource_type' => 'staff_document_preview',
            'resource_id' => (string) $document->id,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'resource_type' => 'staff_document_download',
            'resource_id' => (string) $document->id,
        ]);
    }
}
