<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geo_source_countries_raw', function (Blueprint $table) {
            $table->id();
            $table->foreignId('geo_import_run_id')->constrained('geo_import_runs')->cascadeOnDelete();
            $table->foreignId('geo_source_file_id')->nullable()->constrained('geo_source_files')->nullOnDelete();
            $table->string('source_system', 50);
            $table->string('dataset_code', 100);
            $table->string('source_record_key', 255);
            $table->string('source_name', 150);
            $table->string('iso_code', 2)->nullable();
            $table->string('iso3_code', 3)->nullable();
            $table->json('raw_payload_json')->nullable();
            $table->json('normalized_payload_json')->nullable();
            $table->timestamps();

            $table->index(['geo_import_run_id', 'source_system']);
            $table->index(['dataset_code', 'source_record_key']);
        });

        Schema::create('geo_source_regions_raw', function (Blueprint $table) {
            $table->id();
            $table->foreignId('geo_import_run_id')->constrained('geo_import_runs')->cascadeOnDelete();
            $table->foreignId('geo_source_file_id')->nullable()->constrained('geo_source_files')->nullOnDelete();
            $table->string('source_system', 50);
            $table->string('dataset_code', 100);
            $table->string('source_record_key', 255);
            $table->string('source_parent_key', 255)->nullable();
            $table->string('source_name', 150);
            $table->string('code', 20)->nullable();
            $table->string('istat_code', 20)->nullable();
            $table->json('raw_payload_json')->nullable();
            $table->json('normalized_payload_json')->nullable();
            $table->timestamps();

            $table->index(['geo_import_run_id', 'source_system']);
            $table->index(['dataset_code', 'source_record_key']);
        });

        Schema::create('geo_source_provinces_raw', function (Blueprint $table) {
            $table->id();
            $table->foreignId('geo_import_run_id')->constrained('geo_import_runs')->cascadeOnDelete();
            $table->foreignId('geo_source_file_id')->nullable()->constrained('geo_source_files')->nullOnDelete();
            $table->string('source_system', 50);
            $table->string('dataset_code', 100);
            $table->string('source_record_key', 255);
            $table->string('source_parent_key', 255)->nullable();
            $table->string('source_name', 150);
            $table->string('code', 20)->nullable();
            $table->string('istat_code', 20)->nullable();
            $table->string('vehicle_code', 20)->nullable();
            $table->json('raw_payload_json')->nullable();
            $table->json('normalized_payload_json')->nullable();
            $table->timestamps();

            $table->index(['geo_import_run_id', 'source_system']);
            $table->index(['dataset_code', 'source_record_key']);
        });

        Schema::create('geo_source_cities_raw', function (Blueprint $table) {
            $table->id();
            $table->foreignId('geo_import_run_id')->constrained('geo_import_runs')->cascadeOnDelete();
            $table->foreignId('geo_source_file_id')->nullable()->constrained('geo_source_files')->nullOnDelete();
            $table->string('source_system', 50);
            $table->string('dataset_code', 100);
            $table->string('source_record_key', 255);
            $table->string('source_parent_key', 255)->nullable();
            $table->string('source_name', 200);
            $table->string('istat_code', 20)->nullable();
            $table->string('cadastre_code', 20)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->json('raw_payload_json')->nullable();
            $table->json('normalized_payload_json')->nullable();
            $table->timestamps();

            $table->index(['geo_import_run_id', 'source_system']);
            $table->index(['dataset_code', 'source_record_key']);
        });

        Schema::create('geo_source_city_history_raw', function (Blueprint $table) {
            $table->id();
            $table->foreignId('geo_import_run_id')->constrained('geo_import_runs')->cascadeOnDelete();
            $table->foreignId('geo_source_file_id')->nullable()->constrained('geo_source_files')->nullOnDelete();
            $table->string('source_system', 50);
            $table->string('dataset_code', 100);
            $table->string('source_record_key', 255);
            $table->string('related_source_record_key', 255)->nullable();
            $table->string('event_type', 50);
            $table->date('event_date')->nullable();
            $table->string('source_name', 200)->nullable();
            $table->text('notes')->nullable();
            $table->json('raw_payload_json')->nullable();
            $table->json('normalized_payload_json')->nullable();
            $table->timestamps();

            $table->index(['geo_import_run_id', 'source_system']);
            $table->index(['dataset_code', 'source_record_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('geo_source_city_history_raw');
        Schema::dropIfExists('geo_source_cities_raw');
        Schema::dropIfExists('geo_source_provinces_raw');
        Schema::dropIfExists('geo_source_regions_raw');
        Schema::dropIfExists('geo_source_countries_raw');
    }
};
