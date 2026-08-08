<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biological_sexes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('minors', function (Blueprint $table) {
            $table->foreignId('biological_sex_id')
                ->nullable()
                ->after('birth_city_id')
                ->constrained('biological_sexes')
                ->restrictOnDelete();
        });

        DB::table('biological_sexes')->insert([
            ['code' => 'M', 'name' => 'Maschio', 'sort_order' => 10, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'F', 'name' => 'Femmina', 'sort_order' => 20, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'I', 'name' => 'Intersex', 'sort_order' => 30, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'NS', 'name' => 'Non specificato', 'sort_order' => 40, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::table('minors', function (Blueprint $table) {
            $table->dropConstrainedForeignId('biological_sex_id');
        });

        Schema::dropIfExists('biological_sexes');
    }
};
