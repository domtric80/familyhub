<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approach_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('minor_approaches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->foreignId('minor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('approach_type_id')->constrained('approach_types')->restrictOnDelete();
            $table->foreignId('minor_contact_id')->nullable()->constrained('minor_contacts')->nullOnDelete();
            $table->foreignId('supervising_staff_member_id')->nullable()->constrained('staff_members')->nullOnDelete();
            $table->string('title', 150);
            $table->text('objective')->nullable();
            $table->string('location', 150)->nullable();
            $table->dateTime('planned_start_at');
            $table->dateTime('planned_end_at')->nullable();
            $table->dateTime('actual_start_at')->nullable();
            $table->dateTime('actual_end_at')->nullable();
            $table->string('status', 20)->default('planned');
            $table->text('outcome_notes')->nullable();
            $table->text('next_steps')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['facility_id', 'status']);
            $table->index(['minor_id', 'status']);
            $table->index(['planned_start_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_approaches');
        Schema::dropIfExists('approach_types');
    }
};
