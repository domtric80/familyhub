<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geo_sync_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('geo_import_run_id')->constrained('geo_import_runs')->cascadeOnDelete();
            $table->string('entity_level', 30);
            $table->string('action', 30);
            $table->string('target_table', 100)->nullable();
            $table->unsignedBigInteger('target_record_id')->nullable();
            $table->string('source_system', 50)->nullable();
            $table->string('source_record_key', 255)->nullable();
            $table->json('before_json')->nullable();
            $table->json('after_json')->nullable();
            $table->string('reason_code', 100)->nullable();
            $table->boolean('executed')->default(false);
            $table->timestamps();

            $table->index(['geo_import_run_id', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('geo_sync_decisions');
    }
};
