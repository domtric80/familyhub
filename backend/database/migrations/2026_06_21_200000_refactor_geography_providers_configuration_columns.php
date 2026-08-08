<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('geography_providers', function (Blueprint $table): void {
            $table->string('mode', 20)->default('remote_file')->after('driver');
            $table->string('format', 20)->nullable()->after('mode');
            $table->string('source_path', 1000)->nullable()->after('format');
            $table->string('source_url', 2000)->nullable()->after('source_path');
            $table->string('auth_type', 20)->default('none')->after('source_url');
            $table->json('auth_config_json')->nullable()->after('auth_type');
            $table->dropColumn('config_json');
        });

        Schema::table('country_geography_provider', function (Blueprint $table): void {
            $table->dropColumn('config_override_json');
        });
    }

    public function down(): void
    {
        Schema::table('country_geography_provider', function (Blueprint $table): void {
            $table->json('config_override_json')->nullable()->after('is_active');
        });

        Schema::table('geography_providers', function (Blueprint $table): void {
            $table->json('config_json')->nullable()->after('is_active');
            $table->dropColumn(['mode', 'format', 'source_path', 'source_url', 'auth_type', 'auth_config_json']);
        });
    }
};
