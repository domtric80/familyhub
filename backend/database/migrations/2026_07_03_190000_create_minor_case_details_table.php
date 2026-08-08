<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_case_details', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entry_city_id')->nullable()->constrained('cities')->nullOnDelete();
            $table->foreignId('origin_facility_id')->nullable()->constrained('facilities')->nullOnDelete();
            $table->string('origin_structure_name', 150)->nullable();
            $table->string('placement_order_reference', 100)->nullable();
            $table->foreignId('placement_order_minor_document_id')->nullable()->constrained('minor_documents')->nullOnDelete();
            $table->foreignId('judicial_authority_document_issuer_id')->nullable()->constrained('document_issuers')->nullOnDelete();
            $table->string('proceeding_number', 100)->nullable();
            $table->dateTime('next_hearing_at')->nullable();
            $table->foreignId('general_practitioner_staff_member_id')->nullable()->constrained('staff_members')->nullOnDelete();
            $table->foreignId('pediatrician_staff_member_id')->nullable()->constrained('staff_members')->nullOnDelete();
            $table->foreignId('health_authority_document_issuer_id')->nullable()->constrained('document_issuers')->nullOnDelete();
            $table->foreignId('vaccination_minor_document_id')->nullable()->constrained('minor_documents')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique('minor_id');
            $table->index(['judicial_authority_document_issuer_id'], 'minor_case_details_judicial_idx');
            $table->index(['health_authority_document_issuer_id'], 'minor_case_details_health_idx');
            $table->index(['next_hearing_at'], 'minor_case_details_hearing_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_case_details');
    }
};
