<?php

namespace Tests\Feature;

use App\Models\Attachment;
use App\Models\DocumentType;
use App\Models\Facility;
use App\Models\Minor;
use App\Models\MinorDocument;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class MinorDocumentClassificationApiTest extends TestCase
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
            'device_name' => 'phpunit-minor-document-classification',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_minor_document_upload_accepts_classification_code_and_returns_relational_fields(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-DOC-001',
            'first_name' => 'Luca',
            'last_name' => 'Blu',
            'birth_date' => '2012-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();

        $this->withToken($this->token)
            ->postJson("/api/minors/{$minor->id}/documents", [
                'document_type_id' => $documentType->id,
                'classification_code' => 'restricted',
                'file' => UploadedFile::fake()->create('test.pdf', 10, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('classification_code', 'restricted')
            ->assertJsonPath('classification_label', 'Riservato')
            ->assertJsonPath('document_classification.code', 'restricted')
            ->assertJsonMissingPath('classification');
    }

    public function test_minor_detail_exposes_relational_document_classification(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-DOC-002',
            'first_name' => 'Giulia',
            'last_name' => 'Verde',
            'birth_date' => '2011-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => Minor::class,
            'owner_id' => $minor->id,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => '',
            'path' => 'tests/minor-doc-class.txt',
            'original_name' => 'minor-doc-class.txt',
            'mime_type' => 'text/plain',
            'size_bytes' => 4,
            'sha256' => hash('sha256', 'test'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'uploaded_by_user_id' => 1,
        ]);

        MinorDocument::query()->create([
            'minor_id' => $minor->id,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'classification_code' => 'clinical',
            'classification' => 'clinical',
        ]);

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minor->id}")
            ->assertOk()
            ->assertJsonPath('documents.0.classification_code', 'clinical')
            ->assertJsonPath('documents.0.classification_label', 'Clinico')
            ->assertJsonPath('documents.0.document_classification.code', 'clinical')
            ->assertJsonMissingPath('documents.0.classification');
    }
}
