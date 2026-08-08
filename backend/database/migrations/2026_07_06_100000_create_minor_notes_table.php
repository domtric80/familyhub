<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_notes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->string('classification_code', 50);
            $table->string('title', 150)->nullable();
            $table->longText('body_encrypted');
            $table->boolean('is_encrypted')->default(true);
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['minor_id', 'classification_code']);
            $table->index(['facility_id', 'classification_code']);
            $table->foreign('classification_code')
                ->references('code')
                ->on('document_classifications')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_notes');
    }
};
