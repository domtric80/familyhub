<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserFacilityRoleUniquenessApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_cannot_create_second_active_role_for_same_user_and_facility(): void
    {
        $admin = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $facility = Facility::query()->where('code', 'FH-ROMA-01')->firstOrFail();
        $newRole = Role::query()->where('code', 'PSICOLOGO')->firstOrFail();
        $currentRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();
        $user = User::query()->create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'email' => 'duplicate-role-test@familyhub.local',
            'password' => 'password',
            'first_name' => 'Duplicate',
            'last_name' => 'Role',
            'is_active' => true,
            'mfa_required' => false,
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $currentRole->id,
            'valid_from' => now()->subDay(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $admin->id,
        ]);

        $token = $admin->createToken('phpunit-user-role-duplicate')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/admin/user-facility-roles', [
                'user_id' => $user->id,
                'facility_id' => $facility->id,
                'role_id' => $newRole->id,
                'valid_from' => now()->toDateString(),
                'is_active' => true,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['facility_id']);
    }

    public function test_auth_me_returns_only_active_user_facility_roles(): void
    {
        $admin = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $facility = Facility::query()->where('code', 'FH-ROMA-01')->firstOrFail();
        $role = Role::query()->where('code', 'EDUCATORE')->firstOrFail();
        $user = User::query()->create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'email' => 'auth-me-active-only@familyhub.local',
            'password' => 'password',
            'first_name' => 'Auth',
            'last_name' => 'ActiveOnly',
            'is_active' => true,
            'mfa_required' => false,
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $role->id,
            'valid_from' => now()->subDays(2),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $admin->id,
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $role->id,
            'valid_from' => now()->subDays(10),
            'valid_to' => now()->subDay(),
            'is_active' => false,
            'assigned_by_user_id' => $admin->id,
        ]);

        $token = $user->createToken('phpunit-auth-me')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk();

        $roles = $response->json('user.user_facility_roles');

        $this->assertIsArray($roles);
        $this->assertCount(1, $roles);
        $this->assertTrue((bool) $roles[0]['is_active']);
    }
}
