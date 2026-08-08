<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_statuses', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(100);
            $table->timestamps();
        });

        Schema::table('staff_members', function (Blueprint $table): void {
            $table->string('status_code', 50)->nullable()->after('status');
            $table->index('status_code');
        });

        $now = now();

        $defaults = [
            ['code' => 'ACTIVE', 'name' => 'Attivo', 'description' => 'Operatore attivo in struttura.', 'sort_order' => 10],
            ['code' => 'SUSPENDED', 'name' => 'Sospeso', 'description' => 'Operatore temporaneamente sospeso.', 'sort_order' => 20],
            ['code' => 'INACTIVE', 'name' => 'Non attivo', 'description' => 'Operatore non attivo.', 'sort_order' => 30],
            ['code' => 'TERMINATED', 'name' => 'Cessato', 'description' => 'Rapporto cessato.', 'sort_order' => 40],
        ];

        foreach ($defaults as $status) {
            DB::table('staff_statuses')->updateOrInsert(
                ['code' => $status['code']],
                [
                    'name' => $status['name'],
                    'description' => $status['description'],
                    'is_active' => true,
                    'sort_order' => $status['sort_order'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $legacyStatuses = DB::table('staff_members')
            ->select('status')
            ->whereNotNull('status')
            ->where('status', '<>', '')
            ->distinct()
            ->pluck('status');

        foreach ($legacyStatuses as $legacyStatus) {
            $raw = trim((string) $legacyStatus);
            $code = match (Str::lower($raw)) {
                'active', 'attiva', 'attivo' => 'ACTIVE',
                'inactive', 'inattivo', 'non attivo' => 'INACTIVE',
                'suspended', 'sospeso', 'sospesa' => 'SUSPENDED',
                'terminated', 'cessato', 'cessata' => 'TERMINATED',
                default => Str::upper(Str::slug($raw, '_')),
            };

            if ($code === '') {
                continue;
            }

            DB::table('staff_statuses')->updateOrInsert(
                ['code' => $code],
                [
                    'name' => $raw,
                    'description' => null,
                    'is_active' => true,
                    'sort_order' => 200,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            DB::table('staff_members')
                ->where('status', $legacyStatus)
                ->update([
                    'status_code' => $code,
                    'updated_at' => $now,
                ]);
        }

        Schema::table('staff_members', function (Blueprint $table): void {
            $table->foreign('status_code')
                ->references('code')
                ->on('staff_statuses')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('staff_members', function (Blueprint $table): void {
            $table->dropForeign(['status_code']);
            $table->dropIndex(['status_code']);
            $table->dropColumn('status_code');
        });

        Schema::dropIfExists('staff_statuses');
    }
};
