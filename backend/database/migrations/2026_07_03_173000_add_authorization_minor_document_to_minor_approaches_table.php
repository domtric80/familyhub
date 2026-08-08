<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minor_approaches', function (Blueprint $table): void {
            $table->foreignId('authorization_minor_document_id')
                ->nullable()
                ->after('authorization_reference')
                ->constrained('minor_documents')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('minor_approaches', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('authorization_minor_document_id');
        });
    }
};
