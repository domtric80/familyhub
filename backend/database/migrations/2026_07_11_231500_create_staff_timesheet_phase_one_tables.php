<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_attendance_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained('facilities')->cascadeOnDelete();
            $table->foreignId('staff_member_id')->constrained('staff_members')->cascadeOnDelete();
            $table->foreignId('shift_assignment_id')->nullable()->constrained('staff_shift_assignments')->nullOnDelete();
            $table->string('event_type', 30);
            $table->date('work_date');
            $table->dateTime('occurred_at');
            $table->string('source_type', 20)->default('web');
            $table->decimal('geo_latitude', 10, 7)->nullable();
            $table->decimal('geo_longitude', 10, 7)->nullable();
            $table->unsignedInteger('geo_accuracy_meters')->nullable();
            $table->string('device_fingerprint', 191)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('superseded_by_event_id')->nullable()->constrained('staff_attendance_events')->nullOnDelete();
            $table->timestamps();

            $table->index(['staff_member_id', 'work_date', 'occurred_at'], 'staff_attendance_events_staff_work_idx');
            $table->index(['facility_id', 'work_date'], 'staff_attendance_events_facility_work_idx');
            $table->index(['shift_assignment_id', 'occurred_at'], 'staff_attendance_events_assignment_idx');
        });

        Schema::create('staff_timesheet_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained('facilities')->cascadeOnDelete();
            $table->foreignId('staff_member_id')->constrained('staff_members')->cascadeOnDelete();
            $table->foreignId('shift_assignment_id')->nullable()->constrained('staff_shift_assignments')->nullOnDelete();
            $table->date('work_date');
            $table->dateTime('planned_starts_at')->nullable();
            $table->dateTime('planned_ends_at')->nullable();
            $table->dateTime('actual_starts_at')->nullable();
            $table->dateTime('actual_ends_at')->nullable();
            $table->unsignedInteger('planned_minutes')->default(0);
            $table->unsignedInteger('worked_minutes')->default(0);
            $table->unsignedInteger('break_minutes')->default(0);
            $table->unsignedInteger('ordinary_minutes')->default(0);
            $table->unsignedInteger('overtime_minutes')->default(0);
            $table->unsignedInteger('night_minutes')->default(0);
            $table->unsignedInteger('absence_minutes')->default(0);
            $table->integer('variance_minutes')->default(0);
            $table->string('status', 20)->default('draft');
            $table->json('anomaly_flags_json')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('locked_at')->nullable();
            $table->timestamps();

            $table->index(['staff_member_id', 'work_date'], 'staff_timesheet_entries_staff_work_idx');
            $table->index(['facility_id', 'work_date'], 'staff_timesheet_entries_facility_work_idx');
            $table->index(['status', 'work_date'], 'staff_timesheet_entries_status_work_idx');
            $table->index(['shift_assignment_id', 'work_date'], 'staff_timesheet_entries_assignment_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_timesheet_entries');
        Schema::dropIfExists('staff_attendance_events');
    }
};
