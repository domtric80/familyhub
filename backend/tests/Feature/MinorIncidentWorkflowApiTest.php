<?php

namespace Tests\Feature;

use App\Models\DocumentIssuer;
use App\Models\Facility;
use App\Models\IncidentType;
use App\Models\Minor;
use App\Models\MinorUserAssignment;
use App\Models\MinorStatus;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MinorIncidentWorkflowApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_incident_escalation_is_encrypted_scoped_and_audited(): void
    {
        $this->seed(DatabaseSeeder::class);
        $token = (string) $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'phpunit-incidents',
        ])->assertOk()->json('access_token');
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-INC-001',
            'first_name' => 'Marta',
            'last_name' => 'Rossi',
            'birth_date' => '2011-04-12',
            'entry_date' => '2026-01-01',
            'minor_status_id' => MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = IncidentType::query()->where('code', 'CRISIS')->firstOrFail();
        $issuer = DocumentIssuer::query()->where('is_active', true)->firstOrFail();
        $description = 'Crisi comportamentale durante il rientro in struttura.';

        $this->withToken($token)->getJson('/api/incidents/options')
            ->assertOk()
            ->assertJsonPath('incident_types.0.is_active', true);

        $incident = $this->withToken($token)->postJson('/api/incidents', [
            'minor_id' => $minor->id,
            'incident_type_id' => $type->id,
            'severity_code' => 'RED',
            'occurred_at' => now()->subHour()->toIso8601String(),
            'location' => 'Ingresso struttura',
            'description' => $description,
            'immediate_actions' => 'Applicato protocollo di de-escalation.',
            'requires_external_notification' => true,
        ])->assertCreated()
            ->assertJsonPath('status_code', 'REPORTED')
            ->assertJsonPath('severity_code', 'RED')
            ->assertJsonPath('allowed_transitions.0', 'COORDINATOR_REVIEWED')
            ->json();

        $rawDescription = (string) DB::table('minor_incidents')->where('id', $incident['id'])->value('description');
        $this->assertNotSame($description, $rawDescription);

        $this->withToken($token)->postJson("/api/incidents/{$incident['id']}/transition", ['to_status_code' => 'DIRECTOR_REVIEWED'])
            ->assertStatus(409);
        $this->withToken($token)->postJson("/api/incidents/{$incident['id']}/transition", ['to_status_code' => 'COORDINATOR_REVIEWED', 'notes' => 'Verifica coordinatore completata.'])
            ->assertOk()->assertJsonPath('status_code', 'COORDINATOR_REVIEWED');
        $this->withToken($token)->patchJson("/api/incidents/{$incident['id']}", ['description' => 'Tentativo di modifica tardiva.'])
            ->assertStatus(409);
        $this->withToken($token)->postJson("/api/incidents/{$incident['id']}/transition", ['to_status_code' => 'DIRECTOR_REVIEWED'])
            ->assertOk()->assertJsonPath('status_code', 'DIRECTOR_REVIEWED');

        $this->withToken($token)->postJson("/api/incidents/{$incident['id']}/transition", ['to_status_code' => 'EXTERNAL_NOTIFIED'])
            ->assertStatus(409);
        $this->withToken($token)->getJson("/api/incidents/{$incident['id']}/authority-report?document_issuer_id={$issuer->id}")
            ->assertOk()
            ->assertJsonPath('automatic_delivery', false)
            ->assertJsonPath('minor.internal_code', 'MIN-INC-001');
        $this->withToken($token)->postJson("/api/incidents/{$incident['id']}/external-notifications", [
            'document_issuer_id' => $issuer->id,
            'notified_at' => now()->toIso8601String(),
            'reference' => 'PROT-INC-2026-001',
            'notes' => 'Comunicazione registrata dal direttore.',
        ])->assertCreated();
        $this->withToken($token)->putJson("/api/incidents/{$incident['id']}/analysis", [
            'root_cause' => 'Sovraccarico ambientale durante la transizione.',
            'corrective_measures' => 'Riduzione stimoli e aggiornamento protocollo di rientro.',
            'due_date' => now()->addWeek()->toDateString(),
        ])->assertOk();

        $this->withToken($token)->postJson("/api/incidents/{$incident['id']}/transition", ['to_status_code' => 'EXTERNAL_NOTIFIED'])
            ->assertOk()->assertJsonPath('status_code', 'EXTERNAL_NOTIFIED');
        $this->withToken($token)->postJson("/api/incidents/{$incident['id']}/transition", ['to_status_code' => 'CLOSED'])
            ->assertOk()->assertJsonPath('status_code', 'CLOSED')->assertJsonPath('allowed_transitions', []);

        $this->assertDatabaseHas('audit_logs', ['resource_type' => 'minor_incident', 'action' => 'transition']);
        $this->assertDatabaseHas('minor_history_entries', ['minor_id' => $minor->id, 'event_type' => 'minor_incident_external_notification']);
        $this->assertDatabaseCount('minor_incident_transitions', 5);
    }

    public function test_used_incident_type_cannot_be_deleted(): void
    {
        $this->seed(DatabaseSeeder::class);
        $token = (string) $this->postJson('/api/auth/login', ['email' => 'admin@familyhub.local', 'password' => 'password', 'device_name' => 'phpunit-incident-types'])->assertOk()->json('access_token');
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create(['facility_id' => $facility->id, 'internal_code' => 'MIN-INC-002', 'first_name' => 'Test', 'last_name' => 'Tipo', 'birth_date' => '2010-01-01', 'entry_date' => '2026-01-01', 'minor_status_id' => MinorStatus::query()->firstOrFail()->id]);
        $type = IncidentType::query()->where('code', 'FALL')->firstOrFail();
        $this->withToken($token)->postJson('/api/incidents', ['minor_id' => $minor->id, 'incident_type_id' => $type->id, 'severity_code' => 'GREEN', 'occurred_at' => now()->toIso8601String(), 'description' => 'Caduta senza conseguenze.'])->assertCreated();
        $this->withToken($token)->deleteJson("/api/admin/incident-types/{$type->id}")->assertStatus(409);
    }

    public function test_educator_can_report_but_cannot_approve_escalation(): void
    {
        $this->seed(DatabaseSeeder::class);
        $facility = Facility::query()->firstOrFail();
        $admin = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $minor = Minor::query()->create(['facility_id' => $facility->id, 'internal_code' => 'MIN-INC-003', 'first_name' => 'Test', 'last_name' => 'Educatore', 'birth_date' => '2010-01-01', 'entry_date' => '2026-01-01', 'minor_status_id' => MinorStatus::query()->firstOrFail()->id]);
        $educator = User::query()->create(['uuid' => (string) str()->uuid(), 'email' => 'incident.educator@familyhub.local', 'password' => Hash::make('password'), 'first_name' => 'Edu', 'last_name' => 'Incident', 'is_active' => true, 'mfa_required' => false, 'email_verified_at' => now()]);
        UserFacilityRole::query()->create(['user_id' => $educator->id, 'facility_id' => $facility->id, 'role_id' => Role::query()->where('code', 'EDUCATORE')->firstOrFail()->id, 'valid_from' => now(), 'is_active' => true, 'assigned_by_user_id' => $admin->id]);
        MinorUserAssignment::query()->create(['minor_id' => $minor->id, 'user_id' => $educator->id, 'facility_id' => $facility->id, 'valid_from' => now()->toDateString(), 'is_active' => true, 'assigned_by_user_id' => $admin->id]);
        Sanctum::actingAs($educator, ['*']);

        $incident = $this->postJson('/api/incidents', ['minor_id' => $minor->id, 'incident_type_id' => IncidentType::query()->where('code', 'FALL')->firstOrFail()->id, 'severity_code' => 'GREEN', 'occurred_at' => now()->toIso8601String(), 'description' => 'Caduta segnalata dall’educatore.'])
            ->assertCreated()->assertJsonPath('allowed_transitions', [])->json();
        $this->postJson("/api/incidents/{$incident['id']}/transition", ['to_status_code' => 'COORDINATOR_REVIEWED'])->assertStatus(409);
    }
}
