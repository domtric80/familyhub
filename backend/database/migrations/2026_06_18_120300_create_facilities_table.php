<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('code', 30);
            $table->string('name', 150);
            $table->string('address_line', 200);
            $table->foreignId('city_id')->constrained()->restrictOnDelete();
            $table->string('postal_code', 10)->nullable();
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();

            $table->unique(['organization_id', 'code']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facilities');
    }
};
