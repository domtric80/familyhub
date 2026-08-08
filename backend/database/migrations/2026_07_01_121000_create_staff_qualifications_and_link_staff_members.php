<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_qualifications', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(100);
            $table->timestamps();
        });

        Schema::table('staff_members', function (Blueprint $table): void {
            $table->string('qualification_code', 50)->nullable()->after('qualification');
            $table->index('qualification_code');
        });

        $now = now();

        $defaults = [
            ['code' => 'EDUCATORE', 'name' => 'Educatore', 'description' => 'Figura educativa diurna.', 'sort_order' => 10],
            ['code' => 'EDUCATORE_NOTTURNO', 'name' => 'Educatore notturno', 'description' => 'Figura educativa per copertura notturna.', 'sort_order' => 20],
            ['code' => 'COORDINATORE', 'name' => 'Coordinatore', 'description' => 'Coordinamento operativo di struttura.', 'sort_order' => 30],
            ['code' => 'PSICOLOGO', 'name' => 'Psicologo', 'description' => 'Professionista psicologico.', 'sort_order' => 40],
            ['code' => 'PEDIATRA', 'name' => 'Pediatra', 'description' => 'Professionista sanitario pediatrico.', 'sort_order' => 50],
            ['code' => 'ASSISTENTE_SOCIALE', 'name' => 'Assistente sociale', 'description' => 'Professionista sociale interno o esterno.', 'sort_order' => 60],
            ['code' => 'MEDIATORE_CULTURALE', 'name' => 'Mediatore culturale', 'description' => 'Mediazione linguistica e culturale.', 'sort_order' => 70],
        ];

        foreach ($defaults as $qualification) {
            DB::table('staff_qualifications')->updateOrInsert(
                ['code' => $qualification['code']],
                [
                    'name' => $qualification['name'],
                    'description' => $qualification['description'],
                    'is_active' => true,
                    'sort_order' => $qualification['sort_order'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $legacyQualifications = DB::table('staff_members')
            ->select('qualification')
            ->whereNotNull('qualification')
            ->where('qualification', '<>', '')
            ->distinct()
            ->pluck('qualification');

        foreach ($legacyQualifications as $legacyQualification) {
            $name = trim((string) $legacyQualification);
            $code = Str::upper(Str::slug($name, '_'));

            if ($code === '') {
                continue;
            }

            DB::table('staff_qualifications')->updateOrInsert(
                ['code' => $code],
                [
                    'name' => $name,
                    'description' => null,
                    'is_active' => true,
                    'sort_order' => 200,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            DB::table('staff_members')
                ->where('qualification', $legacyQualification)
                ->update([
                    'qualification_code' => $code,
                    'updated_at' => $now,
                ]);
        }

        Schema::table('staff_members', function (Blueprint $table): void {
            $table->foreign('qualification_code')
                ->references('code')
                ->on('staff_qualifications')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('staff_members', function (Blueprint $table): void {
            $table->dropForeign(['qualification_code']);
            $table->dropIndex(['qualification_code']);
            $table->dropColumn('qualification_code');
        });

        Schema::dropIfExists('staff_qualifications');
    }
};
