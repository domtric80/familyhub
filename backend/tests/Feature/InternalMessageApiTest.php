<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\InternalMessageMessage;
use App\Models\InternalMessageThread;
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
                'participant_user_ids' => [$otherUser->id],
                'message_body' => 'Messaggio interno riservato.',
            ])
            ->assertCreated()
            ->assertJsonPath('subject', 'Consegne pomeriggio')
            ->assertJsonPath('messages.0.body', 'Messaggio interno riservato.');

        $threadId = $response->json('id');
        $storedMessage = InternalMessageMessage::query()->where('thread_id', $threadId)->firstOrFail();

        $this->assertNotSame('Messaggio interno riservato.', $storedMessage->getRawOriginal('body_encrypted'));
    }

    public function test_minor_scoped_thread_requires_minor_assignment_for_access(): void
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

        Sanctum::actingAs($coordUser, ['*']);

        $thread = $this->postJson('/api/internal-messages/threads', [
                'facility_id' => $facility->id,
                'minor_id' => $minor->id,
                'thread_type' => 'minor',
                'subject' => 'Caso minore - confronto team',
                'participant_user_ids' => [$educatorUser->id],
                'message_body' => 'Confronto riservato sul caso.',
            ])
            ->assertCreated();

        $threadId = $thread->json('id');

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
