<?php

namespace Tests\Feature;

use App\Models\ActivityType;
use App\Models\City;
use App\Models\Facility;
use App\Models\GenderIdentity;
use App\Models\Minor;
use App\Models\MinorStatus;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MinorActivityAccessApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_educator_with_minor_activity_permission_can_create_activity(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor] = $this->createEducatorWithMinorAssignment('educatore.activity.assigned@familyhub.local', true);
        $activityTypeId = ActivityType::query()->where('code', 'LAB')->value('id')
            ?? ActivityType::query()->firstOrFail()->id;

        $this->withToken($token)
            ->postJson('/api/activities', [
                'minor_id' => $minor->id,
                'activity_type_id' => $activityTypeId,
                'title' => 'Laboratorio creativo',
                'description' => 'Sessione pomeridiana',
                'location' => 'Sala comune',
                'planned_start_at' => '2026-06-29 15:00:00',
                'planned_end_at' => '2026-06-29 16:00:00',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->assertJsonPath('minor_id', $minor->id);
    }

    public function test_unassigned_educator_with_minor_activity_permission_cannot_create_activity(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor] = $this->createEducatorWithMinorAssignment('educatore.activity.unassigned@familyhub.local', false);
        $activityTypeId = ActivityType::query()->where('code', 'LAB')->value('id')
            ?? ActivityType::query()->firstOrFail()->id;

        $this->withToken($token)
            ->postJson('/api/activities', [
                'minor_id' => $minor->id,
                'activity_type_id' => $activityTypeId,
                'title' => 'Laboratorio creativo',
                'description' => 'Sessione pomeridiana',
                'location' => 'Sala comune',
                'planned_start_at' => '2026-06-29 15:00:00',
                'planned_end_at' => '2026-06-29 16:00:00',
                'status' => 'planned',
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Creazione attivitÃ  non consentita per questo minore.');
    }

    private function createEducatorWithMinorAssignment(string $email, bool $assignMinor): array
    {
        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();

        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-ACT-'.str()->upper(str()->random(6)),
            'first_name' => 'Test',
            'last_name' => 'Activity',
            'birth_date' => '2012-01-01',
            'birth_city_id' => $city->id,
            'gender_identity_id' => $genderIdentity->id,
            'entry_date' => '2026-06-18',
            'minor_status_id' => $minorStatus->id,
        ]);

        $user = User::query()->create([
            'uuid' => (string) str()->uuid(),
            'email' => $email,
            'password' => Hash::make('password'),
            'first_name' => 'Edu',
            'last_name' => 'Activity',
            'is_active' => true,
            'mfa_required' => false,
            'email_verified_at' => now(),
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $educatorRole->id,
            'valid_from' => now()->toDateString(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        if ($assignMinor) {
            \App\Models\MinorUserAssignment::query()->create([
                'minor_id' => $minor->id,
                'user_id' => $user->id,
                'facility_id' => $facility->id,
                'valid_from' => now()->toDateString(),
                'valid_to' => null,
                'is_active' => true,
                'assigned_by_user_id' => $adminUser->id,
            ]);
        }

        $token = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password',
            'device_name' => 'minor-activity-access-test',
        ])->assertOk()->json('access_token');

        return [$token, $minor, $facility];
    }
}
