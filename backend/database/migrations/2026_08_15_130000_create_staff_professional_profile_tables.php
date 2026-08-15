<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['staff_skills', 'staff_languages', 'staff_specializations', 'staff_proficiency_levels'] as $tableName) {
            Schema::create($tableName, function (Blueprint $table): void {
                $table->id();
                $table->string('code', 50)->unique();
                $table->string('name', 100);
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('sort_order')->default(100);
                $table->timestamps();
            });
        }

        Schema::create('staff_member_skills', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('staff_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_skill_id')->constrained()->restrictOnDelete();
            $table->string('proficiency_level_code', 50)->nullable();
            $table->date('acquired_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['staff_member_id', 'staff_skill_id']);
            $table->index('proficiency_level_code');
            $table->foreign('proficiency_level_code')->references('code')->on('staff_proficiency_levels')->nullOnDelete();
        });

        Schema::create('staff_member_languages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('staff_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_language_id')->constrained()->restrictOnDelete();
            $table->string('proficiency_level_code', 50)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['staff_member_id', 'staff_language_id']);
            $table->index('proficiency_level_code');
            $table->foreign('proficiency_level_code')->references('code')->on('staff_proficiency_levels')->nullOnDelete();
        });

        Schema::create('staff_member_specializations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('staff_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_specialization_id')->constrained()->restrictOnDelete();
            $table->date('achieved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['staff_member_id', 'staff_specialization_id']);
        });

        $now = now();
        $defaults = [
            'staff_proficiency_levels' => [
                ['code' => 'BASIC', 'name' => 'Base', 'description' => 'Conoscenza essenziale.', 'sort_order' => 10],
                ['code' => 'INTERMEDIATE', 'name' => 'Intermedio', 'description' => 'Autonomia operativa ordinaria.', 'sort_order' => 20],
                ['code' => 'ADVANCED', 'name' => 'Avanzato', 'description' => 'Autonomia elevata e supporto ad altri operatori.', 'sort_order' => 30],
                ['code' => 'NATIVE', 'name' => 'Madrelingua', 'description' => 'Competenza madrelingua.', 'sort_order' => 40],
            ],
            'staff_languages' => [
                ['code' => 'IT', 'name' => 'Italiano', 'description' => 'Lingua italiana.', 'sort_order' => 10],
                ['code' => 'EN', 'name' => 'Inglese', 'description' => 'Lingua inglese.', 'sort_order' => 20],
                ['code' => 'FR', 'name' => 'Francese', 'description' => 'Lingua francese.', 'sort_order' => 30],
                ['code' => 'AR', 'name' => 'Arabo', 'description' => 'Lingua araba.', 'sort_order' => 40],
            ],
        ];

        foreach ($defaults as $tableName => $items) {
            foreach ($items as $item) {
                DB::table($tableName)->updateOrInsert(
                    ['code' => $item['code']],
                    [...$item, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
                );
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_member_specializations');
        Schema::dropIfExists('staff_member_languages');
        Schema::dropIfExists('staff_member_skills');
        Schema::dropIfExists('staff_proficiency_levels');
        Schema::dropIfExists('staff_specializations');
        Schema::dropIfExists('staff_languages');
        Schema::dropIfExists('staff_skills');
    }
};
