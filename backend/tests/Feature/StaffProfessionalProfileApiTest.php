<?php

namespace Tests\Feature;

use App\Models\StaffLanguage;
use App\Models\StaffMember;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffProfessionalProfileApiTest extends TestCase
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
            'device_name' => 'phpunit-staff-professional-profile',
        ])->assertOk()->json('access_token');
    }

    public function test_lookup_crud_preserves_unspecified_values_and_prevents_deletion_when_in_use(): void
    {
        $skill = $this->withToken($this->token)->postJson('/api/admin/staff-profile-lookups/skills', [
            'code' => 'GESTIONE_CRISI',
            'name' => 'Gestione delle crisi',
            'description' => 'Intervento educativo in situazione di crisi.',
            'sort_order' => 25,
        ])->assertCreated()->json();

        $this->withToken($this->token)->putJson("/api/admin/staff-profile-lookups/skills/{$skill['id']}", [
            'code' => 'GESTIONE_CRISI',
            'name' => 'Gestione crisi e de-escalation',
        ])->assertOk()
            ->assertJsonPath('sort_order', 25)
            ->assertJsonPath('is_active', true);

        $staffMember = $this->makeStaffMember();
        $language = StaffLanguage::query()->where('code', 'EN')->firstOrFail();

        $this->withToken($this->token)->putJson("/api/admin/staff-members/{$staffMember->id}/professional-profile", [
            'skills' => [[
                'id' => $skill['id'],
                'proficiency_level_code' => 'ADVANCED',
                'acquired_at' => '2025-01-15',
                'notes' => 'Formazione completata.',
            ]],
            'languages' => [[
                'id' => $language->id,
                'proficiency_level_code' => 'INTERMEDIATE',
            ]],
            'specializations' => [],
        ])->assertOk()
            ->assertJsonPath('skills.0.code', 'GESTIONE_CRISI')
            ->assertJsonPath('skills.0.proficiency_level_label', 'Avanzato')
            ->assertJsonPath('languages.0.code', 'EN');

        $this->withToken($this->token)->deleteJson("/api/admin/staff-profile-lookups/skills/{$skill['id']}")
            ->assertStatus(409);

        $this->assertDatabaseHas('audit_logs', [
            'resource_type' => 'staff_member_professional_profile',
            'resource_id' => (string) $staffMember->id,
        ]);
    }

    public function test_profile_sync_can_clear_a_single_relation_without_touching_others(): void
    {
        $skillId = $this->withToken($this->token)->postJson('/api/admin/staff-profile-lookups/skills', [
            'code' => 'COMUNICAZIONE',
            'name' => 'Comunicazione educativa',
        ])->assertCreated()->json('id');
        $staffMember = $this->makeStaffMember();

        $this->withToken($this->token)->putJson("/api/admin/staff-members/{$staffMember->id}/professional-profile", [
            'skills' => [['skill_id' => $skillId, 'proficiency_level_code' => 'BASIC']],
        ])->assertOk()->assertJsonCount(1, 'skills');

        $this->withToken($this->token)->putJson("/api/admin/staff-members/{$staffMember->id}/professional-profile", [
            'skills' => [],
        ])->assertOk()->assertJsonCount(0, 'skills');
    }

    private function makeStaffMember(): StaffMember
    {
        $facility = \App\Models\Facility::query()->firstOrFail();
        $count = StaffMember::query()->count();

        return StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'PROFILE-'.($count + 1),
            'first_name' => 'Marta',
            'last_name' => 'Verdi',
            'email' => 'marta.verdi'.($count + 1).'@example.test',
            'status_code' => 'ACTIVE',
            'status' => 'active',
        ]);
    }
}
