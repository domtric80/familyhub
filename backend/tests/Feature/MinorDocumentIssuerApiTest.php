<?php

namespace Tests\Feature;

use App\Models\Attachment;
use App\Models\DocumentIssuer;
use App\Models\DocumentType;
use App\Models\Facility;
use App\Models\Minor;
use App\Models\MinorDocument;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class MinorDocumentIssuerApiTest extends TestCase
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
            'device_name' => 'phpunit-minor-document-issuer',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_lookup_document_issuers_returns_active_values(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/lookups/document-issuers')
            ->assertOk()
            ->assertJsonPath('0.code', 'COMUNE');
    }

    public function test_minor_document_upload_accepts_document_issuer_id_and_returns_relational_fields(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-ISSUER-001',
            'first_name' => 'Sara',
            'last_name' => 'Gialli',
            'birth_date' => '2012-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $issuer = DocumentIssuer::query()->where('code', 'COMUNE')->firstOrFail();

        $this->withToken($this->token)
            ->postJson("/api/minors/{$minor->id}/documents", [
                'document_type_id' => $documentType->id,
                'document_issuer_id' => $issuer->id,
                'classification_code' => 'restricted',
                'file' => UploadedFile::fake()->create('test.pdf', 10, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('document_issuer_id', $issuer->id)
            ->assertJsonPath('issued_by', 'Comune')
            ->assertJsonPath('issuer_label', 'Comune')
            ->assertJsonPath('document_issuer.code', 'COMUNE');
    }

    public function test_minor_detail_exposes_relational_document_issuer(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-ISSUER-002',
            'first_name' => 'Elena',
            'last_name' => 'Viola',
            'birth_date' => '2011-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $issuer = DocumentIssuer::query()->where('code', 'TRIBUNALE')->firstOrFail();
        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => Minor::class,
            'owner_id' => $minor->id,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => '',
            'path' => 'tests/minor-doc-issuer.txt',
            'original_name' => 'minor-doc-issuer.txt',
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
            'document_issuer_id' => $issuer->id,
            'issued_by' => $issuer->name,
            'classification_code' => 'restricted',
            'classification' => 'restricted',
        ]);

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minor->id}")
            ->assertOk()
            ->assertJsonPath('documents.0.document_issuer_id', $issuer->id)
            ->assertJsonPath('documents.0.issuer_label', 'Tribunale per i minorenni')
            ->assertJsonPath('documents.0.document_issuer.code', 'TRIBUNALE');
    }
}
