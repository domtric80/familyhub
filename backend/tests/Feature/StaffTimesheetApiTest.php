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

    public function test_timesheet_export_supports_review_and_labor_consultant_presets(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator] = $this->createFacilityUserWithStaffMember('coord.timesheet.exportx@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD-EXPX');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet.exportx@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU-EXPX');

        Sanctum::actingAs($coordinator);
        $templateId = $this
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'EXP',
                'name' => 'Turno export',
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
                'shift_date' => '2026-07-26',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-26T08:00:00+02:00',
        ])->assertCreated();

        $timesheetEntryId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-26T15:30:00+02:00',
        ])->assertCreated()->json('timesheet_entry.id');

        $this->postJson("/api/staff/timesheets/{$timesheetEntryId}/submit")
            ->assertOk();

        Sanctum::actingAs($coordinator);
        $adjustmentId = $this->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments", [
            'adjustment_type' => 'manual_correction',
            'delta_minutes' => 30,
            'reason' => 'Rettifica per chiusura turno registrata in ritardo.',
        ])->assertCreated()->json('adjustments.0.id');

        $this->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments/{$adjustmentId}/approve", [
            'review_notes' => 'Approvata dopo confronto con il registro di turno.',
        ])->assertOk();

        $this->postJson("/api/admin/timesheets/{$timesheetEntryId}/approve")
            ->assertOk();

        $reviewExport = $this->get("/api/admin/timesheets/export.csv?facility_id={$facility->id}&year=2026&month=7&format=csv&preset=review");
        $reviewExport->assertOk();
        $reviewBody = $reviewExport->streamedContent();
        $this->assertStringContainsString('requested_adjustments_count;pending_adjustments_count;approved_adjustments_count;rejected_adjustments_count;approved_adjustments_minutes;adjustments_detail', $reviewBody);
        $this->assertStringContainsString('manual_correction +30min [approved]', $reviewBody);

        $consultantExport = $this->get("/api/admin/timesheets/export.csv?facility_id={$facility->id}&year=2026&month=7&format=csv&preset=labor_consultant");
        $consultantExport->assertOk();
        $consultantBody = $consultantExport->streamedContent();
        $this->assertStringContainsString('qualification;shift_template;planned_minutes;worked_minutes;break_minutes;ordinary_minutes;overtime_minutes;night_minutes;absence_minutes;variance_minutes;status;approved_adjustments_minutes;adjustments_detail', $consultantBody);
        $this->assertStringContainsString('Educatore', $consultantBody);
    }

    public function test_timesheet_pdf_export_supports_review_preset(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator] = $this->createFacilityUserWithStaffMember('coord.timesheet.pdf@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD-PDF');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet.pdf@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU-PDF');

        Sanctum::actingAs($coordinator);
        $templateId = $this
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'PDF',
                'name' => 'Turno PDF',
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
                'shift_date' => '2026-07-29',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-29T08:00:00+02:00',
        ])->assertCreated();

        $timesheetEntryId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-29T16:00:00+02:00',
        ])->assertCreated()->json('timesheet_entry.id');

        $this->postJson("/api/staff/timesheets/{$timesheetEntryId}/submit")
            ->assertOk();

        Sanctum::actingAs($coordinator);
        $this->postJson("/api/admin/timesheets/{$timesheetEntryId}/approve")
            ->assertOk();

        $response = $this->get("/api/admin/timesheets/export.pdf?facility_id={$facility->id}&year=2026&month=7&preset=review");
        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $response->assertHeader('content-disposition');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
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

    public function test_coordinator_can_list_adjustment_review_queue_and_kpis(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator] = $this->createFacilityUserWithStaffMember('coord.timesheet.queue@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD-Q');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet.queue@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU-Q');

        Sanctum::actingAs($coordinator);
        $templateId = $this
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'Q01',
                'name' => 'Turno queue',
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
                'shift_date' => '2026-07-24',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-24T08:00:00+02:00',
        ])->assertCreated();

        $timesheetEntryId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-24T15:00:00+02:00',
        ])->assertCreated()->json('timesheet_entry.id');

        Sanctum::actingAs($coordinator);
        $pendingAdjustmentId = $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments", [
                'adjustment_type' => 'manual_correction',
                'delta_minutes' => 45,
                'reason' => 'Rettifica in attesa coordinatore.',
            ])
            ->assertCreated()
            ->json('adjustments.0.id');

        $approvedAdjustmentId = $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments", [
                'adjustment_type' => 'break_correction',
                'delta_minutes' => 15,
                'reason' => 'Pausa registrata in modo incompleto.',
            ])
            ->assertCreated()
            ->json('adjustments.0.id');

        $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments/{$approvedAdjustmentId}/approve", [
                'review_notes' => 'Verifica completata con esito positivo.',
            ])
            ->assertOk();

        $rejectedAdjustmentId = $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments", [
                'adjustment_type' => 'absence_reconciliation',
                'delta_minutes' => -30,
                'reason' => 'Richiesta poi respinta.',
            ])
            ->assertCreated()
            ->json('adjustments.0.id');

        $this
            ->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments/{$rejectedAdjustmentId}/reject", [
                'review_notes' => 'Respinta dopo controllo timbrature.',
            ])
            ->assertOk();

        $this
            ->getJson("/api/admin/timesheet-adjustments?facility_id={$facility->id}&status=pending&date_from=2026-07-01&date_to=2026-07-31")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $pendingAdjustmentId)
            ->assertJsonPath('0.status', 'pending')
            ->assertJsonPath('0.timesheet_entry.id', $timesheetEntryId)
            ->assertJsonPath('0.timesheet_entry.staff_member.id', $educatorStaffMember->id)
            ->assertJsonPath('0.timesheet_entry.facility.id', $facility->id);

        $this
            ->getJson("/api/admin/timesheet-adjustments/kpis?facility_id={$facility->id}&date_from=2026-07-01&date_to=2026-07-31")
            ->assertOk()
            ->assertJsonPath('pending_count', 1)
            ->assertJsonPath('approved_count', 1)
            ->assertJsonPath('rejected_count', 1);
    }

    public function test_coordinator_can_lock_and_unlock_month_and_block_changes(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator] = $this->createFacilityUserWithStaffMember('coord.timesheet.lock@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD-LOCK');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet.lock@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU-LOCK');

        Sanctum::actingAs($coordinator);
        $templateId = $this
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'LOCK',
                'name' => 'Turno lock',
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
                'shift_date' => '2026-07-25',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-25T08:00:00+02:00',
        ])->assertCreated();

        $timesheetEntryId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-25T16:00:00+02:00',
        ])->assertCreated()->json('timesheet_entry.id');

        $this->postJson("/api/staff/timesheets/{$timesheetEntryId}/submit")
            ->assertOk()
            ->assertJsonPath('status', 'submitted');

        Sanctum::actingAs($coordinator);
        $this->postJson("/api/admin/timesheets/{$timesheetEntryId}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'approved');

        $lockId = $this->postJson('/api/admin/timesheet-month-locks', [
            'facility_id' => $facility->id,
            'year' => 2026,
            'month' => 7,
            'notes' => 'Chiusura amministrativa mese luglio.',
        ])
            ->assertCreated()
            ->assertJsonPath('entries_locked', 1)
            ->assertJsonPath('lock.is_locked', true)
            ->json('lock.id');

        $this->getJson("/api/admin/timesheet-month-locks?facility_id={$facility->id}")
            ->assertOk()
            ->assertJsonPath('0.id', $lockId)
            ->assertJsonPath('0.is_locked', true);

        $this->postJson("/api/admin/timesheets/{$timesheetEntryId}/adjustments", [
            'adjustment_type' => 'manual_correction',
            'delta_minutes' => 15,
            'reason' => 'Tentativo dopo lock.',
        ])->assertStatus(422);

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentId,
            'event_type' => 'manual_adjustment',
            'occurred_at' => '2026-07-25T16:05:00+02:00',
        ])->assertStatus(422);

        Sanctum::actingAs($coordinator);
        $this->postJson("/api/admin/timesheet-month-locks/{$lockId}/unlock")
            ->assertOk()
            ->assertJsonPath('entries_unlocked', 1)
            ->assertJsonPath('lock.is_locked', false);
    }

    public function test_coordinator_can_read_dashboard_summary(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator] = $this->createFacilityUserWithStaffMember('coord.timesheet.dashboard@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD-DB');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet.dashboard@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU-DB');

        Sanctum::actingAs($coordinator);
        $templateId = $this
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'DB1',
                'name' => 'Turno dashboard',
                'start_time' => '08:00',
                'end_time' => '16:00',
                'minimum_staff_required' => 1,
                'sort_order' => 10,
                'is_active' => true,
            ])
            ->assertCreated()
            ->json('id');

        $shiftAssignmentOne = $this
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $templateId,
                'staff_member_id' => $educatorStaffMember->id,
                'shift_date' => '2026-07-27',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        $shiftAssignmentTwo = $this
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $templateId,
                'staff_member_id' => $educatorStaffMember->id,
                'shift_date' => '2026-07-28',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentOne,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-27T08:00:00+02:00',
        ])->assertCreated();

        $entryOneId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentOne,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-27T18:00:00+02:00',
        ])->assertCreated()->json('timesheet_entry.id');

        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentTwo,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-28T08:15:00+02:00',
        ])->assertCreated();

        $entryTwoId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $shiftAssignmentTwo,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-28T15:00:00+02:00',
        ])->assertCreated()->json('timesheet_entry.id');

        $this->postJson("/api/staff/timesheets/{$entryOneId}/submit")->assertOk();
        $this->postJson("/api/staff/timesheets/{$entryTwoId}/submit")->assertOk();

        Sanctum::actingAs($coordinator);
        $approvedAdjustmentId = $this
            ->postJson("/api/admin/timesheets/{$entryOneId}/adjustments", [
                'adjustment_type' => 'absence_reconciliation',
                'delta_minutes' => -30,
                'reason' => 'Riconciliazione assenza parziale autorizzata.',
            ])
            ->assertCreated()
            ->json('adjustments.0.id');

        $this->postJson("/api/admin/timesheets/{$entryOneId}/adjustments/{$approvedAdjustmentId}/approve", [
            'review_notes' => 'Assenza verificata e riconciliata.',
        ])->assertOk();

        $this->postJson("/api/admin/timesheets/{$entryOneId}/approve")->assertOk();

        $this
            ->postJson("/api/admin/timesheets/{$entryTwoId}/adjustments", [
                'adjustment_type' => 'manual_correction',
                'delta_minutes' => 20,
                'reason' => 'Rettifica ancora in attesa di revisione.',
            ])
            ->assertCreated();

        $this
            ->getJson("/api/admin/timesheets/dashboard-summary?facility_id={$facility->id}&date_from=2026-07-01&date_to=2026-07-31")
            ->assertOk()
            ->assertJsonPath('summary.entries_total', 2)
            ->assertJsonPath('summary.submitted_entries_count', 1)
            ->assertJsonPath('summary.approved_or_locked_entries_count', 1)
            ->assertJsonPath('summary.open_anomalies_count', 1)
            ->assertJsonPath('summary.overtime_minutes_total', 90)
            ->assertJsonPath('summary.absence_reconciliations_count', 1)
            ->assertJsonPath('summary.absence_reconciled_minutes_total', -30)
            ->assertJsonPath('summary.pending_adjustments_count', 1)
            ->assertJsonPath('open_anomalies.0.id', $entryTwoId)
            ->assertJsonPath('top_overtime_entries.0.id', $entryOneId)
            ->assertJsonPath('absence_reconciliations.0.timesheet_entry_id', $entryOneId)
            ->assertJsonPath('pending_adjustments.0.timesheet_entry_id', $entryTwoId);
    }

    public function test_dashboard_summary_includes_advanced_anomalies_and_staff_facility_totals(): void
    {
        $facility = Facility::query()->firstOrFail();
        [$coordinator] = $this->createFacilityUserWithStaffMember('coord.timesheet.advanced@familyhub.local', 'COORDINATORE', $facility->id, 'STAFF-TS-COORD-ADV');
        [$educator, $educatorStaffMember] = $this->createFacilityUserWithStaffMember('edu.timesheet.advanced@familyhub.local', 'EDUCATORE', $facility->id, 'STAFF-TS-EDU-ADV');

        Sanctum::actingAs($coordinator);
        $templateId = $this
            ->postJson('/api/admin/staff-shift-templates', [
                'facility_id' => $facility->id,
                'code' => 'ADV1',
                'name' => 'Turno avanzato',
                'start_time' => '08:00',
                'end_time' => '16:00',
                'minimum_staff_required' => 1,
                'sort_order' => 10,
                'is_active' => true,
            ])
            ->assertCreated()
            ->json('id');

        $firstAssignmentId = $this
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $templateId,
                'staff_member_id' => $educatorStaffMember->id,
                'shift_date' => '2026-07-29',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        $secondAssignmentId = $this
            ->postJson('/api/admin/staff-shifts', [
                'facility_id' => $facility->id,
                'shift_template_id' => $templateId,
                'staff_member_id' => $educatorStaffMember->id,
                'shift_date' => '2026-07-30',
                'status' => 'planned',
            ])
            ->assertCreated()
            ->json('id');

        Sanctum::actingAs($educator);
        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $firstAssignmentId,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-29T08:00:00+02:00',
            'geo_latitude' => 41.902782,
            'geo_longitude' => 12.496366,
        ])->assertCreated();

        $firstEntryId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $firstAssignmentId,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-29T20:30:00+02:00',
            'geo_latitude' => 41.902782,
            'geo_longitude' => 12.496366,
        ])->assertCreated()->json('timesheet_entry.id');

        $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $secondAssignmentId,
            'event_type' => 'clock_in',
            'occurred_at' => '2026-07-30T05:30:00+02:00',
            'geo_latitude' => 41.903000,
            'geo_longitude' => 12.497000,
        ])->assertCreated();

        $secondEntryId = $this->postJson('/api/staff/attendance-events', [
            'facility_id' => $facility->id,
            'shift_assignment_id' => $secondAssignmentId,
            'event_type' => 'clock_out',
            'occurred_at' => '2026-07-30T14:00:00+02:00',
            'geo_latitude' => 41.903000,
            'geo_longitude' => 12.497000,
        ])->assertCreated()->json('timesheet_entry.id');

        Sanctum::actingAs($coordinator);

        $response = $this
            ->getJson("/api/admin/timesheets/dashboard-summary?facility_id={$facility->id}&date_from=2026-07-01&date_to=2026-07-31")
            ->assertOk()
            ->assertJsonPath('summary.entries_total', 2)
            ->assertJsonPath('summary.overtime_minutes_total', 300)
            ->assertJsonPath('summary.night_minutes_total', 30)
            ->assertJsonPath('summary.minimum_rest_violations_count', 1)
            ->assertJsonPath('summary.maximum_daily_hours_violations_count', 1)
            ->assertJsonPath('summary.staff_with_open_anomalies_count', 1)
            ->assertJsonPath('open_anomalies.0.id', $secondEntryId);

        $json = $response->json();

        $this->assertNotEmpty($json['staff_totals']);
        $this->assertSame($educatorStaffMember->id, $json['staff_totals'][0]['staff_member']['id']);
        $this->assertSame(2, $json['staff_totals'][0]['entries_total']);
        $this->assertSame(1260, $json['staff_totals'][0]['worked_minutes_total']);
        $this->assertSame(300, $json['staff_totals'][0]['overtime_minutes_total']);
        $this->assertSame(30, $json['staff_totals'][0]['night_minutes_total']);
        $this->assertSame(1, $json['staff_totals'][0]['minimum_rest_violations_count']);
        $this->assertSame(1, $json['staff_totals'][0]['maximum_daily_hours_violations_count']);

        $this->assertNotEmpty($json['facility_totals']);
        $this->assertSame($facility->id, $json['facility_totals'][0]['facility']['id']);
        $this->assertSame(2, $json['facility_totals'][0]['entries_total']);
        $this->assertSame(1260, $json['facility_totals'][0]['worked_minutes_total']);

        $detail = $this
            ->getJson("/api/admin/timesheets/{$firstEntryId}")
            ->assertOk()
            ->assertJsonPath('attendance_events.0.geo_latitude', '41.9027820')
            ->assertJsonPath('attendance_events.0.geo_longitude', '12.4963660')
            ->json();

        $this->assertContains('maximum_daily_hours_exceeded', $detail['anomaly_flags_json']);
        $this->assertContains('overtime_detected', $detail['anomaly_flags_json']);
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
                'staff_timesheet_entries.lock',
                'staff_timesheet_entries.export',
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
