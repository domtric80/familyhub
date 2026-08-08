<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentTypeApiTest extends TestCase
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
            'device_name' => 'phpunit-document-types',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_admin_can_create_document_type_with_document_scope_code(): void
    {
        $this->withToken($this->token)
            ->postJson('/api/admin/document-types', [
                'code' => 'COURT_NOTE',
                'name' => 'Nota giudiziaria',
                'document_scope_code' => 'minor',
            ])
            ->assertCreated()
            ->assertJsonPath('code', 'COURT_NOTE')
            ->assertJsonPath('document_scope_code', 'minor')
            ->assertJsonPath('document_scope.code', 'minor')
            ->assertJsonMissingPath('scope');
    }

    public function test_lookup_document_types_exposes_document_scope_code_not_legacy_scope(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/lookups/document-types')
            ->assertOk()
            ->assertJsonPath('0.document_scope_code', 'minor')
            ->assertJsonMissingPath('0.scope');
    }
}
