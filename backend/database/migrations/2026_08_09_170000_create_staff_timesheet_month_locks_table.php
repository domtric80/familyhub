<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_timesheet_month_locks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained('facilities')->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->timestamp('locked_at')->nullable();
            $table->foreignId('locked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('unlocked_at')->nullable();
            $table->foreignId('unlocked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['facility_id', 'year', 'month'], 'staff_timesheet_month_locks_facility_period_unique');
            $table->index(['facility_id', 'locked_at'], 'staff_timesheet_month_locks_facility_locked_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_timesheet_month_locks');
    }
};
