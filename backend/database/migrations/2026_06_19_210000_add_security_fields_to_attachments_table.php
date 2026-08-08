<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->string('security_status', 20)->default('pending')->after('is_encrypted');
            $table->text('security_notes')->nullable()->after('security_status');
            $table->timestamp('scanned_at')->nullable()->after('security_notes');
            $table->timestamp('quarantined_at')->nullable()->after('scanned_at');
            $table->timestamp('released_at')->nullable()->after('quarantined_at');
            $table->string('scanner_engine', 50)->nullable()->after('released_at');
            $table->string('scanner_signature', 255)->nullable()->after('scanner_engine');
            $table->index('security_status');
        });
    }

    public function down(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->dropIndex(['security_status']);
            $table->dropColumn([
                'security_status',
                'security_notes',
                'scanned_at',
                'quarantined_at',
                'released_at',
                'scanner_engine',
                'scanner_signature',
            ]);
        });
    }
};
