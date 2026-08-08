<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_user_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('minor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->string('assignment_role_code', 50);
            $table->string('access_level', 30);
            $table->date('valid_from');
            $table->date('valid_to')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['minor_id', 'user_id', 'is_active']);
            $table->index(['facility_id', 'user_id', 'is_active']);
            $table->unique(['minor_id', 'user_id', 'assignment_role_code', 'valid_from'], 'minor_user_assignments_unique_window');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_user_assignments');
    }
};
