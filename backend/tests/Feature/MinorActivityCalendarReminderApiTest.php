<?php

namespace Tests\Feature;

use App\Models\ActivityType;
use App\Models\Facility;
use App\Models\Minor;
use App\Models\MinorActivity;
use App\Models\MinorStatus;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MinorActivityCalendarReminderApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_calendar_and_personal_reminder_flow_are_scoped_and_audited(): void
    {
        $this->seed(DatabaseSeeder::class);
        $token = (string) $this->postJson('/api/auth/login', ['email' => 'admin@familyhub.local', 'password' => 'password', 'device_name' => 'phpunit-activity-calendar'])->assertOk()->json('access_token');
        $user = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create(['facility_id' => $facility->id, 'internal_code' => 'MIN-CAL-001', 'first_name' => 'Elisa', 'last_name' => 'Verdi', 'birth_date' => '2012-01-01', 'entry_date' => '2026-01-01', 'minor_status_id' => MinorStatus::query()->firstOrFail()->id]);
        $activity = MinorActivity::query()->create(['facility_id' => $facility->id, 'minor_id' => $minor->id, 'activity_type_id' => ActivityType::query()->firstOrFail()->id, 'title' => 'Laboratorio calendario', 'planned_start_at' => '2026-09-10 10:00:00', 'status' => 'planned', 'attendance_status' => 'present', 'requires_transport' => false, 'follow_up_required' => false]);

        $this->withToken($token)->getJson('/api/activities/calendar?date_from=2026-09-01&date_to=2026-09-30')->assertOk()->assertJsonPath('0.id', $activity->id);
        $reminder = $this->withToken($token)->postJson("/api/activities/{$activity->id}/reminders", ['recipient_user_id' => $user->id, 'remind_at' => '2026-09-09 10:00:00'])->assertCreated()->json();
        $this->withToken($token)->getJson('/api/activities/reminders/mine')->assertOk()->assertJsonPath('0.id', $reminder['id']);
        $this->withToken($token)->postJson("/api/activities/{$activity->id}/reminders/{$reminder['id']}/acknowledge")->assertOk()->assertJsonPath('already_acknowledged', false);
        $this->withToken($token)->postJson("/api/activities/{$activity->id}/reminders/{$reminder['id']}/acknowledge")->assertOk()->assertJsonPath('already_acknowledged', true);
        $this->withToken($token)->deleteJson("/api/activities/{$activity->id}/reminders/{$reminder['id']}")->assertStatus(409);
        $this->assertDatabaseHas('audit_logs', ['resource_type' => 'minor_activity_reminder', 'action' => 'acknowledge']);
    }
}
