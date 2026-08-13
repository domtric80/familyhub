<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class CoordinatorDocumentPolicyAdminApiTest extends TestCase
{
    use RefreshDatabase;

    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);

        $facility = \App\Models\Facility::query()->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $coordinatorRole = Role::query()->where('code', 'COORDINATORE')->firstOrFail();

        $coordinatorUser = User::query()->create([
            'uuid' => (string) Str::uuid(),
            'email' => 'qa.coordinator.docpolicy@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Qa',
            'last_name' => 'DocPolicy',
            'is_active' => true,
            'mfa_required' => false,
            'email_verified_at' => now(),
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $coordinatorUser->id,
            'facility_id' => $facility->id,
            'role_id' => $coordinatorRole->id,
            'valid_from' => now()->toDateString(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'qa.coordinator.docpolicy@familyhub.local',
            'password' => 'password',
            'device_name' => 'phpunit-coordinator-document-policy',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_coordinator_can_read_document_access_matrix(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/admin/document-access-matrix')
            ->assertOk()
            ->assertJsonPath('meta.model', 'rbac_plus_abac');

        $coordinator = collect($response->json('roles'))->firstWhere('code', 'COORDINATORE');

        $this->assertNotNull($coordinator);
        $this->assertTrue((bool) $coordinator['role_has_minor_assignment_bypass']);
        $this->assertSame('bypass_for_privileged_role', $coordinator['summary']['minor_assignment_rule']);
    }

    public function test_coordinator_can_update_role_document_policy(): void
    {
        $role = Role::query()->where('code', 'COORDINATORE')->firstOrFail();

        $response = $this->withToken($this->token)
            ->putJson("/api/admin/roles/{$role->id}/document-policy", [
                'classification_codes' => ['internal', 'restricted', 'clinical'],
                'download_classification_codes' => ['internal', 'restricted'],
            ])
            ->assertOk()
            ->assertJsonPath('role.code', 'COORDINATORE');

        $assigned = collect($response->json('classifications'))
            ->filter(fn (array $item): bool => (bool) $item['assigned_to_role'])
            ->pluck('code')
            ->values()
            ->all();

        $this->assertContains('clinical', $assigned);
        $clinical = collect($response->json('classifications'))->firstWhere('code', 'clinical');
        $this->assertTrue((bool) $response->json('meta.role_has_minor_assignment_bypass'));
        $this->assertFalse((bool) ($clinical['requires_minor_assignment'] ?? true));
        $this->assertSame('assignment_not_required_for_privileged_role', $clinical['assignment_rule']);
        $this->assertFalse((bool) ($clinical['download_assigned_to_role'] ?? true));
    }

    public function test_coordinator_can_create_new_document_classification_tag(): void
    {
        $this->withToken($this->token)
            ->postJson('/api/admin/document-classifications', [
                'code' => 'school_sensitive',
                'name' => 'Scolastico sensibile',
                'description' => 'Documenti scolastici con sensibilita elevata ma non clinica.',
                'allowed_role_codes' => ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE'],
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('code', 'school_sensitive')
            ->assertJsonPath('allowed_roles.2', 'COORDINATORE');
    }
}
