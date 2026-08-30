<?php

namespace Tests\Feature;

use App\Models\DocumentClassification;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentClassificationPolicyApiTest extends TestCase
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
            'device_name' => 'phpunit-document-classification-policy',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_admin_can_create_classification_with_read_and_download_roles(): void
    {
        $this->withToken($this->token)
            ->postJson('/api/admin/document-classifications', [
                'code' => 'school_report',
                'name' => 'Scolastico',
                'description' => 'Documenti scolastici.',
                'allowed_role_codes' => ['SUPER_ADMIN', 'COORDINATORE', 'EDUCATORE'],
                'allowed_download_role_codes' => ['SUPER_ADMIN', 'COORDINATORE'],
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('code', 'school_report')
            ->assertJsonPath('allowed_role_codes.2', 'EDUCATORE')
            ->assertJsonPath('allowed_download_role_codes.1', 'COORDINATORE')
            ->assertJsonPath('allowed_download_roles.1', 'COORDINATORE');

        $classification = DocumentClassification::query()->where('code', 'school_report')->firstOrFail();

        $this->assertSame(['SUPER_ADMIN', 'COORDINATORE', 'EDUCATORE'], $classification->allowed_role_codes);
        $this->assertSame(['SUPER_ADMIN', 'COORDINATORE'], $classification->allowed_download_role_codes);
    }

    public function test_download_roles_are_never_broader_than_read_roles(): void
    {
        $this->withToken($this->token)
            ->postJson('/api/admin/document-classifications', [
                'code' => 'external_note',
                'name' => 'Nota esterna',
                'allowed_role_codes' => ['SUPER_ADMIN'],
                'allowed_download_role_codes' => ['SUPER_ADMIN', 'EDUCATORE'],
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('allowed_role_codes.0', 'SUPER_ADMIN')
            ->assertJsonPath('allowed_download_role_codes.0', 'SUPER_ADMIN')
            ->assertJsonMissingPath('allowed_download_role_codes.1');

        $classification = DocumentClassification::query()->where('code', 'external_note')->firstOrFail();

        $this->assertSame(['SUPER_ADMIN'], $classification->allowed_download_role_codes);
    }
}
