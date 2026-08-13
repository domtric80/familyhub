<?php

namespace Tests\Feature;

use App\Models\DocumentClassification;
use App\Models\Role;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleDocumentPolicyApiTest extends TestCase
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
            'device_name' => 'phpunit-role-document-policy',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_admin_can_read_role_document_policy(): void
    {
        $role = Role::query()->where('code', 'PEDIATRA')->firstOrFail();

        $this->withToken($this->token)
            ->getJson("/api/admin/roles/{$role->id}/document-policy")
            ->assertOk()
            ->assertJsonPath('role.code', 'PEDIATRA')
            ->assertJsonPath('rbac.attachments_read', true)
            ->assertJsonPath('summary.can_read_any_documents', true)
            ->assertJsonPath('meta.role_has_minor_assignment_bypass', false)
            ->assertJsonPath('meta.unknown_classification_policy.read', 'deny')
            ->assertJsonPath('summary.minor_assignment_rule', 'active_minor_assignment_required');
    }

    public function test_admin_can_update_role_document_policy_by_role(): void
    {
        $role = Role::query()->where('code', 'ASSISTENTE_SOCIALE_EST')->firstOrFail();

        $response = $this->withToken($this->token)
            ->putJson("/api/admin/roles/{$role->id}/document-policy", [
                'classification_codes' => ['internal', 'restricted'],
                'download_classification_codes' => ['restricted'],
            ])
            ->assertOk()
            ->assertJsonPath('role.code', 'ASSISTENTE_SOCIALE_EST');

        $assigned = collect($response->json('classifications'))
            ->filter(fn (array $item): bool => (bool) $item['assigned_to_role'])
            ->pluck('code')
            ->values()
            ->all();

        $downloadAssigned = collect($response->json('classifications'))
            ->filter(fn (array $item): bool => (bool) $item['download_assigned_to_role'])
            ->pluck('code')
            ->values()
            ->all();

        $this->assertSame(['internal', 'restricted'], $assigned);
        $this->assertSame(['restricted'], $downloadAssigned);

        $restrictedResponse = collect($response->json('classifications'))->firstWhere('code', 'restricted');
        $this->assertNotNull($restrictedResponse);
        $this->assertFalse((bool) $restrictedResponse['role_has_minor_assignment_bypass']);
        $this->assertTrue((bool) $restrictedResponse['requires_minor_assignment']);
        $this->assertSame('active_minor_assignment_required', $restrictedResponse['assignment_rule']);

        $internal = DocumentClassification::query()->where('code', 'internal')->firstOrFail();
        $restricted = DocumentClassification::query()->where('code', 'restricted')->firstOrFail();
        $clinical = DocumentClassification::query()->where('code', 'clinical')->firstOrFail();

        $this->assertContains('ASSISTENTE_SOCIALE_EST', $internal->allowed_role_codes ?? []);
        $this->assertContains('ASSISTENTE_SOCIALE_EST', $restricted->allowed_role_codes ?? []);
        $this->assertNotContains('ASSISTENTE_SOCIALE_EST', $internal->allowed_download_role_codes ?? []);
        $this->assertContains('ASSISTENTE_SOCIALE_EST', $restricted->allowed_download_role_codes ?? []);
        $this->assertNotContains('ASSISTENTE_SOCIALE_EST', $clinical->allowed_role_codes ?? []);
    }
}
