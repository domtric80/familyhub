<?php

use App\Models\StaffQualification;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        StaffQualification::query()->updateOrCreate(
            ['code' => 'MEDICO_BASE'],
            [
                'name' => 'Medico di base',
                'description' => 'Professionista sanitario di medicina generale o medico di base.',
                'sort_order' => 45,
                'is_active' => true,
            ],
        );
    }

    public function down(): void
    {
        StaffQualification::query()->where('code', 'MEDICO_BASE')->delete();
    }
};
