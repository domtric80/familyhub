<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreignId('minor_id')->nullable()->after('facility_id')->constrained('minors')->nullOnDelete();
            $table->text('operation_summary')->nullable()->after('resource_label');
            $table->index(['minor_id', 'occurred_at_utc']);
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['minor_id', 'occurred_at_utc']);
            $table->dropConstrainedForeignId('minor_id');
            $table->dropColumn('operation_summary');
        });
    }
};
