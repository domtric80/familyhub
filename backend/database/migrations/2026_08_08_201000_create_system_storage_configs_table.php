<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_storage_configs', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 120);
            $table->string('provider_type', 30);
            $table->string('bucket', 150);
            $table->string('region', 80)->nullable();
            $table->string('endpoint', 255)->nullable();
            $table->boolean('use_path_style_endpoint')->default(false);
            $table->text('access_key_encrypted')->nullable();
            $table->text('secret_key_encrypted')->nullable();
            $table->string('prefix', 150)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->timestamp('last_tested_at')->nullable();
            $table->string('last_test_status', 20)->nullable();
            $table->text('last_test_message')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_active', 'is_default'], 'system_storage_configs_active_default_idx');
            $table->index(['provider_type'], 'system_storage_configs_provider_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_storage_configs');
    }
};
