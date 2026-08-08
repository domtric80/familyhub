<?php

namespace Tests\Feature;

use App\Models\Minor;
use App\Models\MinorNote;
use App\Models\MinorUserAssignment;
use App\Models\Facility;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Tests\TestCase;

class MinorNoteApiTest extends TestCase
{
    use RefreshDatabase;

    protected string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'phpunit-minor-notes-admin',
        ])->assertOk();

        $this->adminToken = (string) $login->json('access_token');
    }

    public function test_authorized_user_can_create_and_list_clinical_minor_note(): void
    {
        $minor = $this->createMinorFixture();

        $createResponse = $this->withToken($this->adminToken)
            ->postJson("/api/minors/{$minor->id}/notes", [
                'classification_code' => 'clinical',
                'title' => 'Nota clinica condivisa',
                'body' => 'Osservazione clinica protetta.',
            ])
            ->assertCreated()
            ->assertJsonPath('classification_code', 'clinical')
            ->assertJsonPath('title', 'Nota clinica condivisa')
            ->assertJsonPath('body', 'Osservazione clinica protetta.')
            ->assertJsonPath('is_encrypted', true);

        $noteId = (int) $createResponse->json('id');
        $stored = MinorNote::query()->findOrFail($noteId);

        $this->assertNotSame('Osservazione clinica protetta.', $stored->getRawOriginal('body_encrypted'));
        $this->assertSame('Osservazione clinica protetta.', Crypt::decryptString($stored->getRawOriginal('body_encrypted')));

        $this->withToken($this->adminToken)
            ->getJson("/api/minors/{$minor->id}/notes")
            ->assertOk()
            ->assertJsonFragment([
                'id' => $noteId,
                'classification_code' => 'clinical',
                'title' => 'Nota clinica condivisa',
                'body' => 'Osservazione clinica protetta.',
            ]);
    }

    public function test_educator_cannot_see_clinical_minor_note(): void
    {
        $minor = $this->createMinorFixture();
        $adminId = User::query()->where('email', 'admin@familyhub.local')->value('id');

        $note = MinorNote::query()->create([
            'minor_id' => $minor->id,
            'facility_id' => $minor->facility_id,
            'classification_code' => 'clinical',
            'title' => 'Nota clinica nascosta',
            'body_encrypted' => Crypt::encryptString('Contenuto visibile solo a ruoli clinici.'),
            'is_encrypted' => true,
            'created_by_user_id' => $adminId,
            'updated_by_user_id' => $adminId,
        ]);

        $coordinator = User::query()->create([
            'uuid' => '22222222-2222-2222-2222-222222222222',
            'email' => 'qa.coordinator.notes@familyhub.local',
            'first_name' => 'Elena',
            'last_name' => 'Blu',
            'password' => Hash::make('Password1234!'),
            'is_active' => true,
            'mfa_required' => false,
        ]);

        $roleId = Role::query()->where('code', 'COORDINATORE')->value('id');

        UserFacilityRole::query()->create([
            'user_id' => $coordinator->id,
            'facility_id' => $minor->facility_id,
            'role_id' => $roleId,
            'valid_from' => now()->subDay(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminId,
        ]);

        MinorUserAssignment::query()->create([
            'minor_id' => $minor->id,
            'user_id' => $coordinator->id,
            'facility_id' => $minor->facility_id,
            'valid_from' => now()->subDay()->toDateString(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminId,
            'notes' => 'Test classificazione note',
        ]);

        $coordinatorLogin = $this->postJson('/api/auth/login', [
            'email' => 'qa.coordinator.notes@familyhub.local',
            'password' => 'Password1234!',
            'device_name' => 'phpunit-minor-notes-coordinator',
        ])->assertOk();

        $coordinatorToken = (string) $coordinatorLogin->json('access_token');

        $this->withToken($coordinatorToken)
            ->getJson("/api/minors/{$minor->id}/notes")
            ->assertOk()
            ->assertJsonMissing([
                'id' => $note->id,
                'title' => 'Nota clinica nascosta',
            ]);
    }

    private function createMinorFixture(): Minor
    {
        $facility = Facility::query()->firstOrFail();

        return Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-NOTE-QA-01',
            'first_name' => 'Giulia',
            'last_name' => 'Bianchi',
            'preferred_name' => 'Giulia',
            'birth_date' => '2012-05-14',
            'birth_city_id' => 1,
            'biological_sex_id' => 1,
            'gender_identity_id' => 1,
            'tax_code' => null,
            'entry_date' => '2026-06-01',
            'minor_status_id' => 1,
        ]);
    }
}
