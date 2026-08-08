<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\ContactType;
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

class MinorPermissionAlignmentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_educator_can_create_minor_contact_without_minor_profile_update_permission(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor] = $this->createAssignedEducatorAndMinor('educatore.contacts@familyhub.local');
        $contactType = ContactType::query()->where('code', 'TUTOR')->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();

        $this->withToken($token)
            ->postJson("/api/minors/{$minor->id}/contacts", [
                'contact_type_id' => $contactType->id,
                'first_name' => 'Giulia',
                'last_name' => 'Verdi',
                'phone' => '3331234567',
                'email' => 'giulia.verdi@example.test',
                'city_id' => $city->id,
                'notes' => 'Contatto principale',
            ])
            ->assertCreated()
            ->assertJsonPath('contact_type.code', 'TUTOR');
    }

    public function test_assigned_educator_cannot_open_full_minor_detail_without_minor_profiles_read(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor] = $this->createAssignedEducatorAndMinor('educatore.readonly@familyhub.local');

        $this->withToken($token)
            ->getJson("/api/minors/{$minor->id}")
            ->assertForbidden();
    }

    private function createAssignedEducatorAndMinor(string $email): array
    {
        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();

        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-PERM-'.str()->upper(str()->random(6)),
            'first_name' => 'Test',
            'last_name' => 'Permission',
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
            'last_name' => 'Permissions',
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

        \App\Models\MinorUserAssignment::query()->create([
            'minor_id' => $minor->id,
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'valid_from' => now()->toDateString(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password',
            'device_name' => 'minor-permission-alignment-test',
        ])->assertOk()->json('access_token');

        return [$token, $minor];
    }
}
