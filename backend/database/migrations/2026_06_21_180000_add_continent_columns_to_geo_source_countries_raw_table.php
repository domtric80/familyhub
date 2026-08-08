<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('geo_source_countries_raw', function (Blueprint $table): void {
            $table->string('continent_code', 2)->nullable()->after('iso3_code');
            $table->string('continent_name', 50)->nullable()->after('continent_code');
            $table->index(['geo_import_run_id', 'source_system', 'continent_code'], 'geo_src_country_run_source_continent_idx');
        });
    }

    public function down(): void
    {
        Schema::table('geo_source_countries_raw', function (Blueprint $table): void {
            $table->dropIndex('geo_src_country_run_source_continent_idx');
            $table->dropColumn(['continent_code', 'continent_name']);
        });
    }
};
