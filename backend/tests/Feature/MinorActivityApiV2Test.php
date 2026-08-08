<?php

namespace Tests\Feature;

use App\Models\ActivityType;
use App\Models\Facility;
use App\Models\Minor;
use App\Models\MinorActivity;
use App\Models\MinorPei;
use App\Models\MinorPeiObjective;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MinorActivityApiV2Test extends TestCase
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
            'device_name' => 'phpunit-minor-activities-v2',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_can_create_activity_with_operational_fields(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-ACT-001',
            'first_name' => 'Luca',
            'last_name' => 'Rosa',
            'birth_date' => '2012-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = ActivityType::query()->where('code', 'LAB')->firstOrFail();

        $response = $this->withToken($this->token)
            ->postJson('/api/activities', [
                'minor_id' => $minor->id,
                'activity_type_id' => $type->id,
                'title' => 'Laboratorio manuale',
                'planned_start_at' => '2026-07-03 10:00:00',
                'status' => 'planned',
                'attendance_status' => 'present',
                'support_level' => 'medium',
                'requires_transport' => false,
                'follow_up_required' => true,
                'follow_up_notes' => 'Riprendere il progetto venerdì.',
            ])
            ->assertCreated()
            ->assertJsonPath('attendance_status', 'present')
            ->assertJsonPath('support_level', 'medium')
            ->assertJsonPath('follow_up_required', true);

        $this->assertNotNull($response->json('id'));
    }

    public function test_can_return_activity_summary(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-ACT-002',
            'first_name' => 'Mia',
            'last_name' => 'Verdi',
            'birth_date' => '2011-02-02',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = ActivityType::query()->where('code', 'LAB')->firstOrFail();

        MinorActivity::query()->create([
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'activity_type_id' => $type->id,
            'title' => 'Laboratorio cucina',
            'planned_start_at' => '2026-07-04 09:00:00',
            'status' => 'completed',
            'attendance_status' => 'partial',
            'requires_transport' => true,
            'follow_up_required' => true,
            'follow_up_notes' => 'Riprendere la settimana prossima.',
        ]);

        $this->withToken($this->token)
            ->getJson('/api/activities/summary?minor_id='.$minor->id)
            ->assertOk()
            ->assertJsonPath('summary.total', 1)
            ->assertJsonPath('summary.completed', 1)
            ->assertJsonPath('summary.transport_required', 1)
            ->assertJsonPath('attendance_breakdown.0.attendance_status', 'partial');
    }

    public function test_can_link_activity_to_pei_objective_and_generate_progress_log(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-ACT-PEI-001',
            'first_name' => 'Sara',
            'last_name' => 'Blu',
            'birth_date' => '2012-03-03',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = ActivityType::query()->where('code', 'LAB')->firstOrFail();
        $pei = MinorPei::query()->create([
            'minor_id' => $minor->id,
            'title' => 'PEI area autonomie',
            'status' => 'active',
        ]);
        $objective = MinorPeiObjective::query()->create([
            'minor_pei_id' => $pei->id,
            'code' => 'OBJ-ACT-001',
            'title' => 'Migliorare autonomia in laboratorio',
            'status' => 'in_progress',
            'progress_percent' => 40,
        ]);

        $response = $this->withToken($this->token)
            ->postJson('/api/activities', [
                'minor_id' => $minor->id,
                'activity_type_id' => $type->id,
                'title' => 'Laboratorio PEI',
                'planned_start_at' => '2026-07-03 10:00:00',
                'status' => 'completed',
                'pei_objective_id' => $objective->id,
            ])
            ->assertCreated()
            ->assertJsonPath('pei_objective_id', $objective->id)
            ->assertJsonPath('pei_objective.id', $objective->id);

        $objective->refresh();

        $this->assertDatabaseHas('minor_pei_objective_progress_logs', [
            'minor_pei_objective_id' => $objective->id,
            'source_type' => 'minor_activity',
            'source_id' => (string) $response->json('id'),
            'source_label' => 'Laboratorio PEI',
        ]);
    }
}
