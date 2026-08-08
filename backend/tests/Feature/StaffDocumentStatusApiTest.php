<?php

namespace Tests\Feature;

use App\Models\Attachment;
use App\Models\DocumentType;
use App\Models\StaffDocument;
use App\Models\StaffMember;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffDocumentStatusApiTest extends TestCase
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
            'device_name' => 'phpunit-staff-document-statuses',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_lookup_staff_document_statuses_returns_active_lookup_values(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/lookups/staff-document-statuses')
            ->assertOk()
            ->assertJsonPath('0.code', 'VALID');
    }

    public function test_staff_member_detail_exposes_relational_status_for_staff_document(): void
    {
        $facility = \App\Models\Facility::query()->firstOrFail();
        $staffMember = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'DOC-STATUS-01',
            'first_name' => 'Paolo',
            'last_name' => 'Neri',
            'email' => 'paolo.neri@example.test',
            'qualification_code' => 'EDUCATORE',
            'qualification' => 'Educatore',
            'status_code' => 'ACTIVE',
            'status' => 'active',
        ]);
        $documentType = DocumentType::query()->firstOrFail();
        $attachment = Attachment::query()->create([
            'facility_id' => $staffMember->facility_id,
            'owner_type' => StaffMember::class,
            'owner_id' => $staffMember->id,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => '',
            'path' => 'tests/staff-doc-status.txt',
            'original_name' => 'staff-doc-status.txt',
            'mime_type' => 'text/plain',
            'size_bytes' => 4,
            'sha256' => hash('sha256', 'test'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'uploaded_by_user_id' => 1,
        ]);

        StaffDocument::query()->create([
            'staff_member_id' => $staffMember->id,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'status_code' => 'EXPIRED',
            'status' => 'expired',
        ]);

        $this->withToken($this->token)
            ->getJson("/api/admin/staff-members/{$staffMember->id}")
            ->assertOk()
            ->assertJsonPath('documents.0.status_code', 'EXPIRED')
            ->assertJsonPath('documents.0.status_lookup.code', 'EXPIRED')
            ->assertJsonPath('documents.0.status_label', 'Scaduto')
            ->assertJsonMissingPath('documents.0.status');
    }
}
