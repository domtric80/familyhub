<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minor_exits', function (Blueprint $table) {
            $table->string('return_condition', 20)->nullable()->after('status');
            $table->boolean('follow_up_required')->default(false)->after('return_condition');
            $table->text('follow_up_notes')->nullable()->after('follow_up_required');
        });
    }

    public function down(): void
    {
        Schema::table('minor_exits', function (Blueprint $table) {
            $table->dropColumn(['return_condition', 'follow_up_required', 'follow_up_notes']);
        });
    }
};
