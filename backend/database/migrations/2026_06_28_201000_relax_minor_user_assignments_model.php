<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE minor_user_assignments ALTER COLUMN assignment_role_code DROP NOT NULL');
            DB::statement('ALTER TABLE minor_user_assignments ALTER COLUMN access_level DROP NOT NULL');
            DB::statement('ALTER TABLE minor_user_assignments DROP CONSTRAINT IF EXISTS minor_user_assignments_unique_window');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS minor_user_assignments_minor_user_facility_unique_window ON minor_user_assignments (minor_id, user_id, facility_id, valid_from)');
            return;
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE minor_user_assignments MODIFY assignment_role_code VARCHAR(50) NULL');
            DB::statement('ALTER TABLE minor_user_assignments MODIFY access_level VARCHAR(30) NULL');
            DB::statement('DROP INDEX minor_user_assignments_unique_window ON minor_user_assignments');
            DB::statement('CREATE UNIQUE INDEX minor_user_assignments_minor_user_facility_unique_window ON minor_user_assignments (minor_id, user_id, facility_id, valid_from)');
            return;
        }

        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS minor_user_assignments_unique_window');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS minor_user_assignments_minor_user_facility_unique_window ON minor_user_assignments (minor_id, user_id, facility_id, valid_from)');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS minor_user_assignments_minor_user_facility_unique_window');
            DB::statement('ALTER TABLE minor_user_assignments ADD CONSTRAINT minor_user_assignments_unique_window UNIQUE (minor_id, user_id, assignment_role_code, valid_from)');
            return;
        }

        if ($driver === 'mysql') {
            DB::statement('DROP INDEX minor_user_assignments_minor_user_facility_unique_window ON minor_user_assignments');
            DB::statement('CREATE UNIQUE INDEX minor_user_assignments_unique_window ON minor_user_assignments (minor_id, user_id, assignment_role_code, valid_from)');
            return;
        }

        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS minor_user_assignments_minor_user_facility_unique_window');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS minor_user_assignments_unique_window ON minor_user_assignments (minor_id, user_id, assignment_role_code, valid_from)');
        }
    }
};
