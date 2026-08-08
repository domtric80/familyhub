<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minor_activities', function (Blueprint $table): void {
            $table->foreignId('responsible_staff_member_id')->nullable()->after('activity_type_id')->constrained('staff_members')->nullOnDelete();
            $table->string('attendance_status', 20)->default('present')->after('status');
            $table->string('support_level', 20)->nullable()->after('attendance_status');
            $table->boolean('requires_transport')->default(false)->after('support_level');
            $table->text('materials_needed')->nullable()->after('requires_transport');
            $table->boolean('follow_up_required')->default(false)->after('materials_needed');
            $table->text('follow_up_notes')->nullable()->after('follow_up_required');

            $table->index(['attendance_status'], 'minor_activities_attendance_idx');
            $table->index(['support_level'], 'minor_activities_support_idx');
        });
    }

    public function down(): void
    {
        Schema::table('minor_activities', function (Blueprint $table): void {
            $table->dropIndex('minor_activities_attendance_idx');
            $table->dropIndex('minor_activities_support_idx');
            $table->dropConstrainedForeignId('responsible_staff_member_id');
            $table->dropColumn([
                'attendance_status',
                'support_level',
                'requires_transport',
                'materials_needed',
                'follow_up_required',
                'follow_up_notes',
            ]);
        });
    }
};
