<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('mfa_secret_encrypted')->nullable()->after('mfa_required');
            $table->text('mfa_recovery_codes_encrypted')->nullable()->after('mfa_secret_encrypted');
            $table->timestamp('mfa_confirmed_at')->nullable()->after('mfa_recovery_codes_encrypted');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'mfa_secret_encrypted',
                'mfa_recovery_codes_encrypted',
                'mfa_confirmed_at',
            ]);
        });
    }
};
