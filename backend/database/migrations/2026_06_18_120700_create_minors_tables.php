<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->string('internal_code', 30);
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('preferred_name', 100)->nullable();
            $table->date('birth_date');
            $table->foreignId('birth_city_id')->nullable()->constrained('cities')->nullOnDelete();
            $table->string('gender', 30)->nullable();
            $table->string('tax_code', 20)->nullable();
            $table->date('entry_date');
            $table->string('status', 30)->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['facility_id', 'internal_code']);
            $table->index(['facility_id', 'status']);
            $table->index(['last_name', 'birth_date']);
            $table->index('tax_code');
        });

        Schema::create('minor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('minor_id')->constrained()->cascadeOnDelete();
            $table->text('family_background')->nullable();
            $table->text('life_history')->nullable();
            $table->text('risk_factors')->nullable();
            $table->text('crisis_indicators')->nullable();
            $table->longText('clinical_notes_encrypted')->nullable();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique('minor_id');
        });

        Schema::create('minor_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('minor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_type_id')->constrained()->restrictOnDelete();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('phone', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['minor_id', 'contact_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_contacts');
        Schema::dropIfExists('minor_profiles');
        Schema::dropIfExists('minors');
    }
};
