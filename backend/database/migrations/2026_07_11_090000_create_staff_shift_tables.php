<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_shift_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained('facilities')->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name', 100);
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('minimum_staff_required')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['facility_id', 'code']);
            $table->index(['facility_id', 'is_active', 'sort_order'], 'staff_shift_templates_facility_active_idx');
        });

        Schema::create('staff_shift_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained('facilities')->cascadeOnDelete();
            $table->foreignId('shift_template_id')->constrained('staff_shift_templates')->cascadeOnDelete();
            $table->foreignId('staff_member_id')->constrained('staff_members')->cascadeOnDelete();
            $table->date('shift_date');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('status', 30)->default('planned');
            $table->text('notes')->nullable();
            $table->foreignId('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['staff_member_id', 'starts_at'], 'staff_shift_assignments_staff_start_unique');
            $table->index(['facility_id', 'shift_date'], 'staff_shift_assignments_facility_date_idx');
            $table->index(['staff_member_id', 'starts_at', 'ends_at'], 'staff_shift_assignments_staff_window_idx');
            $table->index(['shift_template_id', 'shift_date'], 'staff_shift_assignments_template_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_shift_assignments');
        Schema::dropIfExists('staff_shift_templates');
    }
};
