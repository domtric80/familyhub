<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('internal_message_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->foreignId('minor_id')->nullable()->constrained()->nullOnDelete();
            $table->string('thread_type', 20)->default('facility');
            $table->string('subject', 150);
            $table->text('topic')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['facility_id', 'thread_type']);
            $table->index(['minor_id']);
            $table->index(['last_message_at']);
        });

        Schema::create('internal_message_thread_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('internal_message_threads')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('last_read_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('added_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['thread_id', 'user_id'], 'internal_message_thread_user_unique');
            $table->index(['user_id', 'is_active']);
        });

        Schema::create('internal_message_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('internal_message_threads')->cascadeOnDelete();
            $table->foreignId('sender_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->longText('body_encrypted');
            $table->timestamps();

            $table->index(['thread_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_message_messages');
        Schema::dropIfExists('internal_message_thread_participants');
        Schema::dropIfExists('internal_message_threads');
    }
};
