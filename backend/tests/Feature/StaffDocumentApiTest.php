<?php

namespace Tests\Feature;

use App\Models\DocumentType;
use App\Models\StaffMember;
use Carbon\Carbon;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StaffDocumentApiTest extends TestCase
{
    use RefreshDatabase;

    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->token = (string) $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'phpunit-staff-documents',
        ])->assertOk()->json('access_token');
    }

    public function test_staff_document_upload_is_quarantined_and_audited(): void
    {
        Storage::fake('s3');
        Queue::fake();
        config(['filesystems.default' => 's3', 'document_security.scan.driver' => 'fake-clean']);

        $staffMember = $this->makeStaffMember();
        $documentType = DocumentType::query()->firstOrFail();

        $response = $this->withToken($this->token)->post("/api/admin/staff-members/{$staffMember->id}/documents", [
            'document_type_id' => $documentType->id,
            'issue_date' => '2026-08-01',
            'expiry_date' => '2027-08-01',
            'file' => UploadedFile::fake()->create('idoneita.pdf', 32, 'application/pdf'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('status_code', 'VALID')
            ->assertJsonPath('attachment.security_status', 'pending')
            ->assertJsonPath('expiry_status', 'valid');

        $this->assertDatabaseHas('audit_logs', [
            'resource_type' => 'staff_document',
            'action' => 'create',
        ]);
    }

    public function test_staff_document_metadata_can_be_updated_and_soft_deleted(): void
    {
        Carbon::setTestNow('2026-08-15');
        Storage::fake('s3');
        Queue::fake();
        config(['filesystems.default' => 's3']);

        $staffMember = $this->makeStaffMember();
        $documentType = DocumentType::query()->firstOrFail();
        $documentId = $this->withToken($this->token)->post("/api/admin/staff-members/{$staffMember->id}/documents", [
            'document_type_id' => $documentType->id,
            'expiry_date' => '2026-08-20',
            'file' => UploadedFile::fake()->create('attestato.pdf', 32, 'application/pdf'),
        ])->assertCreated()->json('id');

        $this->withToken($this->token)->putJson("/api/admin/staff-members/{$staffMember->id}/documents/{$documentId}", [
            'expiry_date' => '2026-12-31',
            'status_code' => 'PENDING_RENEWAL',
        ])->assertOk()
            ->assertJsonPath('status_code', 'PENDING_RENEWAL')
            ->assertJsonPath('expiry_status', 'valid');

        $this->withToken($this->token)->deleteJson("/api/admin/staff-members/{$staffMember->id}/documents/{$documentId}")
            ->assertOk();

        $this->assertSoftDeleted('staff_documents', ['id' => $documentId]);
    }

    public function test_expiry_summary_separates_expired_and_expiring_documents(): void
    {
        Carbon::setTestNow('2026-08-15');
        Storage::fake('s3');
        Queue::fake();
        config(['filesystems.default' => 's3']);

        $staffMember = $this->makeStaffMember();
        $documentType = DocumentType::query()->firstOrFail();
        foreach (['2026-08-10', '2026-08-25', '2026-12-31'] as $date) {
            $this->withToken($this->token)->post("/api/admin/staff-members/{$staffMember->id}/documents", [
                'document_type_id' => $documentType->id,
                'expiry_date' => $date,
                'file' => UploadedFile::fake()->create("document-{$date}.pdf", 32, 'application/pdf'),
            ])->assertCreated();
        }

        $this->withToken($this->token)->getJson('/api/admin/staff-documents/expiry-summary?alert_days=30')
            ->assertOk()
            ->assertJsonPath('summary.expired', 1)
            ->assertJsonPath('summary.expiring', 1)
            ->assertJsonPath('summary.valid', 1);
    }

    private function makeStaffMember(): StaffMember
    {
        $facility = \App\Models\Facility::query()->firstOrFail();

        return StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-DOC-'.StaffMember::query()->count(),
            'first_name' => 'Chiara',
            'last_name' => 'Rossi',
            'email' => 'chiara.rossi'.StaffMember::query()->count().'@example.test',
            'status_code' => 'ACTIVE',
            'status' => 'active',
        ]);
    }
}
