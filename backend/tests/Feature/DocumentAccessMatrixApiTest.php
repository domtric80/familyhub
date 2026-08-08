<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentAccessMatrixApiTest extends TestCase
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
            'device_name' => 'phpunit-document-access-matrix',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_admin_can_read_document_access_matrix(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/admin/document-access-matrix')
            ->assertOk()
            ->assertJsonPath('meta.model', 'rbac_plus_abac')
            ->assertJsonPath('meta.document_rbac_permissions.read', 'attachments.read')
            ->assertJsonPath('meta.minor_assignment_required_for_sensitive_minor_documents', true);

        $roles = collect($response->json('roles'));

        $coordinator = $roles->firstWhere('code', 'COORDINATORE');
        $educator = $roles->firstWhere('code', 'EDUCATORE');
        $psychologist = $roles->firstWhere('code', 'PSICOLOGO');
        $pediatrician = $roles->firstWhere('code', 'PEDIATRA');

        $this->assertNotNull($coordinator);
        $this->assertNotNull($educator);
        $this->assertNotNull($psychologist);
        $this->assertNotNull($pediatrician);

        $coordinatorRestricted = collect($coordinator['document_access'])->firstWhere('classification_code', 'restricted');
        $coordinatorClinical = collect($coordinator['document_access'])->firstWhere('classification_code', 'clinical');
        $educatorClinical = collect($educator['document_access'])->firstWhere('classification_code', 'clinical');
        $psychologistClinical = collect($psychologist['document_access'])->firstWhere('classification_code', 'clinical');
        $pediatricianClinical = collect($pediatrician['document_access'])->firstWhere('classification_code', 'clinical');

        $this->assertNotNull($coordinatorRestricted);
        $this->assertNotNull($coordinatorClinical);
        $this->assertNotNull($educatorClinical);
        $this->assertNotNull($psychologistClinical);
        $this->assertNotNull($pediatricianClinical);

        $this->assertTrue((bool) $coordinator['rbac']['attachments_read']);
        $this->assertTrue((bool) $coordinatorRestricted['allowed_by_classification']);
        $this->assertTrue((bool) $coordinatorRestricted['effective_read_access']);
        $this->assertFalse((bool) $coordinatorClinical['allowed_by_classification']);
        $this->assertFalse((bool) $coordinatorClinical['effective_read_access']);

        $this->assertTrue((bool) $educator['rbac']['attachments_read']);
        $this->assertFalse((bool) $educatorClinical['allowed_by_classification']);
        $this->assertFalse((bool) $educatorClinical['effective_read_access']);

        $this->assertTrue((bool) $psychologist['rbac']['attachments_read']);
        $this->assertTrue((bool) $psychologistClinical['allowed_by_classification']);
        $this->assertTrue((bool) $psychologistClinical['effective_read_access']);
        $this->assertSame('allowed_if_minor_assignment_active', $psychologistClinical['effective_read_rule']);

        $this->assertTrue((bool) $pediatrician['rbac']['attachments_read']);
        $this->assertTrue((bool) $pediatricianClinical['allowed_by_classification']);
        $this->assertTrue((bool) $pediatricianClinical['effective_read_access']);
        $this->assertSame('allowed_if_minor_assignment_active', $pediatricianClinical['effective_read_rule']);
    }
}
