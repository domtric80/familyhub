<?php
namespace Tests\Feature;
use App\Models\Facility;
use App\Models\StaffMember;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class StaffShiftEligibilityApiTest extends TestCase
{
    use RefreshDatabase;
    public function test_shift_eligibility_is_advisory_and_audited(): void
    {
        $this->seed(DatabaseSeeder::class); $token=(string)$this->postJson('/api/auth/login',['email'=>'admin@familyhub.local','password'=>'password','device_name'=>'phpunit-eligibility'])->assertOk()->json('access_token');
        $facility=Facility::query()->firstOrFail(); StaffMember::query()->create(['facility_id'=>$facility->id,'employee_code'=>'ELIG-001','first_name'=>'Nora','last_name'=>'Blu','status_code'=>'ACTIVE','status'=>'active']);
        $this->withToken($token)->getJson("/api/admin/facilities/{$facility->id}/shift-eligibility")->assertOk()->assertJsonPath('enforcement','advisory')->assertJsonPath('rows.0.can_assign',true);
        $this->assertDatabaseHas('audit_logs',['resource_type'=>'staff_shift_eligibility','action'=>'read']);
    }
}
