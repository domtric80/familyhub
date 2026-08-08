<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Facility;
use App\Models\Organization;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            GeographySeeder::class,
            LookupSeeder::class,
            RbacSeeder::class,
            GeographyProviderSeeder::class,
        ]);

        User::query()->updateOrCreate(
            ['email' => 'admin@familyhub.local'],
            [
                'uuid' => '11111111-1111-1111-1111-111111111111',
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'password' => 'password',
                'mfa_required' => true,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $organization = Organization::query()->firstOrCreate(
            ['name' => 'FamilyHub Demo Organization'],
            [
                'legal_name' => 'FamilyHub Demo Organization',
                'email' => 'info@familyhub.local',
            ],
        );

        $city = City::query()->where('name', 'Roma')->firstOrFail();

        $facility = Facility::query()->firstOrCreate(
            [
                'organization_id' => $organization->id,
                'code' => 'FH-ROMA-01',
            ],
            [
                'name' => 'FamilyHub Roma Demo',
                'address_line' => 'Via Demo 1',
                'city_id' => $city->id,
                'postal_code' => '00100',
                'capacity' => 20,
                'status' => 'active',
            ],
        );

        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $superAdminRole = Role::query()->where('code', 'SUPER_ADMIN')->firstOrFail();

        UserFacilityRole::query()->updateOrCreate(
            [
                'user_id' => $adminUser->id,
                'facility_id' => $facility->id,
                'role_id' => $superAdminRole->id,
            ],
            [
                'valid_from' => now(),
                'valid_to' => null,
                'is_active' => true,
                'assigned_by_user_id' => $adminUser->id,
            ],
        );
    }
}
