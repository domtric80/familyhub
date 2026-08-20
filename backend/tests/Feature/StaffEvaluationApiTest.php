<?php
namespace Tests\Feature;

use App\Models\Facility;
use App\Models\StaffMember;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffEvaluationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_user_can_finalize_an_immutable_encrypted_evaluation(): void
    {
        $this->seed(DatabaseSeeder::class);
        $token = (string) $this->postJson('/api/auth/login', ['email' => 'admin@familyhub.local', 'password' => 'password', 'device_name' => 'phpunit-staff-evaluation'])->assertOk()->json('access_token');
        $facility = Facility::query()->firstOrFail();
        $staff = StaffMember::query()->create(['facility_id' => $facility->id, 'employee_code' => 'EVAL-001', 'first_name' => 'Lara', 'last_name' => 'Rossi', 'status_code' => 'ACTIVE', 'status' => 'active']);
        $criteria = $this->withToken($token)->getJson('/api/admin/staff-evaluation-criteria')->assertOk()->json();

        $evaluation = $this->withToken($token)->postJson("/api/admin/staff-members/{$staff->id}/evaluations", ['period_start' => '2026-01-01', 'period_end' => '2026-03-31', 'evaluation_date' => '2026-04-01', 'summary' => 'Nota HR riservata.', 'scores' => [['criterion_id' => $criteria[0]['id'], 'score' => 4, 'notes' => 'Osservazione riservata.']]])
            ->assertCreated()->assertJsonPath('status', 'DRAFT')->assertJsonPath('overall_score', 4)->json();

        $this->assertDatabaseMissing('staff_evaluations', ['summary' => 'Nota HR riservata.']);
        $this->withToken($token)->postJson("/api/admin/staff-members/{$staff->id}/evaluations/{$evaluation['id']}/finalize")->assertOk()->assertJsonPath('status', 'FINALIZED');
        $this->withToken($token)->putJson("/api/admin/staff-members/{$staff->id}/evaluations/{$evaluation['id']}", ['period_start' => '2026-01-01', 'period_end' => '2026-03-31', 'evaluation_date' => '2026-04-01', 'scores' => [['criterion_id' => $criteria[0]['id'], 'score' => 5]]])->assertStatus(409);
        $this->assertDatabaseHas('audit_logs', ['resource_type' => 'staff_evaluation', 'action' => 'finalize']);
    }
}
