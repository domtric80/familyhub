<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_journal_shifts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->dateTime('started_at');
            $table->dateTime('ended_at')->nullable();
            $table->string('title', 150)->nullable();
            $table->text('closing_notes')->nullable();
            $table->foreignId('opened_by_user_id')->constrained('users')->restrictOnDelete();
            $table->dateTime('closed_at')->nullable();
            $table->foreignId('closed_by_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('closure_signature_type', 40)->nullable();
            $table->timestamps();

            $table->index(['facility_id', 'started_at']);
            $table->index(['facility_id', 'closed_at']);
        });

        Schema::table('minor_journal_entries', function (Blueprint $table): void {
            $table->foreignId('minor_journal_shift_id')
                ->nullable()
                ->after('facility_id')
                ->constrained('minor_journal_shifts')
                ->nullOnDelete();
            $table->index(['minor_journal_shift_id', 'observed_at'], 'minor_journal_entries_shift_observed_idx');
        });

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("CREATE INDEX minor_journal_entries_search_idx ON minor_journal_entries USING GIN (to_tsvector('italian', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(nutrition_summary, '') || ' ' || coalesce(hygiene_summary, '') || ' ' || coalesce(sleep_summary, '') || ' ' || coalesce(follow_up_notes, '') || ' ' || coalesce(handover_notes, '')))");
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS minor_journal_entries_search_idx');
        }

        Schema::table('minor_journal_entries', function (Blueprint $table): void {
            $table->dropIndex('minor_journal_entries_shift_observed_idx');
            $table->dropConstrainedForeignId('minor_journal_shift_id');
        });

        Schema::dropIfExists('minor_journal_shifts');
    }
};
