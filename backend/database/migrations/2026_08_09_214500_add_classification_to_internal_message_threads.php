<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internal_message_threads', function (Blueprint $table): void {
            $table->string('classification_code', 50)->nullable()->after('topic');
            $table->index('classification_code');
        });

        DB::table('internal_message_threads')
            ->whereNull('classification_code')
            ->update(['classification_code' => 'internal']);

        Schema::table('internal_message_threads', function (Blueprint $table): void {
            $table->foreign('classification_code')
                ->references('code')
                ->on('document_classifications')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('internal_message_threads', function (Blueprint $table): void {
            $table->dropForeign(['classification_code']);
            $table->dropIndex(['classification_code']);
            $table->dropColumn('classification_code');
        });
    }
};
