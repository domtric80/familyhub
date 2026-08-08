<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->unsignedSmallInteger('sort_order')->default(100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('gender_identities', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->unsignedSmallInteger('sort_order')->default(100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('minors', function (Blueprint $table) {
            $table->foreignId('minor_status_id')->nullable()->after('entry_date')->constrained('minor_statuses')->restrictOnDelete();
            $table->foreignId('gender_identity_id')->nullable()->after('birth_city_id')->constrained('gender_identities')->restrictOnDelete();
        });

        DB::table('minor_statuses')->insert([
            ['code' => 'ACTIVE', 'name' => 'Attivo', 'sort_order' => 10, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'SUSPENDED', 'name' => 'Sospeso', 'sort_order' => 20, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'DISMISSED', 'name' => 'Dimesso', 'sort_order' => 30, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'TRANSFERRED', 'name' => 'Trasferito', 'sort_order' => 40, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('gender_identities')->insert([
            ['code' => 'MALE', 'name' => 'Maschile', 'sort_order' => 10, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'FEMALE', 'name' => 'Femminile', 'sort_order' => 20, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'NON_BINARY', 'name' => 'Non binario', 'sort_order' => 30, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'NOT_DECLARED', 'name' => 'Non dichiarato', 'sort_order' => 40, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $defaultStatusId = DB::table('minor_statuses')->where('code', 'ACTIVE')->value('id');

        DB::table('minors')
            ->whereNull('minor_status_id')
            ->update(['minor_status_id' => $defaultStatusId]);

        Schema::table('minors', function (Blueprint $table) {
            $table->dropIndex('minors_facility_id_status_index');
            $table->foreignId('minor_status_id')->nullable(false)->change();
            $table->dropColumn(['gender', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('minors', function (Blueprint $table) {
            $table->string('gender', 30)->nullable();
            $table->string('status', 30)->default('active');
            $table->index(['facility_id', 'status'], 'minors_facility_id_status_index');
        });

        Schema::table('minors', function (Blueprint $table) {
            $table->dropConstrainedForeignId('gender_identity_id');
            $table->dropConstrainedForeignId('minor_status_id');
        });

        Schema::dropIfExists('gender_identities');
        Schema::dropIfExists('minor_statuses');
    }
};
