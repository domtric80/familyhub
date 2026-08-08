<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\Role;
use App\Models\StaffMember;
use App\Models\StaffShiftAssignment;
use App\Models\StaffShiftTemplate;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class StaffShiftApiTest extends TestCase
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
            'device_name' => 'phpunit-staff-shifts-admin',
        ])->assertOk();

        $this->adminToken = (string) $login->json('access_token');
    }

    public function test_coordinator_can_manage_templates_and_weekly_schedule(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinatorToken] = $this->createFacilityUserWithStaffMember('coord.shifts@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-COORD-SHIFT');
        [, $educatorOne] = $this->createFacilityUserWithStaffMember('edu1.shifts@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-SHIFT-1');
        [, $educatorTwo] = $this->createFacilityUserWithStaffMember('edu2.shifts@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-SHIFT-2');

        $templateId = $this->withToken($coordinatorToken)
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'DAY',
                'name' => 'Turno giorno',
                'start_time' => '08:00',
                'end_time' => '16:00',
                'minimum_staff_required' => 2,
                'sort_order' => 10,
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('minimum_staff_required', 2)
            ->json('id');

        $this->withToken($coordinatorToken)
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $templateId,
                'staff_member_id' => $educatorOne->id,
                'shift_date' => '2026-07-13',
                'status' => 'planned',
            ])
            ->assertCreated();

        $this->withToken($coordinatorToken)
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $templateId,
                'staff_member_id' => $educatorTwo->id,
                'shift_date' => '2026-07-13',
                'status' => 'confirmed',
            ])
            ->assertCreated();

        $this->withToken($coordinatorToken)
            ->getJson("/api/admin/staff-shifts/week?facility_id={$facility->id}&week_start=2026-07-13")
            ->assertOk()
            ->assertJsonPath('facility_id', $facility->id)
            ->assertJsonPath('week_start', '2026-07-13')
            ->assertJsonPath('days.0.date', '2026-07-13')
            ->assertJsonPath('days.0.shifts.0.minimum_staff_required', 2)
            ->assertJsonPath('days.0.shifts.0.assigned_count', 2)
            ->assertJsonPath('days.0.shifts.0.coverage_gap', 0);
    }

    public function test_educator_can_read_only_own_week(): void
    {
        $facility = Facility::query()->firstOrFail();
        $template = StaffShiftTemplate::query()->create([
            'facility_id' => $facility->id,
            'code' => 'NIGHT',
            'name' => 'Turno notte',
            'start_time' => '22:00',
            'end_time' => '06:00',
            'minimum_staff_required' => 1,
            'sort_order' => 20,
            'is_active' => true,
        ]);

        [$educatorToken, $educator] = $this->createFacilityUserWithStaffMember('edu.week@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-WEEK');
        [, $otherEducator] = $this->createFacilityUserWithStaffMember('edu.other.week@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-OTHER');

        StaffShiftAssignment::query()->create([
            'facility_id' => $facility->id,
            'shift_template_id' => $template->id,
            'staff_member_id' => $educator->id,
            'shift_date' => '2026-07-14',
            'starts_at' => '2026-07-14 22:00:00',
            'ends_at' => '2026-07-15 06:00:00',
            'status' => 'planned',
        ]);

        StaffShiftAssignment::query()->create([
            'facility_id' => $facility->id,
            'shift_template_id' => $template->id,
            'staff_member_id' => $otherEducator->id,
            'shift_date' => '2026-07-15',
            'starts_at' => '2026-07-15 22:00:00',
            'ends_at' => '2026-07-16 06:00:00',
            'status' => 'planned',
        ]);

        $this->withToken($educatorToken)
            ->getJson('/api/staff-shifts/my-week?week_start=2026-07-13')
            ->assertOk()
            ->assertJsonPath('staff_member.id', $educator->id)
            ->assertJsonCount(1, 'assignments')
            ->assertJsonPath('assignments.0.staff_member_id', $educator->id);
    }

    public function test_shift_assignment_blocks_overlapping_staff_windows(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinatorToken] = $this->createFacilityUserWithStaffMember('coord.overlap@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-COORD-OVER');
        [, $educator] = $this->createFacilityUserWithStaffMember('edu.overlap@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-OVER');

        $dayTemplate = StaffShiftTemplate::query()->create([
            'facility_id' => $facility->id,
            'code' => 'DAY',
            'name' => 'Turno giorno',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'minimum_staff_required' => 1,
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $overlapTemplate = StaffShiftTemplate::query()->create([
            'facility_id' => $facility->id,
            'code' => 'MID',
            'name' => 'Turno intermedio',
            'start_time' => '12:00',
            'end_time' => '20:00',
            'minimum_staff_required' => 1,
            'sort_order' => 15,
            'is_active' => true,
        ]);

        $this->withToken($coordinatorToken)
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $dayTemplate->id,
                'staff_member_id' => $educator->id,
                'shift_date' => '2026-07-16',
                'status' => 'planned',
            ])
            ->assertCreated();

        $this->withToken($coordinatorToken)
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $overlapTemplate->id,
                'staff_member_id' => $educator->id,
                'shift_date' => '2026-07-16',
                'status' => 'planned',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['staff_member_id']);
    }

    private function createFacilityUserWithStaffMember(string $email, string $roleCode, int $facilityId, string $employeeCode): array
    {
        $admin = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $role = Role::query()->where('code', $roleCode)->firstOrFail();

        $user = User::query()->create([
            'uuid' => (string) Str::uuid(),
            'email' => $email,
            'password' => Hash::make('password'),
            'first_name' => 'Shift',
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
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $admin->id,
        ]);

        $qualificationCode = $roleCode === 'COORDINATORE' ? 'COORDINATORE' : 'EDUCATORE';

        $staffMember = StaffMember::query()->create([
            'facility_id' => $facilityId,
            'user_id' => $user->id,
            'employee_code' => $employeeCode,
            'first_name' => 'Shift',
            'last_name' => $roleCode,
            'email' => $email,
            'qualification_code' => $qualificationCode,
            'status_code' => 'ACTIVE',
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password',
            'device_name' => 'phpunit-shifts-'.$roleCode,
        ])->assertOk();

        return [(string) $login->json('access_token'), $staffMember, $user];
    }
}
