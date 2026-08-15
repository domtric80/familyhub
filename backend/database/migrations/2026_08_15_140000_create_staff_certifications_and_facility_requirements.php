<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_certification_types', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(100);
            $table->timestamps();
        });

        Schema::create('staff_member_certifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('staff_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_certification_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('staff_document_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reference_number', 100)->nullable();
            $table->date('issued_at')->nullable();
            $table->date('expires_at')->nullable();
            $table->string('status_code', 50)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['staff_member_id', 'expires_at']);
            $table->index('status_code');
            $table->foreign('status_code')->references('code')->on('staff_document_statuses')->nullOnDelete();
        });

        Schema::create('facility_certification_requirements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_certification_type_id')->constrained()->restrictOnDelete();
            $table->string('qualification_code', 50)->nullable();
            $table->boolean('is_required')->default(true);
            $table->unsignedSmallInteger('alert_days')->default(30);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['facility_id', 'staff_certification_type_id', 'qualification_code'], 'facility_certification_requirement_unique');
            $table->index('qualification_code');
            $table->foreign('qualification_code')->references('code')->on('staff_qualifications')->nullOnDelete();
        });

        $now = now();
        foreach ([
            ['code' => 'FIRST_AID', 'name' => 'Primo soccorso', 'description' => 'Abilitazione o attestato di primo soccorso.', 'sort_order' => 10],
            ['code' => 'CHILD_SAFEGUARDING', 'name' => 'Tutela minori', 'description' => 'Formazione o abilitazione sulla tutela dei minori.', 'sort_order' => 20],
            ['code' => 'FOOD_SAFETY', 'name' => 'Sicurezza alimentare', 'description' => 'Formazione igienico-sanitaria o equivalente.', 'sort_order' => 30],
            ['code' => 'DRIVING_LICENSE', 'name' => 'Patente di guida', 'description' => 'Abilitazione alla guida, se richiesta dal servizio.', 'sort_order' => 40],
        ] as $item) {
            DB::table('staff_certification_types')->updateOrInsert(
                ['code' => $item['code']],
                [...$item, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('facility_certification_requirements');
        Schema::dropIfExists('staff_member_certifications');
        Schema::dropIfExists('staff_certification_types');
    }
};
