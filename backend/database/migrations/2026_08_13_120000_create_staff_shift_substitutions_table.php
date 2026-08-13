<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_shift_substitutions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shift_assignment_id')->constrained('staff_shift_assignments')->cascadeOnDelete();
            $table->foreignId('original_staff_member_id')->constrained('staff_members')->cascadeOnDelete();
            $table->foreignId('replacement_staff_member_id')->constrained('staff_members')->cascadeOnDelete();
            $table->string('reason_code', 50);
            $table->text('reason_notes')->nullable();
            $table->timestamp('effective_starts_at')->nullable();
            $table->timestamp('effective_ends_at')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cancelled_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['shift_assignment_id', 'status']);
            $table->index(['replacement_staff_member_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_shift_substitutions');
    }
};
