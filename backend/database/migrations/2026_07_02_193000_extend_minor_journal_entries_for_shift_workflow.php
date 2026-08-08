<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minor_journal_entries', function (Blueprint $table): void {
            $table->string('priority_level', 20)->default('green')->after('content');
            $table->string('mood_level', 20)->nullable()->after('priority_level');
            $table->text('nutrition_summary')->nullable()->after('mood_level');
            $table->text('hygiene_summary')->nullable()->after('nutrition_summary');
            $table->text('sleep_summary')->nullable()->after('hygiene_summary');
            $table->boolean('handover_required')->default(false)->after('follow_up_notes');
            $table->text('handover_notes')->nullable()->after('handover_required');
            $table->dateTime('handover_read_at')->nullable()->after('handover_notes');
            $table->foreignId('handover_read_by_user_id')->nullable()->after('handover_read_at')->constrained('users')->nullOnDelete();

            $table->index(['priority_level'], 'minor_journal_entries_priority_idx');
            $table->index(['mood_level'], 'minor_journal_entries_mood_idx');
            $table->index(['handover_required'], 'minor_journal_entries_handover_required_idx');
        });
    }

    public function down(): void
    {
        Schema::table('minor_journal_entries', function (Blueprint $table): void {
            $table->dropIndex('minor_journal_entries_priority_idx');
            $table->dropIndex('minor_journal_entries_mood_idx');
            $table->dropIndex('minor_journal_entries_handover_required_idx');
            $table->dropConstrainedForeignId('handover_read_by_user_id');
            $table->dropColumn([
                'priority_level',
                'mood_level',
                'nutrition_summary',
                'hygiene_summary',
                'sleep_summary',
                'handover_required',
                'handover_notes',
                'handover_read_at',
            ]);
        });
    }
};
