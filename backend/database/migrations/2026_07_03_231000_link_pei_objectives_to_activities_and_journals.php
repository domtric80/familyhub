<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minor_activities', function (Blueprint $table): void {
            $table->foreignId('pei_objective_id')->nullable()->after('pei_objective_ref')->constrained('minor_pei_objectives')->nullOnDelete();
        });

        Schema::table('minor_journal_entries', function (Blueprint $table): void {
            $table->foreignId('pei_objective_id')->nullable()->after('sleep_summary')->constrained('minor_pei_objectives')->nullOnDelete();
        });

        Schema::table('minor_pei_objective_progress_logs', function (Blueprint $table): void {
            $table->string('source_type', 50)->nullable()->after('notes');
            $table->string('source_id', 50)->nullable()->after('source_type');
            $table->string('source_label', 255)->nullable()->after('source_id');
        });

        $objectiveMap = DB::table('minor_pei_objectives')
            ->whereNotNull('code')
            ->pluck('id', 'code');

        DB::table('minor_activities')
            ->whereNull('pei_objective_id')
            ->whereNotNull('pei_objective_ref')
            ->orderBy('id')
            ->chunkById(100, function ($rows) use ($objectiveMap): void {
                foreach ($rows as $row) {
                    $objectiveId = $objectiveMap[$row->pei_objective_ref] ?? null;

                    if ($objectiveId) {
                        DB::table('minor_activities')->where('id', $row->id)->update(['pei_objective_id' => $objectiveId]);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::table('minor_pei_objective_progress_logs', function (Blueprint $table): void {
            $table->dropColumn(['source_type', 'source_id', 'source_label']);
        });

        Schema::table('minor_journal_entries', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('pei_objective_id');
        });

        Schema::table('minor_activities', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('pei_objective_id');
        });
    }
};
