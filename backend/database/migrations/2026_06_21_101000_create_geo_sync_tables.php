<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geo_source_files', function (Blueprint $table) {
            $table->id();
            $table->string('source_system', 50);
            $table->string('source_domain', 255)->nullable();
            $table->string('dataset_code', 100);
            $table->string('dataset_name', 150);
            $table->string('dataset_version', 100)->nullable();
            $table->text('source_url')->nullable();
            $table->string('storage_disk', 50);
            $table->string('storage_path', 500);
            $table->string('file_name', 255);
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('file_size_bytes')->default(0);
            $table->string('sha256', 64);
            $table->timestamp('downloaded_at');
            $table->timestamp('published_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['source_system', 'dataset_code', 'sha256'], 'geo_source_files_unique_hash');
        });

        Schema::create('geo_import_runs', function (Blueprint $table) {
            $table->id();
            $table->uuid('run_uuid')->unique();
            $table->string('trigger_mode', 30);
            $table->string('scope', 50);
            $table->string('status', 50);
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('source_file_count')->default(0);
            $table->unsignedInteger('raw_record_count')->default(0);
            $table->unsignedInteger('normalized_record_count')->default(0);
            $table->unsignedInteger('published_record_count')->default(0);
            $table->unsignedInteger('issue_count')->default(0);
            $table->unsignedInteger('error_count')->default(0);
            $table->json('summary_json')->nullable();
            $table->foreignId('initiated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('geo_import_run_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('geo_import_run_id')->constrained('geo_import_runs')->cascadeOnDelete();
            $table->string('step_code', 50);
            $table->string('status', 50);
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('records_in')->default(0);
            $table->unsignedInteger('records_out')->default(0);
            $table->text('message')->nullable();
            $table->json('metrics_json')->nullable();
            $table->timestamps();
        });

        Schema::create('geo_import_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('geo_import_run_id')->constrained('geo_import_runs')->cascadeOnDelete();
            $table->string('severity', 20);
            $table->string('issue_type', 80);
            $table->string('entity_level', 30);
            $table->string('source_system', 50)->nullable();
            $table->string('source_record_key', 255)->nullable();
            $table->string('target_table', 100)->nullable();
            $table->unsignedBigInteger('target_record_id')->nullable();
            $table->text('message');
            $table->json('details_json')->nullable();
            $table->boolean('is_blocking')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            $table->index(['geo_import_run_id', 'severity']);
            $table->index(['entity_level', 'issue_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('geo_import_issues');
        Schema::dropIfExists('geo_import_run_steps');
        Schema::dropIfExists('geo_import_runs');
        Schema::dropIfExists('geo_source_files');
    }
};
