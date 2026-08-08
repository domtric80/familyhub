<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->string('owner_type', 100);
            $table->unsignedBigInteger('owner_id');
            $table->foreignId('document_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('disk', 30)->default('s3');
            $table->string('bucket', 100);
            $table->string('path', 255);
            $table->string('original_name', 255);
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('size_bytes');
            $table->char('sha256', 64);
            $table->boolean('is_encrypted')->default(true);
            $table->foreignId('uploaded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['owner_type', 'owner_id']);
            $table->unique(['disk', 'bucket', 'path']);
        });

        Schema::create('minor_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('minor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('attachment_id')->constrained()->cascadeOnDelete();
            $table->string('issued_by', 150)->nullable();
            $table->date('issue_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('classification', 30)->default('restricted');
            $table->timestamps();

            $table->index(['minor_id', 'document_type_id']);
        });

        Schema::create('staff_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('attachment_id')->constrained()->cascadeOnDelete();
            $table->date('issue_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('status', 30)->default('valid');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_documents');
        Schema::dropIfExists('minor_documents');
        Schema::dropIfExists('attachments');
    }
};
