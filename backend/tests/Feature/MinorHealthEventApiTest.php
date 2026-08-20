<?php

namespace Tests\Feature;

use App\Models\{Facility, Minor, MinorHealthEventCategory, MinorHealthEventStatus, MinorStatus};
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MinorHealthEventApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_event_is_scoped_encrypted_validated_and_audited(): void
    {
        $this->seed(DatabaseSeeder::class);
        $token=(string)$this->postJson('/api/auth/login',['email'=>'admin@familyhub.local','password'=>'password','device_name'=>'health-event-test'])->assertOk()->json('access_token');
        $facility=Facility::firstOrFail();
        $minor=Minor::create(['facility_id'=>$facility->id,'internal_code'=>'MIN-HEALTH-001','first_name'=>'Sara','last_name'=>'Test','birth_date'=>'2013-01-01','entry_date'=>'2026-01-01','minor_status_id'=>MinorStatus::firstOrFail()->id]);
        $options=$this->withToken($token)->getJson('/api/health/events/options?facility_id='.$facility->id)->assertOk()->assertJsonCount(6,'categories')->json();
        $category=MinorHealthEventCategory::where('code','SPECIALIST_VISIT')->firstOrFail();
        $scheduled=MinorHealthEventStatus::where('code','SCHEDULED')->firstOrFail();
        $completed=MinorHealthEventStatus::where('code','COMPLETED')->firstOrFail();
        $scheduledAt=now()->addDays(5)->startOfHour();
        $event=$this->withToken($token)->postJson('/api/health/events',['minor_id'=>$minor->id,'category_id'=>$category->id,'status_id'=>$scheduled->id,'scheduled_at'=>$scheduledAt->toIso8601String(),'reason'=>'Controllo specialistico riservato.','follow_up_at'=>now()->addDays(20)->toIso8601String()])->assertCreated()->assertJsonPath('category.code','SPECIALIST_VISIT')->json();
        $this->assertNotSame('Controllo specialistico riservato.',(string)DB::table('minor_health_events')->where('id',$event['id'])->value('reason'));
        $this->withToken($token)->patchJson('/api/health/events/'.$event['id'],['status_id'=>$completed->id])->assertStatus(422);
        $this->withToken($token)->patchJson('/api/health/events/'.$event['id'],['status_id'=>$completed->id,'occurred_at'=>now()->toIso8601String(),'clinical_findings'=>'Esito clinico protetto.'])->assertOk()->assertJsonPath('status.code','COMPLETED');
        $this->assertNotSame('Esito clinico protetto.',(string)DB::table('minor_health_events')->where('id',$event['id'])->value('clinical_findings'));
        $this->withToken($token)->getJson('/api/health/events?minor_id='.$minor->id)->assertOk()->assertJsonCount(1);
        $this->withToken($token)->getJson('/api/health/events/alerts?facility_id='.$facility->id.'&days=30')->assertOk()->assertJsonCount(1);
        $this->assertDatabaseHas('audit_logs',['resource_type'=>'minor_health_event','action'=>'update']);
        $this->assertNotEmpty($options['statuses']);
    }
}
