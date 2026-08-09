<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_timesheet_adjustments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('timesheet_entry_id')->constrained('staff_timesheet_entries')->cascadeOnDelete();
            $table->string('adjustment_type', 50);
            $table->integer('delta_minutes');
            $table->text('reason');
            $table->string('status', 20)->default('approved');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();

            $table->index(['timesheet_entry_id', 'status'], 'staff_timesheet_adjustments_entry_status_idx');
            $table->index(['adjustment_type', 'status'], 'staff_timesheet_adjustments_type_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_timesheet_adjustments');
    }
};
