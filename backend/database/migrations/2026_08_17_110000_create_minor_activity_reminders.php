<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_activity_reminders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_activity_id')->constrained('minor_activities')->cascadeOnDelete();
            $table->foreignId('recipient_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('remind_at');
            $table->timestamp('acknowledged_at')->nullable();
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['minor_activity_id', 'recipient_user_id', 'remind_at'], 'minor_activity_reminder_unique');
            $table->index(['recipient_user_id', 'acknowledged_at', 'remind_at'], 'minor_activity_reminder_recipient_idx');
        });
    }

    public function down(): void { Schema::dropIfExists('minor_activity_reminders'); }
};
