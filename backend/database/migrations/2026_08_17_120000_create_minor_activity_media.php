<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_activity_media', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_activity_id')->constrained('minor_activities')->cascadeOnDelete();
            $table->foreignId('media_document_id')->constrained('minor_documents')->restrictOnDelete();
            $table->foreignId('consent_document_id')->constrained('minor_documents')->restrictOnDelete();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('consent_revoked_at')->nullable();
            $table->foreignId('consent_revoked_by_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->text('consent_revocation_reason_encrypted')->nullable();
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['minor_activity_id', 'media_document_id'], 'minor_activity_media_unique');
            $table->index(['minor_activity_id', 'consent_revoked_at'], 'minor_activity_media_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_activity_media');
    }
};
