<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BootstrapCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_bootstrap_command_recreates_minimum_runtime_data_if_admin_and_rbac_are_missing(): void
    {
        DB::table('user_facility_roles')->delete();
        User::query()->delete();
        DB::table('role_permissions')->delete();
        Permission::query()->delete();
        Role::query()->delete();

        $this->artisan('familyhub:ensure-bootstrap', [
            '--admin-email' => 'admin@familyhub.local',
            '--admin-password' => 'password',
            '--disable-admin-mfa' => true,
            '--seed-missing-only' => true,
        ])->assertSuccessful();

        $this->assertDatabaseHas('users', [
            'email' => 'admin@familyhub.local',
            'is_active' => true,
            'mfa_required' => false,
        ]);

        $this->assertGreaterThan(0, Role::query()->count());
        $this->assertGreaterThan(0, Permission::query()->count());
        $this->assertDatabaseCount('user_facility_roles', 1);
    }
}
