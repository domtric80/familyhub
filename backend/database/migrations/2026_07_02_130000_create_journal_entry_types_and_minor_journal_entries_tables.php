<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_entry_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('minor_journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->foreignId('minor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('journal_entry_type_id')->constrained('journal_entry_types')->restrictOnDelete();
            $table->dateTime('observed_at');
            $table->string('title', 150);
            $table->longText('content');
            $table->boolean('follow_up_required')->default(false);
            $table->text('follow_up_notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['facility_id', 'observed_at']);
            $table->index(['minor_id', 'observed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_journal_entries');
        Schema::dropIfExists('journal_entry_types');
    }
};
