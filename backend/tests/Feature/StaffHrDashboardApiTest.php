<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\FacilityCertificationRequirement;
use App\Models\StaffCertificationType;
use App\Models\StaffMember;
use App\Models\StaffMemberCertification;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffHrDashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_aggregated_alerts_and_audits_read(): void
    {
        $this->seed(DatabaseSeeder::class);
        $token = (string) $this->postJson('/api/auth/login', ['email' => 'admin@familyhub.local', 'password' => 'password', 'device_name' => 'phpunit-hr-dashboard'])->assertOk()->json('access_token');
        $facility = Facility::query()->firstOrFail();
        $staff = StaffMember::query()->create(['facility_id' => $facility->id, 'employee_code' => 'HR-001', 'first_name' => 'Anna', 'last_name' => 'Rossi', 'qualification_code' => 'EDUCATORE', 'qualification' => 'Educatore', 'status_code' => 'ACTIVE', 'status' => 'active']);
        $type = StaffCertificationType::query()->where('code', 'FIRST_AID')->firstOrFail();
        FacilityCertificationRequirement::query()->create(['facility_id' => $facility->id, 'staff_certification_type_id' => $type->id, 'qualification_code' => 'EDUCATORE', 'is_required' => true]);
        StaffMemberCertification::query()->create(['staff_member_id' => $staff->id, 'staff_certification_type_id' => $type->id, 'expires_at' => now()->subDay(), 'status_code' => 'VALID']);

        $this->withToken($token)->getJson("/api/admin/staff-hr-dashboard?facility_id={$facility->id}")
            ->assertOk()
            ->assertJsonPath('kpis.staff_active', 1)
            ->assertJsonPath('kpis.total_staff', 1)
            ->assertJsonPath('kpis.certifications_expired', 1)
            ->assertJsonPath('kpis.certification_requirements_missing', 1)
            ->assertJsonPath('kpis.missing_requirements', 1)
            ->assertJsonPath('alerts.certifications.0.staff_member_id', $staff->id)
            ->assertJsonPath('alerts.certifications.0.certification_type_name', $type->name);

        $this->assertDatabaseHas('audit_logs', ['resource_type' => 'staff_hr_dashboard', 'action' => 'read']);
    }
}
