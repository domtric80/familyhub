<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\JournalEntryType;
use App\Models\Minor;
use App\Models\MinorJournalEntry;
use App\Models\MinorPei;
use App\Models\MinorPeiObjective;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MinorJournalApiTest extends TestCase
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
            'device_name' => 'phpunit-minor-journal',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_can_create_and_list_minor_journal_entry(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-JRN-001',
            'first_name' => 'Giulia',
            'last_name' => 'Neri',
            'birth_date' => '2012-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);

        $type = JournalEntryType::query()->where('code', 'OBSERVATION')->firstOrFail();

        $createResponse = $this->withToken($this->token)
            ->postJson('/api/journals', [
                'minor_id' => $minor->id,
                'journal_entry_type_id' => $type->id,
                'observed_at' => '2026-07-02 15:30:00',
                'title' => 'Osservazione pomeridiana',
                'content' => 'Il minore ha partecipato con attenzione alle attività programmate.',
                'priority_level' => 'yellow',
                'mood_level' => 'positive',
                'nutrition_summary' => 'Pranzo completo.',
                'hygiene_summary' => 'Igiene autonoma con supporto minimo.',
                'sleep_summary' => 'Riposo breve nel pomeriggio.',
                'follow_up_required' => true,
                'follow_up_notes' => 'Verificare continuità domani.',
                'handover_required' => true,
                'handover_notes' => 'Segnalare al turno notte umore positivo.',
            ])
            ->assertCreated()
            ->assertJsonPath('minor_id', $minor->id)
            ->assertJsonPath('journal_entry_type.code', 'OBSERVATION')
            ->assertJsonPath('priority_level', 'yellow')
            ->assertJsonPath('mood_level', 'positive');

        $entryId = $createResponse->json('id');

        $this->withToken($this->token)
            ->getJson('/api/journals?minor_id='.$minor->id.'&priority_level=yellow')
            ->assertOk()
            ->assertJsonFragment(['id' => $entryId]);
    }

    public function test_can_return_journal_summary(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-JRN-002',
            'first_name' => 'Marco',
            'last_name' => 'Blu',
            'birth_date' => '2011-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = JournalEntryType::query()->where('code', 'OBSERVATION')->firstOrFail();

        MinorJournalEntry::query()->create([
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'journal_entry_type_id' => $type->id,
            'observed_at' => '2026-07-02 12:00:00',
            'title' => 'Voce critica',
            'content' => 'Serve attenzione.',
            'priority_level' => 'red',
            'mood_level' => 'negative',
            'follow_up_required' => true,
            'follow_up_notes' => 'Controllo entro sera.',
            'handover_required' => true,
            'handover_notes' => 'Passare informazione al turno successivo.',
        ]);

        $this->withToken($this->token)
            ->getJson('/api/journals/summary?minor_id='.$minor->id)
            ->assertOk()
            ->assertJsonPath('summary.total', 1)
            ->assertJsonPath('summary.red', 1)
            ->assertJsonPath('summary.handover_pending', 1)
            ->assertJsonPath('daily_series.0.day', '2026-07-02');
    }

    public function test_follow_up_and_handover_validations_are_enforced(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-JRN-003',
            'first_name' => 'Lia',
            'last_name' => 'Verde',
            'birth_date' => '2012-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);

        $type = JournalEntryType::query()->where('code', 'OBSERVATION')->firstOrFail();

        $this->withToken($this->token)
            ->postJson('/api/journals', [
                'minor_id' => $minor->id,
                'journal_entry_type_id' => $type->id,
                'observed_at' => '2026-07-03 10:30:00',
                'title' => 'Voce con follow-up incompleto',
                'content' => 'Contenuto test.',
                'follow_up_required' => true,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['follow_up_notes']);

        $this->withToken($this->token)
            ->postJson('/api/journals', [
                'minor_id' => $minor->id,
                'journal_entry_type_id' => $type->id,
                'observed_at' => '2026-07-03 10:45:00',
                'title' => 'Voce con handover incompleto',
                'content' => 'Contenuto test.',
                'handover_required' => true,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['handover_notes']);

        $this->withToken($this->token)
            ->postJson('/api/journals', [
                'minor_id' => $minor->id,
                'journal_entry_type_id' => $type->id,
                'observed_at' => '2026-07-03 11:00:00',
                'title' => 'Voce con presa visione incompleta',
                'content' => 'Contenuto test.',
                'handover_read_at' => '2026-07-03 11:15:00',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['handover_read_by_user_id']);
    }

    public function test_can_filter_journals_by_handover_required(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-JRN-004',
            'first_name' => 'Paolo',
            'last_name' => 'Rosa',
            'birth_date' => '2011-02-02',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = JournalEntryType::query()->where('code', 'OBSERVATION')->firstOrFail();

        MinorJournalEntry::query()->create([
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'journal_entry_type_id' => $type->id,
            'observed_at' => '2026-07-03 09:00:00',
            'title' => 'Con handover',
            'content' => 'Da passare al turno successivo.',
            'handover_required' => true,
            'handover_notes' => 'Nota di consegna.',
        ]);

        MinorJournalEntry::query()->create([
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'journal_entry_type_id' => $type->id,
            'observed_at' => '2026-07-03 09:30:00',
            'title' => 'Senza handover',
            'content' => 'Voce ordinaria.',
            'handover_required' => false,
        ]);

        $this->withToken($this->token)
            ->getJson('/api/journals?minor_id='.$minor->id.'&handover_required=1')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Con handover');
    }

    public function test_can_link_journal_entry_to_pei_objective_and_generate_progress_log(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-JRN-PEI-001',
            'first_name' => 'Nadia',
            'last_name' => 'Rosa',
            'birth_date' => '2011-05-05',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);

        $type = JournalEntryType::query()->where('code', 'OBSERVATION')->firstOrFail();
        $pei = MinorPei::query()->create([
            'minor_id' => $minor->id,
            'title' => 'PEI relazioni',
            'status' => 'active',
        ]);
        $objective = MinorPeiObjective::query()->create([
            'minor_pei_id' => $pei->id,
            'code' => 'OBJ-JRN-001',
            'title' => 'Migliorare espressione emotiva',
            'status' => 'in_progress',
            'progress_percent' => 55,
        ]);

        $response = $this->withToken($this->token)
            ->postJson('/api/journals', [
                'minor_id' => $minor->id,
                'journal_entry_type_id' => $type->id,
                'observed_at' => '2026-07-03 18:00:00',
                'title' => 'Osservazione PEI',
                'content' => 'Il minore verbalizza meglio gli stati emotivi.',
                'priority_level' => 'green',
                'pei_objective_id' => $objective->id,
            ])
            ->assertCreated()
            ->assertJsonPath('pei_objective_id', $objective->id)
            ->assertJsonPath('pei_objective.id', $objective->id);

        $this->assertDatabaseHas('minor_pei_objective_progress_logs', [
            'minor_pei_objective_id' => $objective->id,
            'source_type' => 'minor_journal_entry',
            'source_id' => (string) $response->json('id'),
            'source_label' => 'Osservazione PEI',
        ]);
    }
}
