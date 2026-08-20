<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class FacilityBulletinApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_bulletin_is_encrypted_published_immutable_visible_and_acknowledged_once(): void
    {
        $this->seed(DatabaseSeeder::class);
        $token = (string) $this->postJson('/api/auth/login', ['email' => 'admin@familyhub.local', 'password' => 'password', 'device_name' => 'phpunit-bulletins'])->assertOk()->json('access_token');
        $facility = Facility::query()->firstOrFail();

        $bulletin = $this->withToken($token)->postJson('/api/admin/facility-bulletins', ['facility_id' => $facility->id, 'title' => 'Riunione équipe', 'body' => 'La riunione è prevista lunedì.', 'target_role_ids' => []])
            ->assertCreated()->assertJsonPath('status', 'DRAFT')->json();

        $this->assertDatabaseMissing('facility_bulletins', ['title' => 'Riunione équipe']);
        $this->withToken($token)->postJson("/api/admin/facility-bulletins/{$bulletin['id']}/publish")->assertOk()->assertJsonPath('status', 'PUBLISHED');
        $this->withToken($token)->getJson("/api/bulletins?facility_id={$facility->id}")->assertOk()->assertJsonPath('0.title', 'Riunione équipe')->assertJsonPath('0.is_acknowledged', false);
        $this->withToken($token)->postJson("/api/bulletins/{$bulletin['id']}/acknowledge")->assertOk()->assertJsonPath('already_acknowledged', false);
        $this->withToken($token)->postJson("/api/bulletins/{$bulletin['id']}/acknowledge")->assertOk()->assertJsonPath('already_acknowledged', true);
        $this->withToken($token)->putJson("/api/admin/facility-bulletins/{$bulletin['id']}", ['facility_id' => $facility->id, 'title' => 'Modifica vietata', 'body' => 'Test'])->assertStatus(409);

        $this->assertDatabaseCount('facility_bulletin_acknowledgements', 1);
        $this->assertDatabaseHas('audit_logs', ['resource_type' => 'facility_bulletin', 'action' => 'publish']);
        $this->assertDatabaseHas('audit_logs', ['resource_type' => 'facility_bulletin', 'action' => 'acknowledge']);
    }

    public function test_bulletin_targeted_to_another_role_is_not_discoverable(): void
    {
        $this->seed(DatabaseSeeder::class);
        $adminToken = (string) $this->postJson('/api/auth/login', ['email' => 'admin@familyhub.local', 'password' => 'password', 'device_name' => 'phpunit-bulletin-admin'])->assertOk()->json('access_token');
        $facility = Facility::query()->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();
        $psychologistRole = Role::query()->where('code', 'PSICOLOGO')->firstOrFail();
        $bulletinId = $this->withToken($adminToken)->postJson('/api/admin/facility-bulletins', ['facility_id' => $facility->id, 'title' => 'Solo educatori', 'body' => 'Comunicazione riservata al ruolo.', 'target_role_ids' => [$educatorRole->id]])->assertCreated()->json('id');
        $this->withToken($adminToken)->postJson("/api/admin/facility-bulletins/{$bulletinId}/publish")->assertOk();

        $reader = User::query()->create(['uuid' => (string) Str::uuid(), 'email' => 'psychologist-bulletin@example.test', 'password' => 'password', 'first_name' => 'Lia', 'last_name' => 'Neri', 'is_active' => true, 'mfa_required' => false]);
        $reader->userFacilityRoles()->create(['facility_id' => $facility->id, 'role_id' => $psychologistRole->id, 'valid_from' => now(), 'is_active' => true]);
        $readerToken = (string) $this->postJson('/api/auth/login', ['email' => $reader->email, 'password' => 'password', 'device_name' => 'phpunit-bulletin-reader'])->assertOk()->json('access_token');

        $this->withToken($readerToken)->getJson("/api/bulletins?facility_id={$facility->id}")->assertOk()->assertExactJson([]);
        $this->withToken($readerToken)->getJson("/api/bulletins/{$bulletinId}")->assertNotFound();
    }
}
