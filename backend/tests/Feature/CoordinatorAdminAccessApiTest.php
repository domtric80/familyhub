<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\Facility;
use App\Models\GenderIdentity;
use App\Models\MinorStatus;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class CoordinatorAdminAccessApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_coordinator_can_create_minor_update_tax_code_and_manage_minor_assignments(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $facility, $adminUser, $coordinatorUser] = $this->createCoordinatorContext();

        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();

        $minorId = $this->withToken($token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-COORD-001',
                'first_name' => 'Marco',
                'last_name' => 'Blu',
                'birth_date' => '2013-08-12',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $this->withToken($token)
            ->patchJson("/api/minors/{$minorId}", [
                'tax_code' => 'MRCBLU13M12H501X',
            ])
            ->assertOk()
            ->assertJsonPath('tax_code', 'MRCBLU13M12H501X');

        $educatorUser = User::query()->create([
            'uuid' => (string) Str::uuid(),
            'email' => 'educatore.coord.assign@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Edu',
            'last_name' => 'Assign',
            'is_active' => true,
            'mfa_required' => false,
            'email_verified_at' => now(),
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $educatorUser->id,
            'facility_id' => $facility->id,
            'role_id' => $educatorRole->id,
            'valid_from' => now()->toDateString(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $this->withToken($token)
            ->postJson("/api/admin/users/{$educatorUser->id}/minor-assignments/bulk-sync", [
                'facility_id' => $facility->id,
                'minor_ids' => [$minorId],
                'valid_from' => now()->toDateString(),
                'valid_to' => null,
                'is_active' => true,
                'notes' => 'Assegnazione gestita da coordinatore',
            ])
            ->assertOk()
            ->assertJsonPath('synced_minor_ids.0', $minorId);

        $this->assertDatabaseHas('minor_user_assignments', [
            'minor_id' => $minorId,
            'user_id' => $educatorUser->id,
            'facility_id' => $facility->id,
            'is_active' => true,
        ]);

        $newCoordinatorUser = User::query()->create([
            'uuid' => (string) Str::uuid(),
            'email' => 'coordinatore.secondario@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Secondo',
            'last_name' => 'Coordinatore',
            'is_active' => true,
            'mfa_required' => false,
            'email_verified_at' => now(),
        ]);

        $coordinatorRole = Role::query()->where('code', 'COORDINATORE')->firstOrFail();

        $this->withToken($token)
            ->postJson('/api/admin/user-facility-roles', [
                'user_id' => $newCoordinatorUser->id,
                'facility_id' => $facility->id,
                'role_id' => $coordinatorRole->id,
                'valid_from' => now()->toDateString(),
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('role.code', 'COORDINATORE');

        $this->assertDatabaseHas('user_facility_roles', [
            'user_id' => $newCoordinatorUser->id,
            'facility_id' => $facility->id,
            'role_id' => $coordinatorRole->id,
            'is_active' => true,
        ]);
    }

    private function createCoordinatorContext(): array
    {
        $facility = Facility::query()->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $coordinatorRole = Role::query()->where('code', 'COORDINATORE')->firstOrFail();

        $coordinatorUser = User::query()->create([
            'uuid' => (string) Str::uuid(),
            'email' => 'qa.coordinator.permissions@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Qa',
            'last_name' => 'Coordinator',
            'is_active' => true,
            'mfa_required' => false,
            'email_verified_at' => now(),
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $coordinatorUser->id,
            'facility_id' => $facility->id,
            'role_id' => $coordinatorRole->id,
            'valid_from' => now()->toDateString(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $coordinatorUser->email,
            'password' => 'password',
            'device_name' => 'phpunit-coordinator-admin-access',
        ])->assertOk()->json('access_token');

        return [$token, $facility, $adminUser, $coordinatorUser];
    }
}
