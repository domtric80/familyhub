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
            ->assertJsonPath('meta.document_rbac_permissions.download', 'attachments.download')
            ->assertJsonPath('meta.minor_assignment_required_for_sensitive_minor_documents', true)
            ->assertJsonPath('meta.privileged_role_codes.0', 'SUPER_ADMIN')
            ->assertJsonPath('meta.unknown_classification_policy.read', 'deny');

        $roles = collect($response->json('roles'));

        $coordinator = $roles->firstWhere('code', 'COORDINATORE');
        $educator = $roles->firstWhere('code', 'EDUCATORE');
        $psychologist = $roles->firstWhere('code', 'PSICOLOGO');
        $pediatrician = $roles->firstWhere('code', 'PEDIATRA');

        $this->assertNotNull($coordinator);
        $this->assertNotNull($educator);
        $this->assertNotNull($psychologist);
        $this->assertNotNull($pediatrician);

        $coordinatorClinical = collect($coordinator['document_access'])->firstWhere('classification_code', 'clinical');
        $coordinatorRestricted = collect($coordinator['document_access'])->firstWhere('classification_code', 'restricted');
        $educatorClinical = collect($educator['document_access'])->firstWhere('classification_code', 'clinical');
        $educatorInternal = collect($educator['document_access'])->firstWhere('classification_code', 'internal');
        $psychologistClinical = collect($psychologist['document_access'])->firstWhere('classification_code', 'clinical');
        $pediatricianClinical = collect($pediatrician['document_access'])->firstWhere('classification_code', 'clinical');

        $this->assertNotNull($coordinatorRestricted);
        $this->assertNotNull($coordinatorClinical);
        $this->assertNotNull($educatorClinical);
        $this->assertNotNull($educatorInternal);
        $this->assertNotNull($psychologistClinical);
        $this->assertNotNull($pediatricianClinical);

        $this->assertTrue((bool) $coordinator['role_has_minor_assignment_bypass']);
        $this->assertTrue((bool) $coordinator['rbac']['attachments_read']);
        $this->assertTrue((bool) $coordinator['rbac']['attachments_download']);
        $this->assertTrue((bool) $coordinatorRestricted['allowed_by_classification']);
        $this->assertTrue((bool) $coordinatorRestricted['role_has_minor_assignment_bypass']);
        $this->assertFalse((bool) $coordinatorRestricted['requires_minor_assignment']);
        $this->assertTrue((bool) $coordinatorRestricted['effective_read_access']);
        $this->assertTrue((bool) $coordinatorRestricted['effective_download_access']);
        $this->assertSame('assignment_not_required_for_privileged_role', $coordinatorRestricted['assignment_rule']);
        $this->assertSame('allowed_without_minor_assignment', $coordinatorRestricted['effective_read_rule']);
        $this->assertSame('allowed_without_minor_assignment', $coordinatorRestricted['effective_download_rule']);
        $this->assertFalse((bool) $coordinatorClinical['allowed_by_classification']);
        $this->assertFalse((bool) $coordinatorClinical['effective_read_access']);
        $this->assertFalse((bool) $coordinatorClinical['effective_download_access']);
        $this->assertSame('bypass_for_privileged_role', $coordinator['summary']['minor_assignment_rule']);

        $this->assertFalse((bool) $educator['role_has_minor_assignment_bypass']);
        $this->assertTrue((bool) $educator['rbac']['attachments_read']);
        $this->assertFalse((bool) $educator['rbac']['attachments_download']);
        $this->assertTrue((bool) $educatorInternal['effective_read_access']);
        $this->assertFalse((bool) $educatorInternal['effective_download_access']);
        $this->assertTrue((bool) $educatorInternal['requires_minor_assignment']);
        $this->assertSame('active_minor_assignment_required', $educatorInternal['assignment_rule']);
        $this->assertFalse((bool) $educatorClinical['allowed_by_classification']);
        $this->assertFalse((bool) $educatorClinical['effective_read_access']);

        $this->assertTrue((bool) $psychologist['rbac']['attachments_read']);
        $this->assertTrue((bool) $psychologist['rbac']['attachments_download']);
        $this->assertFalse((bool) $psychologist['role_has_minor_assignment_bypass']);
        $this->assertTrue((bool) $psychologistClinical['allowed_by_classification']);
        $this->assertTrue((bool) $psychologistClinical['effective_read_access']);
        $this->assertTrue((bool) $psychologistClinical['effective_download_access']);
        $this->assertSame('allowed_if_minor_assignment_active', $psychologistClinical['effective_read_rule']);
        $this->assertSame('allowed_if_minor_assignment_active', $psychologistClinical['effective_download_rule']);

        $this->assertTrue((bool) $pediatrician['rbac']['attachments_read']);
        $this->assertTrue((bool) $pediatrician['rbac']['attachments_download']);
        $this->assertFalse((bool) $pediatrician['role_has_minor_assignment_bypass']);
        $this->assertTrue((bool) $pediatricianClinical['allowed_by_classification']);
        $this->assertTrue((bool) $pediatricianClinical['effective_read_access']);
        $this->assertTrue((bool) $pediatricianClinical['effective_download_access']);
        $this->assertSame('allowed_if_minor_assignment_active', $pediatricianClinical['effective_read_rule']);
    }
}
