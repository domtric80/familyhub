<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geography_providers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->string('type', 30)->default('generic');
            $table->string('driver', 100);
            $table->unsignedInteger('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->json('config_json')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('country_geography_provider', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->foreignId('geography_provider_id')->constrained('geography_providers')->cascadeOnDelete();
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->json('config_override_json')->nullable();
            $table->timestamps();

            $table->unique(['country_id', 'geography_provider_id'], 'country_geography_provider_unique');
            $table->index(['country_id', 'is_default', 'priority'], 'country_geography_provider_resolution_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('country_geography_provider');
        Schema::dropIfExists('geography_providers');
    }
};
