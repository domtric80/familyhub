<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\Permission;
use App\Models\Role;
use App\Models\StaffMember;
use App\Models\StaffShiftTemplate;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffTimesheetApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->seed(RbacSeeder::class);
        $this->syncTimesheetPermissionsForTests();
    }

    public function test_educator_can_register_attendance_and_view_own_timesheet(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator, $coordinatorStaffMember] = $this->createFacilityUserWithStaffMember('coord.timesheet@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU');

        Sanctum::actingAs($coordinator);
        $templateId = $this
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'DAY',
                'name' => 'Turno giorno',
                'start_time' => '08:00',
                'end_time' => '16:00',
                'minimum_staff_required' => 1,
                'sort_order' => 10,
                'is_active' => true,
            ])
            ->assertCreated()
            ->json('id');

        $shiftAssignmentId = $this
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $templateId,
                'staff_member_id' => $educatorStaffMember->id,
                'shift_date' => '2026-07-18',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this
            ->postJson('/api/staff/attendance-events', [
                'facility_id' => $facility->id,
                'shift_assignment_id' => $shiftAssignmentId,
                'event_type' => 'clock_in',
                'occurred_at' => '2026-07-18T08:03:00+02:00',
            ])
            ->assertCreated()
            ->assertJsonPath('timesheet_entry.status', 'draft');

        $this
            ->postJson('/api/staff/attendance-events', [
                'facility_id' => $facility->id,
                'shift_assignment_id' => $shiftAssignmentId,
                'event_type' => 'break_start',
                'occurred_at' => '2026-07-18T12:00:00+02:00',
            ])
            ->assertCreated();

        $this
            ->postJson('/api/staff/attendance-events', [
                'facility_id' => $facility->id,
                'shift_assignment_id' => $shiftAssignmentId,
                'event_type' => 'break_end',
                'occurred_at' => '2026-07-18T12:30:00+02:00',
            ])
            ->assertCreated();

        $this
            ->postJson('/api/staff/attendance-events', [
                'facility_id' => $facility->id,
                'shift_assignment_id' => $shiftAssignmentId,
                'event_type' => 'clock_out',
                'occurred_at' => '2026-07-18T16:15:00+02:00',
            ])
            ->assertCreated()
            ->assertJsonPath('timesheet_entry.status', 'computed')
            ->assertJsonPath('timesheet_entry.worked_minutes', 462)
            ->assertJsonPath('timesheet_entry.break_minutes', 30)
            ->assertJsonPath('timesheet_entry.overtime_minutes', 0)
            ->assertJsonPath('timesheet_entry.variance_minutes', -18);

        $this
            ->getJson('/api/staff/timesheets/me?date_from=2026-07-18&date_to=2026-07-18')
            ->assertOk()
            ->assertJsonPath('staff_member.id', $educatorStaffMember->id)
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.status', 'computed')
            ->assertJsonPath('items.0.planned_minutes', 480)
            ->assertJsonPath('items.0.variance_minutes', -18);
    }

    public function test_coordinator_can_list_and_read_timesheet_entries(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator] = $this->createFacilityUserWithStaffMember('coord.timesheet.list@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD-L');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet.list@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU-L');

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

        Sanctum::actingAs($coordinator);
        $shiftAssignmentId = $this
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $template->id,
                'staff_member_id' => $educatorStaffMember->id,
                'shift_date' => '2026-07-19',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-19T22:00:00+02:00',
        ])->assertCreated();

        $timesheetEntryId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-20T06:00:00+02:00',
        ])->assertCreated()->json('timesheet_entry.id');

        Sanctum::actingAs($coordinator);
        $this
            ->getJson("/api/admin/timesheets?facility_id={$facility->id}&date_from=2026-07-19&date_to=2026-07-19")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $timesheetEntryId)
            ->assertJsonPath('0.staff_member_id', $educatorStaffMember->id)
            ->assertJsonPath('0.status', 'computed');

        $this
            ->getJson("/api/admin/timesheets/{$timesheetEntryId}")
            ->assertOk()
            ->assertJsonPath('id', $timesheetEntryId)
            ->assertJsonPath('attendance_events.0.event_type', 'clock_in')
            ->assertJsonPath('attendance_events.1.event_type', 'clock_out')
            ->assertJsonPath('night_minutes', 480);
    }

    public function test_timesheet_submit_approve_reject_and_export_flow(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator] = $this->createFacilityUserWithStaffMember('coord.timesheet.flow@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD-F');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet.flow@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU-F');

        Sanctum::actingAs($coordinator);
        $templateId = $this
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'FLOW',
                'name' => 'Turno flow',
                'start_time' => '09:00',
                'end_time' => '17:00',
                'minimum_staff_required' => 1,
                'sort_order' => 10,
                'is_active' => true,
            ])
            ->assertCreated()
            ->json('id');

        $shiftAssignmentId = $this
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $templateId,
                'staff_member_id' => $educatorStaffMember->id,
                'shift_date' => '2026-07-21',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-21T09:00:00+02:00',
        ])->assertCreated();

        $timesheetEntryId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-21T17:00:00+02:00',
        ])->assertCreated()->json('timesheet_entry.id');

        $this
            ->postJson("/api/staff/timesheets/{$timesheetEntryId}/submit")
            ->assertOk()
            ->assertJsonPath('status', 'submitted')
            ->assertJsonPath('submitted_by_user_id', $educator->id);

        Sanctum::actingAs($coordinator);
        $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/reject", [
                'reason' => 'Manca verifica manuale coordinatore',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'rejected');

        Sanctum::actingAs($educator);
        $this
            ->postJson("/api/staff/timesheets/{$timesheetEntryId}/submit")
            ->assertOk()
            ->assertJsonPath('status', 'submitted');

        Sanctum::actingAs($coordinator);
        $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'approved')
            ->assertJsonPath('approved_by.id', $coordinator->id);

        $response = $this->get("/api/admin/timesheets/export.csv?facility_id={$facility->id}&year=2026&month=7&format=csv");
        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('entry_id;work_date;facility;staff_member', $response->streamedContent());
    }

    public function test_coordinator_can_add_timesheet_adjustment_with_audit_trail(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator] = $this->createFacilityUserWithStaffMember('coord.timesheet.adjust@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD-A');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet.adjust@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU-A');

        Sanctum::actingAs($coordinator);
        $templateId = $this
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'ADJ',
                'name' => 'Turno rettifica',
                'start_time' => '08:00',
                'end_time' => '16:00',
                'minimum_staff_required' => 1,
                'sort_order' => 10,
                'is_active' => true,
            ])
            ->assertCreated()
            ->json('id');

        $shiftAssignmentId = $this
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $templateId,
                'staff_member_id' => $educatorStaffMember->id,
                'shift_date' => '2026-07-22',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-22T08:00:00+02:00',
        ])->assertCreated();

        $timesheetEntryId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-22T15:30:00+02:00',
        ])->assertCreated()->json('timesheet_entry.id');

        Sanctum::actingAs($coordinator);
        $adjustmentId = $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments", [
                'adjustment_type' => 'manual_correction',
                'delta_minutes' => 30,
                'reason' => 'Autorizzata rettifica per uscita registrata in ritardo nel verbale turno.',
            ])
            ->assertCreated()
            ->assertJsonPath('id', $timesheetEntryId)
            ->assertJsonPath('worked_minutes', 450)
            ->assertJsonPath('ordinary_minutes', 450)
            ->assertJsonPath('overtime_minutes', 0)
            ->assertJsonPath('variance_minutes', -30)
            ->assertJsonPath('adjustments.0.adjustment_type', 'manual_correction')
            ->assertJsonPath('adjustments.0.delta_minutes', 30)
            ->assertJsonPath('adjustments.0.status', 'pending')
            ->json('adjustments.0.id');

        $this
            ->getJson("/api/admin/timesheets/{$timesheetEntryId}")
            ->assertOk()
            ->assertJsonPath('adjustments.0.adjustment_type', 'manual_correction')
            ->assertJsonPath('adjustments.0.delta_minutes', 30)
            ->assertJsonPath('adjustments.0.status', 'pending');

        $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments/{$adjustmentId}/approve", [
                'review_notes' => 'Rettifica coerente con verbale coordinatore.',
            ])
            ->assertOk()
            ->assertJsonPath('worked_minutes', 480)
            ->assertJsonPath('ordinary_minutes', 480)
            ->assertJsonPath('variance_minutes', 0)
            ->assertJsonPath('adjustments.0.status', 'approved');
    }

    public function test_coordinator_can_reject_pending_timesheet_adjustment(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator] = $this->createFacilityUserWithStaffMember('coord.timesheet.adjust.reject@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD-R');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet.adjust.reject@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU-R');

        Sanctum::actingAs($coordinator);
        $templateId = $this
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'ADJR',
                'name' => 'Turno rettifica reject',
                'start_time' => '08:00',
                'end_time' => '16:00',
                'minimum_staff_required' => 1,
                'sort_order' => 10,
                'is_active' => true,
            ])
            ->assertCreated()
            ->json('id');

        $shiftAssignmentId = $this
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $templateId,
                'staff_member_id' => $educatorStaffMember->id,
                'shift_date' => '2026-07-23',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-23T08:00:00+02:00',
        ])->assertCreated();

        $timesheetEntryId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-23T16:00:00+02:00',
        ])->assertCreated()->json('timesheet_entry.id');

        Sanctum::actingAs($coordinator);
        $adjustmentId = $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments", [
                'adjustment_type' => 'absence_reconciliation',
                'delta_minutes' => -60,
                'reason' => 'Richiesta errata: non risultano assenze aggiuntive.',
            ])
            ->assertCreated()
            ->assertJsonPath('adjustments.0.status', 'pending')
            ->json('adjustments.0.id');

        $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments/{$adjustmentId}/reject", [
                'review_notes' => 'Rigettata dopo verifica con timbrature originali.',
            ])
            ->assertOk()
            ->assertJsonPath('worked_minutes', 480)
            ->assertJsonPath('variance_minutes', 0)
            ->assertJsonPath('adjustments.0.status', 'rejected');
    }

    private function createFacilityUserWithStaffMember(string $email, string $roleCode, int $facilityId, string $employeeCode): array
    {
        $admin = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $role = Role::query()->where('code', $roleCode)->firstOrFail();

        $user = User::query()->create([
            'uuid' => (string) Str::uuid(),
            'email' => $email,
            'password' => Hash::make('password'),
            'first_name' => 'Timesheet',
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

        $qualificationCode = $roleCode === 'COORDINATORE' ? 'COORDINATORE' : 'EDUCATORE';

        $staffMember = StaffMember::query()->create([
            'facility_id' => $facilityId,
            'user_id' => $user->id,
            'employee_code' => $employeeCode,
            'first_name' => 'Timesheet',
            'last_name' => $roleCode,
            'email' => $email,
            'qualification_code' => $qualificationCode,
            'status_code' => 'ACTIVE',
        ]);

        return [$user, $staffMember];
    }

    private function syncTimesheetPermissionsForTests(): void
    {
        $rolePermissions = [
            'EDUCATORE' => [
                'staff_attendance_events.create',
                'staff_attendance_events.read',
                'staff_attendance_events.update',
                'staff_timesheet_entries.read',
                'staff_timesheet_entries.submit',
                'staff_timesheet_adjustments.create',
                'staff_timesheet_adjustments.read',
            ],
            'COORDINATORE' => [
                'staff_timesheet_entries.read',
                'staff_timesheet_adjustments.create',
                'staff_timesheet_adjustments.read',
                'staff_timesheet_adjustments.approve',
            ],
        ];

        foreach ($rolePermissions as $roleCode => $permissionCodes) {
            $role = Role::query()->where('code', $roleCode)->first();
            if (! $role) {
                continue;
            }

            $permissionIds = Permission::query()
                ->whereIn('code', $permissionCodes)
                ->pluck('id')
                ->all();

            $role->permissions()->syncWithoutDetaching($permissionIds);
        }
    }
}
