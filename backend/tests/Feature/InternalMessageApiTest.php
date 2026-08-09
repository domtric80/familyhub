<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\InternalMessageMessage;
use App\Models\InternalMessageThread;
use App\Models\InternalMessageThreadParticipant;
use App\Models\Minor;
use App\Models\MinorStatus;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use App\Services\InternalMessageAccessService;
use App\Services\MinorAccessService;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InternalMessageApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_facility_thread_with_encrypted_message(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(RbacSeeder::class);

        $facility = Facility::query()->firstOrFail();
        $coordinatorUser = $this->createFacilityUser('coord.msg@familyhub.local', 'COORDINATORE', $facility->id);
        $otherUser = $this->createFacilityUser('edu.msg@familyhub.local', 'EDUCATORE', $facility->id);

        Sanctum::actingAs($coordinatorUser, ['*']);

        $response = $this->postJson('/api/internal-messages/threads', [
                'facility_id' => $facility->id,
                'thread_type' => 'facility',
                'subject' => 'Consegne pomeriggio',
                'topic' => 'Allineamento rapido del team',
                'classification_code' => 'internal',
                'participant_user_ids' => [$otherUser->id],
                'message_body' => 'Messaggio interno riservato.',
            ])
            ->assertCreated()
            ->assertJsonPath('subject', 'Consegne pomeriggio')
            ->assertJsonPath('classification_code', 'internal')
            ->assertJsonPath('messages.0.body', 'Messaggio interno riservato.');

        $threadId = $response->json('id');
        $storedMessage = InternalMessageMessage::query()->where('thread_id', $threadId)->firstOrFail();

        $this->assertNotSame('Messaggio interno riservato.', $storedMessage->getRawOriginal('body_encrypted'));
    }

    public function test_minor_scoped_thread_requires_active_minor_assignment_for_access(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(RbacSeeder::class);

        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-MSG-001',
            'first_name' => 'Mia',
            'last_name' => 'Riva',
            'birth_date' => '2012-02-02',
            'entry_date' => '2026-01-01',
            'minor_status_id' => MinorStatus::query()->firstOrFail()->id,
        ]);

        $coordUser = $this->createFacilityUser('coord.minor@familyhub.local', 'COORDINATORE', $facility->id);
        $educatorUser = $this->createFacilityUser('edu.minor@familyhub.local', 'EDUCATORE', $facility->id);

        \App\Models\MinorUserAssignment::query()->create([
            'minor_id' => $minor->id,
            'user_id' => $coordUser->id,
            'facility_id' => $facility->id,
            'valid_from' => now()->toDateString(),
            'is_active' => true,
            'assigned_by_user_id' => User::query()->where('email', 'admin@familyhub.local')->firstOrFail()->id,
        ]);

        $educatorAssignment = \App\Models\MinorUserAssignment::query()->create([
            'minor_id' => $minor->id,
            'user_id' => $educatorUser->id,
            'facility_id' => $facility->id,
            'valid_from' => now()->toDateString(),
            'is_active' => true,
            'assigned_by_user_id' => User::query()->where('email', 'admin@familyhub.local')->firstOrFail()->id,
        ]);

        Sanctum::actingAs($coordUser, ['*']);

        $thread = $this->postJson('/api/internal-messages/threads', [
                'facility_id' => $facility->id,
                'minor_id' => $minor->id,
                'thread_type' => 'minor',
                'subject' => 'Caso minore - confronto team',
                'classification_code' => 'internal',
                'participant_user_ids' => [$educatorUser->id],
                'message_body' => 'Confronto riservato sul caso.',
            ])
            ->assertCreated();

        $threadId = $thread->json('id');

        $this->assertTrue(app(MinorAccessService::class)->hasActiveAssignment($educatorUser, $minor));

        $educatorAssignment->update([
            'is_active' => false,
            'valid_to' => now()->toDateString(),
        ]);

        $this->assertFalse(app(MinorAccessService::class)->hasActiveAssignment($educatorUser, $minor));
        $this->assertFalse(
            app(InternalMessageAccessService::class)->canAccessThread(
                $educatorUser,
                InternalMessageThread::query()->with('minor')->findOrFail($threadId),
                'internal_messages.read'
            )
        );

        Sanctum::actingAs($educatorUser, ['*']);

        $this->getJson('/api/internal-messages/threads/'.$threadId)
            ->assertForbidden();
    }

    public function test_participant_can_mark_thread_as_read_and_reply(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(RbacSeeder::class);

        $facility = Facility::query()->firstOrFail();
        $coordinatorUser = $this->createFacilityUser('coord.reply@familyhub.local', 'COORDINATORE', $facility->id);
        $educatorUser = $this->createFacilityUser('edu.reply@familyhub.local', 'EDUCATORE', $facility->id);

        Sanctum::actingAs($coordinatorUser, ['*']);

        $thread = $this->postJson('/api/internal-messages/threads', [
                'facility_id' => $facility->id,
                'thread_type' => 'facility',
                'subject' => 'Turno sera',
                'classification_code' => 'internal',
                'participant_user_ids' => [$educatorUser->id],
                'message_body' => 'Ricordati la consegna finale.',
            ])
            ->assertCreated();

        $threadId = $thread->json('id');

        Sanctum::actingAs($educatorUser, ['*']);

        $this->postJson('/api/internal-messages/threads/'.$threadId.'/messages', [
                'body' => 'Ricevuto, aggiorno il diario prima di uscire.',
            ])
            ->assertCreated()
            ->assertJsonPath('body', 'Ricevuto, aggiorno il diario prima di uscire.');

        $this->postJson('/api/internal-messages/threads/'.$threadId.'/mark-read')
            ->assertOk()
            ->assertJsonPath('message', 'Conversazione marcata come letta.');
    }

    public function test_participant_options_return_role_metadata_and_minor_filtering(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(RbacSeeder::class);

        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-MSG-002',
            'first_name' => 'Nora',
            'last_name' => 'Blu',
            'birth_date' => '2013-03-03',
            'entry_date' => '2026-01-10',
            'minor_status_id' => MinorStatus::query()->firstOrFail()->id,
        ]);

        $coordinatorUser = $this->createFacilityUser('coord.options@familyhub.local', 'COORDINATORE', $facility->id);
        $educatorAssigned = $this->createFacilityUser('edu.assigned@familyhub.local', 'EDUCATORE', $facility->id);
        $educatorUnassigned = $this->createFacilityUser('edu.unassigned@familyhub.local', 'EDUCATORE', $facility->id);

        \App\Models\MinorUserAssignment::query()->create([
            'minor_id' => $minor->id,
            'user_id' => $coordinatorUser->id,
            'facility_id' => $facility->id,
            'valid_from' => now()->toDateString(),
            'is_active' => true,
            'assigned_by_user_id' => User::query()->where('email', 'admin@familyhub.local')->firstOrFail()->id,
        ]);

        \App\Models\MinorUserAssignment::query()->create([
            'minor_id' => $minor->id,
            'user_id' => $educatorAssigned->id,
            'facility_id' => $facility->id,
            'valid_from' => now()->toDateString(),
            'is_active' => true,
            'assigned_by_user_id' => User::query()->where('email', 'admin@familyhub.local')->firstOrFail()->id,
        ]);

        Sanctum::actingAs($coordinatorUser, ['*']);

        $facilityScopedUsers = $this->getJson("/api/internal-messages/options/participants?facility_id={$facility->id}")
            ->assertOk()
            ->assertJsonPath('facility_id', $facility->id)
            ->assertJsonStructure([
                'users' => [
                    '*' => ['id', 'display_name', 'first_name', 'last_name', 'email', 'role_code', 'role_name', 'is_minor_scoped'],
                ],
            ])
            ->json('users');

        $coordinatorFacilityUser = collect($facilityScopedUsers)->firstWhere('id', $coordinatorUser->id);
        $this->assertNotNull($coordinatorFacilityUser);
        $this->assertSame('COORDINATORE', $coordinatorFacilityUser['role_code']);
        $this->assertSame('Coordinatore', $coordinatorFacilityUser['role_name']);

        $minorScoped = $this->getJson("/api/internal-messages/options/participants?facility_id={$facility->id}&minor_id={$minor->id}")
            ->assertOk()
            ->json('users');

        $minorScopedIds = collect($minorScoped)->pluck('id')->all();
        $this->assertContains($educatorAssigned->id, $minorScopedIds);
        $this->assertNotContains($educatorUnassigned->id, $minorScopedIds);
    }

    public function test_participant_options_can_be_filtered_by_classification_code(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(RbacSeeder::class);

        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-MSG-004',
            'first_name' => 'Sara',
            'last_name' => 'Neri',
            'birth_date' => '2014-06-06',
            'entry_date' => '2026-02-10',
            'minor_status_id' => MinorStatus::query()->firstOrFail()->id,
        ]);

        $pediatricianUser = $this->createFacilityUser('ped.options@familyhub.local', 'PEDIATRA', $facility->id);
        $psychologistUser = $this->createFacilityUser('psy.options@familyhub.local', 'PSICOLOGO', $facility->id);
        $educatorUser = $this->createFacilityUser('edu.options2@familyhub.local', 'EDUCATORE', $facility->id);

        foreach ([$pediatricianUser, $psychologistUser, $educatorUser] as $assignedUser) {
            \App\Models\MinorUserAssignment::query()->create([
                'minor_id' => $minor->id,
                'user_id' => $assignedUser->id,
                'facility_id' => $facility->id,
                'valid_from' => now()->toDateString(),
                'is_active' => true,
                'assigned_by_user_id' => User::query()->where('email', 'admin@familyhub.local')->firstOrFail()->id,
            ]);
        }

        Sanctum::actingAs($psychologistUser, ['*']);

        $users = $this->getJson("/api/internal-messages/options/participants?facility_id={$facility->id}&minor_id={$minor->id}&classification_code=clinical")
            ->assertOk()
            ->json('users');

        $ids = collect($users)->pluck('id')->all();
        $this->assertContains($psychologistUser->id, $ids);
        $this->assertContains($pediatricianUser->id, $ids);
        $this->assertNotContains($educatorUser->id, $ids);
    }

    public function test_minor_thread_rejects_participants_without_minor_assignment(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(RbacSeeder::class);

        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-MSG-003',
            'first_name' => 'Lia',
            'last_name' => 'Mare',
            'birth_date' => '2014-04-04',
            'entry_date' => '2026-02-02',
            'minor_status_id' => MinorStatus::query()->firstOrFail()->id,
        ]);

        $coordUser = $this->createFacilityUser('coord.minor2@familyhub.local', 'COORDINATORE', $facility->id);
        $educatorUser = $this->createFacilityUser('edu.minor2@familyhub.local', 'EDUCATORE', $facility->id);

        \App\Models\MinorUserAssignment::query()->create([
            'minor_id' => $minor->id,
            'user_id' => $coordUser->id,
            'facility_id' => $facility->id,
            'valid_from' => now()->toDateString(),
            'is_active' => true,
            'assigned_by_user_id' => User::query()->where('email', 'admin@familyhub.local')->firstOrFail()->id,
        ]);

        Sanctum::actingAs($coordUser, ['*']);

        $this->postJson('/api/internal-messages/threads', [
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'thread_type' => 'minor',
            'subject' => 'Thread non valido',
            'classification_code' => 'internal',
            'participant_user_ids' => [$educatorUser->id],
            'message_body' => 'Tentativo con partecipante non assegnato al minore.',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['participant_user_ids']);
    }

    public function test_clinical_minor_thread_rejects_participants_without_classification_access(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(RbacSeeder::class);

        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-MSG-005',
            'first_name' => 'Eva',
            'last_name' => 'Luce',
            'birth_date' => '2015-05-05',
            'entry_date' => '2026-03-01',
            'minor_status_id' => MinorStatus::query()->firstOrFail()->id,
        ]);

        $psychologistUser = $this->createFacilityUser('psy.thread@familyhub.local', 'PSICOLOGO', $facility->id);
        $educatorUser = $this->createFacilityUser('edu.thread@familyhub.local', 'EDUCATORE', $facility->id);

        foreach ([$psychologistUser, $educatorUser] as $assignedUser) {
            \App\Models\MinorUserAssignment::query()->create([
                'minor_id' => $minor->id,
                'user_id' => $assignedUser->id,
                'facility_id' => $facility->id,
                'valid_from' => now()->toDateString(),
                'is_active' => true,
                'assigned_by_user_id' => User::query()->where('email', 'admin@familyhub.local')->firstOrFail()->id,
            ]);
        }

        Sanctum::actingAs($psychologistUser, ['*']);

        $this->postJson('/api/internal-messages/threads', [
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'thread_type' => 'minor',
            'subject' => 'Thread clinico non valido',
            'classification_code' => 'clinical',
            'participant_user_ids' => [$educatorUser->id],
            'message_body' => 'Contenuto clinico riservato.',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['participant_user_ids']);
    }

    public function test_participant_cannot_open_thread_if_classification_is_not_allowed(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(RbacSeeder::class);

        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-MSG-006',
            'first_name' => 'Gio',
            'last_name' => 'Rosa',
            'birth_date' => '2014-07-07',
            'entry_date' => '2026-03-20',
            'minor_status_id' => MinorStatus::query()->firstOrFail()->id,
        ]);

        $pediatricianUser = $this->createFacilityUser('ped.read@familyhub.local', 'PEDIATRA', $facility->id);
        $educatorUser = $this->createFacilityUser('edu.read@familyhub.local', 'EDUCATORE', $facility->id);

        foreach ([$pediatricianUser, $educatorUser] as $assignedUser) {
            \App\Models\MinorUserAssignment::query()->create([
                'minor_id' => $minor->id,
                'user_id' => $assignedUser->id,
                'facility_id' => $facility->id,
                'valid_from' => now()->toDateString(),
                'is_active' => true,
                'assigned_by_user_id' => User::query()->where('email', 'admin@familyhub.local')->firstOrFail()->id,
            ]);
        }

        $thread = InternalMessageThread::query()->create([
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'thread_type' => 'minor',
            'subject' => 'Thread clinico manuale',
            'classification_code' => 'clinical',
            'created_by_user_id' => $pediatricianUser->id,
            'updated_by_user_id' => $pediatricianUser->id,
            'last_message_at' => now(),
        ]);

        foreach ([$pediatricianUser, $educatorUser] as $participant) {
            InternalMessageThreadParticipant::query()->create([
                'thread_id' => $thread->id,
                'user_id' => $participant->id,
                'joined_at' => now(),
                'is_active' => true,
                'added_by_user_id' => $pediatricianUser->id,
            ]);
        }

        InternalMessageMessage::query()->create([
            'thread_id' => $thread->id,
            'sender_user_id' => $pediatricianUser->id,
            'body_encrypted' => encrypt('Messaggio clinico riservato.'),
        ]);

        Sanctum::actingAs($educatorUser, ['*']);

        $this->getJson('/api/internal-messages/threads/'.$thread->id)
            ->assertForbidden();
    }

    public function test_participant_can_archive_thread(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(RbacSeeder::class);

        $facility = Facility::query()->firstOrFail();
        $coordinatorUser = $this->createFacilityUser('coord.archive@familyhub.local', 'COORDINATORE', $facility->id);
        $educatorUser = $this->createFacilityUser('edu.archive@familyhub.local', 'EDUCATORE', $facility->id);

        Sanctum::actingAs($coordinatorUser, ['*']);

        $threadId = $this->postJson('/api/internal-messages/threads', [
            'facility_id' => $facility->id,
            'thread_type' => 'facility',
            'subject' => 'Archivio thread',
            'classification_code' => 'internal',
            'participant_user_ids' => [$educatorUser->id],
            'message_body' => 'Thread da archiviare.',
        ])->assertCreated()->json('id');

        $this->postJson("/api/internal-messages/threads/{$threadId}/archive")
            ->assertOk()
            ->assertJsonPath('message', 'Conversazione archiviata.')
            ->assertJsonPath('thread.id', $threadId);

        $this->getJson('/api/internal-messages/threads')
            ->assertOk()
            ->assertJsonCount(0);

        $this->getJson('/api/internal-messages/threads?archived=true')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $threadId);
    }

    private function createFacilityUser(string $email, string $roleCode, int $facilityId): User
    {
        $admin = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $role = Role::query()->where('code', $roleCode)->firstOrFail();

        $user = User::query()->create([
            'uuid' => (string) str()->uuid(),
            'email' => $email,
            'password' => Hash::make('password'),
            'first_name' => 'Test',
            'last_name' => $roleCode,
            'is_active' => true,
            'mfa_required' => false,
            'email_verified_at' => now(),
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facilityId,
            'role_id' => $role->id,
            'valid_from' => now()->toDateString(),
            'is_active' => true,
            'assigned_by_user_id' => $admin->id,
        ]);

        return $user;
    }
}
