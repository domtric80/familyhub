<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff_documents', function (Blueprint $table): void {
            $table->softDeletes();
            $table->index(['expiry_date', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::table('staff_documents', function (Blueprint $table): void {
            $table->dropIndex(['expiry_date', 'deleted_at']);
            $table->dropSoftDeletes();
        });
    }
};
