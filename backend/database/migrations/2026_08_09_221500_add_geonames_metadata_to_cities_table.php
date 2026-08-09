<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cities', function (Blueprint $table): void {
            $table->bigInteger('geoname_id')->nullable()->after('postal_code');
            $table->decimal('latitude', 10, 7)->nullable()->after('geoname_id');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->bigInteger('population')->nullable()->after('longitude');
            $table->string('timezone', 64)->nullable()->after('population');
            $table->string('feature_code', 20)->nullable()->after('timezone');
            $table->date('geonames_modified_at')->nullable()->after('feature_code');

            $table->index('geoname_id');
            $table->index(['province_id', 'geoname_id']);
        });
    }

    public function down(): void
    {
        Schema::table('cities', function (Blueprint $table): void {
            $table->dropIndex(['province_id', 'geoname_id']);
            $table->dropIndex(['geoname_id']);
            $table->dropColumn([
                'geoname_id',
                'latitude',
                'longitude',
                'population',
                'timezone',
                'feature_code',
                'geonames_modified_at',
            ]);
        });
    }
};
