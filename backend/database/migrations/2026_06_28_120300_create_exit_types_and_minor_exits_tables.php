<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exit_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('minor_exits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->foreignId('minor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exit_type_id')->constrained('exit_types')->restrictOnDelete();
            $table->string('destination', 255);
            $table->text('reason')->nullable();
            $table->string('accompanied_by', 255)->nullable();
            $table->foreignId('authorized_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('planned_exit_at');
            $table->dateTime('expected_return_at')->nullable();
            $table->dateTime('actual_exit_at')->nullable();
            $table->dateTime('actual_return_at')->nullable();
            $table->string('status', 20)->default('planned');
            $table->text('outcome_notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['facility_id', 'status']);
            $table->index(['minor_id', 'status']);
            $table->index(['planned_exit_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_exits');
        Schema::dropIfExists('exit_types');
    }
};
