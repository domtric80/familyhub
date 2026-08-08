<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        DB::transaction(function () use ($driver): void {
            DB::table('user_facility_roles')
                ->where('is_active', true)
                ->whereNotNull('valid_to')
                ->where('valid_to', '<', now())
                ->update(['is_active' => false]);

            $groups = DB::table('user_facility_roles')
                ->select('user_id', 'facility_id')
                ->where('is_active', true)
                ->groupBy('user_id', 'facility_id')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            foreach ($groups as $group) {
                $activeAssignments = DB::table('user_facility_roles')
                    ->where('user_id', $group->user_id)
                    ->where('facility_id', $group->facility_id)
                    ->where('is_active', true)
                    ->orderByDesc('valid_from')
                    ->orderByDesc('id')
                    ->get();

                $keepId = $activeAssignments->first()?->id;

                if (! $keepId) {
                    continue;
                }

                $idsToDeactivate = $activeAssignments
                    ->skip(1)
                    ->pluck('id')
                    ->all();

                if ($idsToDeactivate === []) {
                    continue;
                }

                $timestamp = now();

                DB::table('user_facility_roles')
                    ->whereIn('id', $idsToDeactivate)
                    ->update([
                        'is_active' => false,
                        'valid_to' => $timestamp,
                        'updated_at' => $timestamp,
                    ]);
            }
        });

        if ($driver === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uq_user_facility_roles_active ON user_facility_roles (user_id, facility_id) WHERE is_active = true');

            return;
        }

        if ($driver === 'sqlite') {
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uq_user_facility_roles_active ON user_facility_roles (user_id, facility_id) WHERE is_active = 1');
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS uq_user_facility_roles_active');
    }
};
