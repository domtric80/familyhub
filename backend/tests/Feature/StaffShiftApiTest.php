<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\Role;
use App\Models\StaffMember;
use App\Models\StaffShiftAssignment;
use App\Models\StaffShiftSubstitution;
use App\Models\StaffShiftTemplate;
use App\Models\StaffTimesheetEntry;
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

    public function test_week_view_exposes_actual_shift_summary_and_anomalies(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinatorToken] = $this->createFacilityUserWithStaffMember('coord.actual@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-COORD-ACTUAL');
        [$educatorToken, $educator] = $this->createFacilityUserWithStaffMember('edu.actual@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-ACTUAL');

        $template = StaffShiftTemplate::query()->create([
            'facility_id' => $facility->id,
            'code' => 'DAY-ACTUAL',
            'name' => 'Turno giorno actual',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'minimum_staff_required' => 1,
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $assignmentId = $this->withToken($coordinatorToken)
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $template->id,
                'staff_member_id' => $educator->id,
                'shift_date' => '2026-07-13',
                'status' => 'confirmed',
            ])
            ->assertCreated()
            ->json('id');

        StaffTimesheetEntry::query()->create([
            'facility_id' => $facility->id,
            'staff_member_id' => $educator->id,
            'shift_assignment_id' => $assignmentId,
            'work_date' => '2026-07-13',
            'planned_starts_at' => '2026-07-13 08:00:00',
            'planned_ends_at' => '2026-07-13 16:00:00',
            'actual_starts_at' => '2026-07-13 08:15:00',
            'actual_ends_at' => '2026-07-13 16:20:00',
            'planned_minutes' => 480,
            'worked_minutes' => 485,
            'break_minutes' => 0,
            'ordinary_minutes' => 480,
            'overtime_minutes' => 5,
            'night_minutes' => 0,
            'absence_minutes' => 0,
            'variance_minutes' => 5,
            'status' => 'computed',
            'anomaly_flags_json' => ['late_clock_in'],
        ]);

        $this->withToken($coordinatorToken)
            ->getJson("/api/admin/staff-shifts/week?facility_id={$facility->id}&week_start=2026-07-13")
            ->assertOk()
            ->assertJsonPath('days.0.shifts.0.actual_started_count', 1)
            ->assertJsonPath('days.0.shifts.0.actual_completed_count', 1)
            ->assertJsonPath('days.0.shifts.0.actual_coverage_gap', 0)
            ->assertJsonPath('days.0.shifts.0.anomaly_count', 1)
            ->assertJsonPath('days.0.shifts.0.assignments.0.actual.started', true)
            ->assertJsonPath('days.0.shifts.0.assignments.0.actual.completed', true)
            ->assertJsonPath('days.0.shifts.0.assignments.0.actual.status', 'computed')
            ->assertJsonPath('days.0.shifts.0.assignments.0.actual.has_anomaly', true)
            ->assertJsonPath('days.0.shifts.0.assignments.0.actual.anomaly_flags.0', 'late_clock_in');

        // Nota: la vista my-week resta coperta dal test dedicato `test_educator_can_read_only_own_week`.
        // Il presente scenario verifica il nuovo contratto planned vs actual sul planner coordinatore.
    }

    public function test_coordinator_can_read_monthly_schedule_with_daily_summaries(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinatorToken] = $this->createFacilityUserWithStaffMember('coord.month@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-COORD-MONTH');
        [, $educatorOne] = $this->createFacilityUserWithStaffMember('edu1.month@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-MONTH-1');
        [, $educatorTwo] = $this->createFacilityUserWithStaffMember('edu2.month@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-MONTH-2');

        $template = StaffShiftTemplate::query()->create([
            'facility_id' => $facility->id,
            'code' => 'DAY-MONTH',
            'name' => 'Turno giorno mensile',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'minimum_staff_required' => 2,
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $firstAssignmentId = $this->withToken($coordinatorToken)
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $template->id,
                'staff_member_id' => $educatorOne->id,
                'shift_date' => '2026-08-10',
                'status' => 'confirmed',
            ])
            ->assertCreated()
            ->json('id');

        $this->withToken($coordinatorToken)
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $template->id,
                'staff_member_id' => $educatorTwo->id,
                'shift_date' => '2026-08-10',
                'status' => 'planned',
            ])
            ->assertCreated();

        StaffTimesheetEntry::query()->create([
            'facility_id' => $facility->id,
            'staff_member_id' => $educatorOne->id,
            'shift_assignment_id' => $firstAssignmentId,
            'work_date' => '2026-08-10',
            'planned_starts_at' => '2026-08-10 08:00:00',
            'planned_ends_at' => '2026-08-10 16:00:00',
            'actual_starts_at' => '2026-08-10 08:07:00',
            'actual_ends_at' => '2026-08-10 16:05:00',
            'planned_minutes' => 480,
            'worked_minutes' => 478,
            'break_minutes' => 0,
            'ordinary_minutes' => 478,
            'overtime_minutes' => 0,
            'night_minutes' => 0,
            'absence_minutes' => 0,
            'variance_minutes' => -2,
            'status' => 'computed',
            'anomaly_flags_json' => ['late_clock_in'],
        ]);

        $this->withToken($coordinatorToken)
            ->getJson("/api/admin/staff-shifts/month?facility_id={$facility->id}&year=2026&month=8")
            ->assertOk()
            ->assertJsonPath('facility_id', $facility->id)
            ->assertJsonPath('year', 2026)
            ->assertJsonPath('month', 8)
            ->assertJsonPath('month_start', '2026-08-01')
            ->assertJsonPath('month_end', '2026-08-31')
            ->assertJsonPath('summary.days_in_month', 31)
            ->assertJsonPath('summary.total_assignments', 2)
            ->assertJsonPath('summary.confirmed_assignments_count', 1)
            ->assertJsonPath('summary.planned_assignments_count', 1)
            ->assertJsonPath('days.9.date', '2026-08-10')
            ->assertJsonPath('days.9.shifts.0.minimum_staff_required', 2)
            ->assertJsonPath('days.9.shifts.0.assigned_count', 2)
            ->assertJsonPath('days.9.shifts.0.coverage_gap', 0)
            ->assertJsonPath('days.9.shifts.0.actual_completed_count', 1)
            ->assertJsonPath('days.9.shifts.0.actual_coverage_gap', 1)
            ->assertJsonPath('days.9.shifts.0.anomaly_count', 1)
            ->assertJsonPath('days.9.summary.assigned_count_total', 2)
            ->assertJsonPath('days.9.summary.actual_completed_count_total', 1)
            ->assertJsonPath('days.9.summary.anomaly_count', 1);
    }

    public function test_educator_can_read_only_own_month(): void
    {
        $facility = Facility::query()->firstOrFail();
        $template = StaffShiftTemplate::query()->create([
            'facility_id' => $facility->id,
            'code' => 'DAY-MYMONTH',
            'name' => 'Turno giorno personale',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'minimum_staff_required' => 1,
            'sort_order' => 10,
            'is_active' => true,
        ]);

        [$educatorToken, $educator] = $this->createFacilityUserWithStaffMember('edu.mymonth@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-MYMONTH');
        [, $otherEducator] = $this->createFacilityUserWithStaffMember('edu.other.mymonth@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-OTHER-MYMONTH');

        $assignmentId = StaffShiftAssignment::query()->create([
            'facility_id' => $facility->id,
            'shift_template_id' => $template->id,
            'staff_member_id' => $educator->id,
            'shift_date' => '2026-08-12',
            'starts_at' => '2026-08-12 08:00:00',
            'ends_at' => '2026-08-12 16:00:00',
            'status' => 'confirmed',
        ])->id;

        StaffShiftAssignment::query()->create([
            'facility_id' => $facility->id,
            'shift_template_id' => $template->id,
            'staff_member_id' => $otherEducator->id,
            'shift_date' => '2026-08-13',
            'starts_at' => '2026-08-13 08:00:00',
            'ends_at' => '2026-08-13 16:00:00',
            'status' => 'planned',
        ]);

        StaffTimesheetEntry::query()->create([
            'facility_id' => $facility->id,
            'staff_member_id' => $educator->id,
            'shift_assignment_id' => $assignmentId,
            'work_date' => '2026-08-12',
            'planned_starts_at' => '2026-08-12 08:00:00',
            'planned_ends_at' => '2026-08-12 16:00:00',
            'actual_starts_at' => '2026-08-12 08:00:00',
            'actual_ends_at' => '2026-08-12 16:30:00',
            'planned_minutes' => 480,
            'worked_minutes' => 510,
            'break_minutes' => 0,
            'ordinary_minutes' => 480,
            'overtime_minutes' => 30,
            'night_minutes' => 0,
            'absence_minutes' => 0,
            'variance_minutes' => 30,
            'status' => 'computed',
            'anomaly_flags_json' => ['overtime_detected'],
        ]);

        $this->withToken($educatorToken)
            ->getJson('/api/staff-shifts/my-month?year=2026&month=8')
            ->assertOk()
            ->assertJsonPath('staff_member.id', $educator->id)
            ->assertJsonPath('year', 2026)
            ->assertJsonPath('month', 8)
            ->assertJsonPath('summary.total_assignments', 1)
            ->assertJsonPath('summary.days_with_assignments_count', 1)
            ->assertJsonPath('summary.days_with_anomalies_count', 1)
            ->assertJsonPath('summary.planned_minutes_total', 480)
            ->assertJsonPath('summary.worked_minutes_total', 510)
            ->assertJsonPath('days.11.date', '2026-08-12')
            ->assertJsonPath('days.11.summary.assigned_count', 1)
            ->assertJsonPath('days.11.summary.completed_count', 1)
            ->assertJsonPath('days.11.summary.anomaly_count', 1)
            ->assertJsonPath('days.11.assignments.0.staff_member_id', $educator->id)
            ->assertJsonMissingPath('days.12.assignments.0.staff_member_id', $otherEducator->id);
    }

    public function test_coordinator_can_create_substitution_and_views_expose_effective_staff_member(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinatorToken] = $this->createFacilityUserWithStaffMember('coord.substitution@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-COORD-SUB');
        [, $originalStaff, $originalUser] = $this->createFacilityUserWithStaffMember('edu.original.sub@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-ORIGINAL');
        [, $replacementStaff, $replacementUser] = $this->createFacilityUserWithStaffMember('edu.replacement.sub@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-REPLACEMENT');

        $template = StaffShiftTemplate::query()->create([
            'facility_id' => $facility->id,
            'code' => 'DAY-SUB',
            'name' => 'Turno sostituzione',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'minimum_staff_required' => 1,
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $assignmentId = $this->withToken($coordinatorToken)
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $template->id,
                'staff_member_id' => $originalStaff->id,
                'shift_date' => '2026-08-18',
                'status' => 'confirmed',
            ])
            ->assertCreated()
            ->json('id');

        $this->withToken($coordinatorToken)
            ->postJson("/api/admin/staff-shifts/{$assignmentId}/substitutions", [
                'replacement_staff_member_id' => $replacementStaff->id,
                'reason_code' => 'illness',
                'reason_notes' => 'Sostituzione per malattia improvvisa.',
            ])
            ->assertCreated()
            ->assertJsonPath('shift_assignment_id', $assignmentId)
            ->assertJsonPath('status', StaffShiftSubstitution::STATUS_ACTIVE)
            ->assertJsonPath('replacement_staff_member_id', $replacementStaff->id);

        $this->withToken($coordinatorToken)
            ->getJson("/api/admin/staff-shifts/week?facility_id={$facility->id}&week_start=2026-08-17")
            ->assertOk()
            ->assertJsonPath('days.1.shifts.0.assignments.0.staff_member_id', $originalStaff->id)
            ->assertJsonPath('days.1.shifts.0.assignments.0.has_active_substitution', true)
            ->assertJsonPath('days.1.shifts.0.assignments.0.effective_staff_member.id', $replacementStaff->id)
            ->assertJsonPath('days.1.shifts.0.assignments.0.active_substitution.reason_code', 'illness');

        $this->actingAs($replacementUser, 'sanctum')
            ->getJson('/api/staff-shifts/my-week?week_start=2026-08-17')
            ->assertOk()
            ->assertJsonCount(1, 'assignments')
            ->assertJsonPath('assignments.0.id', $assignmentId)
            ->assertJsonPath('assignments.0.effective_staff_member.id', $replacementStaff->id);

        $this->actingAs($originalUser, 'sanctum')
            ->getJson('/api/staff-shifts/my-week?week_start=2026-08-17')
            ->assertOk()
            ->assertJsonCount(0, 'assignments');
    }

    public function test_replacement_staff_can_clock_in_on_substituted_shift_assignment(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinatorToken] = $this->createFacilityUserWithStaffMember('coord.sub.attendance@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-COORD-SUB-ATT');
        [, $originalStaff] = $this->createFacilityUserWithStaffMember('edu.original.att@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-ORIG-ATT');
        [, $replacementStaff, $replacementUser] = $this->createFacilityUserWithStaffMember('edu.replacement.att@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-REP-ATT');

        $template = StaffShiftTemplate::query()->create([
            'facility_id' => $facility->id,
            'code' => 'DAY-SUB-ATT',
            'name' => 'Turno sostituzione attendance',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'minimum_staff_required' => 1,
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $assignmentId = $this->withToken($coordinatorToken)
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $template->id,
                'staff_member_id' => $originalStaff->id,
                'shift_date' => '2026-08-19',
                'status' => 'confirmed',
            ])
            ->assertCreated()
            ->json('id');

        $this->withToken($coordinatorToken)
            ->postJson("/api/admin/staff-shifts/{$assignmentId}/substitutions", [
                'replacement_staff_member_id' => $replacementStaff->id,
                'reason_code' => 'coverage',
            ])
            ->assertCreated();

        $this->assertTrue($replacementUser->hasPermission('staff_attendance_events.create'));

        $this->actingAs($replacementUser, 'sanctum')
            ->postJson('/api/staff/attendance-events', [
                'facility_id' => $facility->id,
                'shift_assignment_id' => $assignmentId,
                'event_type' => 'clock_in',
                'occurred_at' => '2026-08-19T08:03:00+02:00',
                'source_type' => 'web',
            ])
            ->assertCreated()
            ->assertJsonPath('event.shift_assignment_id', $assignmentId)
            ->assertJsonPath('timesheet_entry.staff_member_id', $replacementStaff->id)
            ->assertJsonPath('timesheet_entry.shift_assignment_id', $assignmentId);
    }

    public function test_educator_can_close_and_sign_own_shift_from_shift_endpoint(): void
    {
        $facility = Facility::query()->firstOrFail();
        [, $educatorStaff, $educatorUser] = $this->createFacilityUserWithStaffMember('edu.sign.shift@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-SIGN');

        $template = StaffShiftTemplate::query()->create([
            'facility_id' => $facility->id,
            'code' => 'DAY-SIGN',
            'name' => 'Turno firma',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'minimum_staff_required' => 1,
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $assignment = StaffShiftAssignment::query()->create([
            'facility_id' => $facility->id,
            'shift_template_id' => $template->id,
            'staff_member_id' => $educatorStaff->id,
            'shift_date' => '2026-08-20',
            'starts_at' => '2026-08-20 08:00:00',
            'ends_at' => '2026-08-20 16:00:00',
            'status' => 'confirmed',
        ]);

        StaffTimesheetEntry::query()->create([
            'facility_id' => $facility->id,
            'staff_member_id' => $educatorStaff->id,
            'shift_assignment_id' => $assignment->id,
            'work_date' => '2026-08-20',
            'planned_starts_at' => '2026-08-20 08:00:00',
            'planned_ends_at' => '2026-08-20 16:00:00',
            'actual_starts_at' => '2026-08-20 08:01:00',
            'actual_ends_at' => '2026-08-20 16:04:00',
            'planned_minutes' => 480,
            'worked_minutes' => 483,
            'break_minutes' => 0,
            'ordinary_minutes' => 480,
            'overtime_minutes' => 3,
            'night_minutes' => 0,
            'absence_minutes' => 0,
            'variance_minutes' => 3,
            'status' => 'computed',
            'anomaly_flags_json' => [],
        ]);

        $this->actingAs($educatorUser, 'sanctum')
            ->postJson("/api/staff-shifts/{$assignment->id}/submit", [
                'notes' => 'Turno chiuso regolarmente e consegne completate.',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Turno chiuso e firmato con successo.')
            ->assertJsonPath('timesheet_entry.status', 'submitted')
            ->assertJsonPath('timesheet_entry.submitted_by_user_id', $educatorUser->id)
            ->assertJsonPath('assignment.operational.state', 'signed')
            ->assertJsonPath('assignment.operational.can_submit', false);
    }

    public function test_coordinator_can_read_shift_exceptions_dashboard(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinatorToken] = $this->createFacilityUserWithStaffMember('coord.exceptions@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-COORD-EXC');
        [, $educator] = $this->createFacilityUserWithStaffMember('edu.exceptions@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-EDU-EXC');

        $template = StaffShiftTemplate::query()->create([
            'facility_id' => $facility->id,
            'code' => 'DAY-EXC',
            'name' => 'Turno eccezioni',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'minimum_staff_required' => 2,
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $assignment = StaffShiftAssignment::query()->create([
            'facility_id' => $facility->id,
            'shift_template_id' => $template->id,
            'staff_member_id' => $educator->id,
            'shift_date' => '2026-08-21',
            'starts_at' => '2026-08-21 08:00:00',
            'ends_at' => '2026-08-21 16:00:00',
            'status' => 'confirmed',
        ]);

        StaffTimesheetEntry::query()->create([
            'facility_id' => $facility->id,
            'staff_member_id' => $educator->id,
            'shift_assignment_id' => $assignment->id,
            'work_date' => '2026-08-21',
            'planned_starts_at' => '2026-08-21 08:00:00',
            'planned_ends_at' => '2026-08-21 16:00:00',
            'actual_starts_at' => '2026-08-21 08:25:00',
            'actual_ends_at' => null,
            'planned_minutes' => 480,
            'worked_minutes' => 0,
            'break_minutes' => 0,
            'ordinary_minutes' => 0,
            'overtime_minutes' => 0,
            'night_minutes' => 0,
            'absence_minutes' => 480,
            'variance_minutes' => -480,
            'status' => 'draft',
            'anomaly_flags_json' => ['late_clock_in', 'missing_clock_out'],
        ]);

        $response = $this->withToken($coordinatorToken)
            ->getJson("/api/admin/staff-shifts/exceptions?facility_id={$facility->id}&date_from=2026-08-21&date_to=2026-08-21")
            ->assertOk()
            ->assertJsonPath('summary.planned_gap_count', 1)
            ->assertJsonPath('summary.actual_gap_count', 1);

        $types = collect($response->json('items'))->pluck('type')->all();
        $this->assertContains('planned_gap', $types);
        $this->assertContains('actual_gap', $types);
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
