<?php
namespace Tests\Feature;
use App\Models\{Facility,Medication,Minor,MinorStatus,StaffMember,StaffQualification};
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
class MinorMedicationApiTest extends TestCase
{
 use RefreshDatabase;
 public function test_plan_schedule_and_signed_administration_are_secure_and_immutable():void
 {
  $this->seed(DatabaseSeeder::class);$token=(string)$this->postJson('/api/auth/login',['email'=>'admin@familyhub.local','password'=>'password','device_name'=>'medication-test'])->assertOk()->json('access_token');$f=Facility::firstOrFail();$m=Minor::create(['facility_id'=>$f->id,'internal_code'=>'MIN-MED-001','first_name'=>'Anna','last_name'=>'Test','birth_date'=>'2012-01-01','entry_date'=>'2026-01-01','minor_status_id'=>MinorStatus::firstOrFail()->id]);$q=StaffQualification::where('code','PEDIATRA')->firstOrFail();$doctor=StaffMember::create(['facility_id'=>$f->id,'employee_code'=>'MED-TEST-001','first_name'=>'Paolo','last_name'=>'Medico','email'=>'medico@test.local','qualification_code'=>$q->code,'staff_qualification_id'=>$q->id,'status'=>'active']);
  $med=$this->withToken($token)->postJson('/api/admin/medications',['code'=>'TEST_MED','name'=>'Farmaco Test','active_ingredient'=>'Principio Test'])->assertCreated()->json();
  $o=$this->withToken($token)->getJson('/api/health/medications/options?facility_id='.$f->id)->assertOk()->json();
  $plan=$this->withToken($token)->postJson('/api/health/medication-plans',['minor_id'=>$m->id,'medication_id'=>$med['id'],'dose_quantity'=>5,'dosage_unit_id'=>$o['dosage_units'][0]['id'],'administration_route_id'=>$o['administration_routes'][0]['id'],'prescriber_staff_member_id'=>$doctor->id,'start_date'=>now()->toDateString(),'end_date'=>now()->addDays(10)->toDateString(),'instructions'=>'Dopo il pasto.'])->assertCreated()->json();
  $this->assertNotSame('Dopo il pasto.',(string)DB::table('minor_medication_plans')->where('id',$plan['id'])->value('instructions'));
  $this->withToken($token)->patchJson("/api/health/medication-plans/{$plan['id']}",['end_date'=>now()->addDays(20)->toDateString()])->assertOk()->assertJsonPath('end_date',now()->addDays(20)->toDateString().'T00:00:00.000000Z');
  $schedule=$this->withToken($token)->postJson("/api/health/medication-plans/{$plan['id']}/schedules",['time_of_day'=>'08:00','days_of_week'=>['MON','TUE','WED','THU','FRI','SAT','SUN']])->assertCreated()->json();
  $payload=['medication_schedule_id'=>$schedule['id'],'scheduled_for'=>now()->startOfHour()->toIso8601String(),'outcome_code'=>'ADMINISTERED','notes'=>'Somministrazione regolare.'];
  $this->withToken($token)->postJson("/api/health/medication-plans/{$plan['id']}/administrations",$payload)->assertCreated()->assertJsonPath('signature_type','authenticated_application_signature')->assertJsonPath('outcome.code','ADMINISTERED');
  $this->withToken($token)->postJson("/api/health/medication-plans/{$plan['id']}/administrations",$payload)->assertStatus(409);
  $this->withToken($token)->getJson('/api/health/medication-plans/alerts?facility_id='.$f->id.'&days=30')->assertOk()->assertJsonPath('0.alert_status','expiring');
  $this->assertDatabaseHas('audit_logs',['resource_type'=>'minor_medication_plan','action'=>'administration_signed']);
 }
}
