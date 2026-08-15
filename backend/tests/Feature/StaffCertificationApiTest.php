<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\StaffCertificationType;
use App\Models\StaffMember;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffCertificationApiTest extends TestCase
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
            'device_name' => 'phpunit-staff-certifications',
        ])->assertOk()->json('access_token');
    }

    public function test_certification_requirement_and_compliance_are_relational_and_audited(): void
    {
        $facility = Facility::query()->firstOrFail();
        $staffMember = $this->makeStaffMember($facility);
        $type = StaffCertificationType::query()->where('code', 'FIRST_AID')->firstOrFail();

        $requirement = $this->withToken($this->token)->postJson("/api/admin/facilities/{$facility->id}/certification-requirements", [
            'certification_type_id' => $type->id,
            'qualification_code' => 'EDUCATORE',
            'advance_notice_days' => 45,
        ])->assertCreated()->json();

        $this->withToken($this->token)->getJson("/api/admin/facilities/{$facility->id}/certification-compliance")
            ->assertOk()
            ->assertJsonPath('summary.non_compliant', 1)
            ->assertJsonPath('staff.0.requirements.0.validity_status', 'missing');

        $certification = $this->withToken($this->token)->postJson("/api/admin/staff-members/{$staffMember->id}/certifications", [
            'certification_type_id' => $type->id,
            'reference' => 'PS-2026-001',
            'issue_date' => '2026-01-01',
            'expiry_date' => '2027-01-01',
            'status_code' => 'VALID',
        ])->assertCreated()
            ->assertJsonPath('certification_type.code', 'FIRST_AID')
            ->assertJsonPath('certification_type_id', $type->id)
            ->assertJsonPath('reference', 'PS-2026-001')
            ->json();

        $this->withToken($this->token)->getJson("/api/admin/facilities/{$facility->id}/certification-compliance")
            ->assertOk()
            ->assertJsonPath('summary.compliant', 1)
            ->assertJsonPath('staff.0.requirements.0.certification_id', $certification['id'])
            ->assertJsonPath('rows.0.status', 'compliant')
            ->assertJsonPath('rows.0.expiry_date', '2027-01-01');

        $this->withToken($this->token)->deleteJson("/api/admin/facilities/{$facility->id}/certification-requirements/{$requirement['id']}")
            ->assertNoContent();

        $this->assertDatabaseHas('audit_logs', ['resource_type' => 'staff_member_certification', 'action' => 'create']);
        $this->assertDatabaseHas('audit_logs', ['resource_type' => 'facility_certification_requirement', 'action' => 'delete']);
    }

    private function makeStaffMember(Facility $facility): StaffMember
    {
        return StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'CERT-001',
            'first_name' => 'Elena',
            'last_name' => 'Blu',
            'email' => 'elena.blu@example.test',
            'qualification_code' => 'EDUCATORE',
            'qualification' => 'Educatore',
            'status_code' => 'ACTIVE',
            'status' => 'active',
        ]);
    }
}
