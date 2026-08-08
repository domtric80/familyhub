<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('staff_qualifications')->updateOrInsert(
            ['code' => 'MEDICO_BASE'],
            [
                'name' => 'Medico di base',
                'description' => 'Medico di medicina generale collegabile al minore.',
                'is_active' => true,
                'sort_order' => 55,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('staff_qualifications')->where('code', 'MEDICO_BASE')->delete();
    }
};
