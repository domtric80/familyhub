<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minor_approaches', function (Blueprint $table): void {
            $table->string('authorization_reference', 100)->nullable()->after('location');
            $table->date('authorization_issued_at')->nullable()->after('authorization_reference');
            $table->date('authorization_expires_at')->nullable()->after('authorization_issued_at');
            $table->unsignedSmallInteger('authorization_renewal_alert_days')->default(30)->after('authorization_expires_at');
            $table->string('pre_reaction_level', 20)->nullable()->after('status');
            $table->text('pre_reaction_notes')->nullable()->after('pre_reaction_level');
            $table->string('during_reaction_level', 20)->nullable()->after('pre_reaction_notes');
            $table->text('during_reaction_notes')->nullable()->after('during_reaction_level');
            $table->string('post_reaction_level', 20)->nullable()->after('during_reaction_notes');
            $table->text('post_reaction_notes')->nullable()->after('post_reaction_level');
            $table->text('reserved_psychologist_notes')->nullable()->after('next_steps');
            $table->text('reserved_coordinator_notes')->nullable()->after('reserved_psychologist_notes');
            $table->text('suspension_reason')->nullable()->after('reserved_coordinator_notes');
            $table->dateTime('suspended_at')->nullable()->after('suspension_reason');
            $table->foreignId('suspended_by_user_id')->nullable()->after('suspended_at')->constrained('users')->nullOnDelete();
            $table->dateTime('suspension_signed_at')->nullable()->after('suspended_by_user_id');

            $table->index(['authorization_expires_at'], 'minor_approaches_auth_expires_idx');
            $table->index(['suspended_at'], 'minor_approaches_suspended_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('minor_approaches', function (Blueprint $table): void {
            $table->dropIndex('minor_approaches_auth_expires_idx');
            $table->dropIndex('minor_approaches_suspended_at_idx');
            $table->dropConstrainedForeignId('suspended_by_user_id');
            $table->dropColumn([
                'authorization_reference',
                'authorization_issued_at',
                'authorization_expires_at',
                'authorization_renewal_alert_days',
                'pre_reaction_level',
                'pre_reaction_notes',
                'during_reaction_level',
                'during_reaction_notes',
                'post_reaction_level',
                'post_reaction_notes',
                'reserved_psychologist_notes',
                'reserved_coordinator_notes',
                'suspension_reason',
                'suspended_at',
                'suspension_signed_at',
            ]);
        });
    }
};
