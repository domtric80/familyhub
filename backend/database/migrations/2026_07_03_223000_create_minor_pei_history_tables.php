<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_pei_history_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_id')->constrained('minors')->cascadeOnDelete();
            $table->foreignId('minor_pei_id')->constrained('minor_peis')->cascadeOnDelete();
            $table->string('event_type', 100);
            $table->unsignedInteger('version_number')->default(1);
            $table->jsonb('snapshot');
            $table->jsonb('metadata')->nullable();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['minor_pei_id', 'version_number']);
            $table->index(['minor_id', 'created_at']);
            $table->index('event_type');
        });

        Schema::create('minor_pei_objective_progress_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_id')->constrained('minors')->cascadeOnDelete();
            $table->foreignId('minor_pei_id')->constrained('minor_peis')->cascadeOnDelete();
            $table->foreignId('minor_pei_objective_id')->constrained('minor_pei_objectives')->cascadeOnDelete();
            $table->unsignedTinyInteger('progress_percent');
            $table->string('status', 50)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['minor_pei_objective_id', 'created_at']);
            $table->index(['minor_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_pei_objective_progress_logs');
        Schema::dropIfExists('minor_pei_history_entries');
    }
};
