<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minor_profiles', function (Blueprint $table): void {
            $table->text('learning_styles')->nullable()->after('life_history');
            $table->text('interests')->nullable()->after('learning_styles');
            $table->text('hobbies')->nullable()->after('interests');
            $table->text('strengths')->nullable()->after('hobbies');
        });

        Schema::create('minor_diagnoses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_id')->constrained('minors')->cascadeOnDelete();
            $table->string('diagnosis_code', 100)->nullable();
            $table->string('diagnosis_label', 255);
            $table->string('dsm_code', 50)->nullable();
            $table->text('diagnosis_notes_encrypted')->nullable();
            $table->date('diagnosed_at')->nullable();
            $table->date('review_due_at')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['minor_id', 'is_active']);
            $table->index(['minor_id', 'is_primary']);
            $table->index('dsm_code');
        });

        Schema::create('minor_peis', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_id')->constrained('minors')->cascadeOnDelete();
            $table->string('title', 255);
            $table->text('summary')->nullable();
            $table->date('start_date')->nullable();
            $table->date('review_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status', 50)->default('draft');
            $table->string('digital_signature_status', 50)->default('pending');
            $table->timestamp('signed_at')->nullable();
            $table->foreignId('signed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['minor_id', 'status']);
            $table->index(['minor_id', 'review_date']);
        });

        Schema::create('minor_pei_objectives', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_pei_id')->constrained('minor_peis')->cascadeOnDelete();
            $table->string('code', 100)->nullable();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->string('status', 50)->default('open');
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->foreignId('responsible_staff_member_id')->nullable()->constrained('staff_members')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['minor_pei_id', 'status']);
        });

        Schema::create('minor_needs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_id')->constrained('minors')->cascadeOnDelete();
            $table->string('category_code', 50);
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('priority', 20)->default('medium');
            $table->string('status', 20)->default('open');
            $table->foreignId('responsible_staff_member_id')->nullable()->constrained('staff_members')->nullOnDelete();
            $table->foreignId('attachment_minor_document_id')->nullable()->constrained('minor_documents')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['minor_id', 'category_code']);
            $table->index(['minor_id', 'status']);
            $table->index(['minor_id', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_needs');
        Schema::dropIfExists('minor_pei_objectives');
        Schema::dropIfExists('minor_peis');
        Schema::dropIfExists('minor_diagnoses');

        Schema::table('minor_profiles', function (Blueprint $table): void {
            $table->dropColumn([
                'learning_styles',
                'interests',
                'hobbies',
                'strengths',
            ]);
        });
    }
};
