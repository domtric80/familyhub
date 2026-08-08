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
        Schema::create('staff_document_statuses', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(100);
            $table->timestamps();
        });

        Schema::table('staff_documents', function (Blueprint $table): void {
            $table->string('status_code', 50)->nullable()->after('status');
            $table->index('status_code');
        });

        $now = now();

        $defaults = [
            ['code' => 'VALID', 'name' => 'Valido', 'description' => 'Documento valido e utilizzabile.', 'sort_order' => 10],
            ['code' => 'EXPIRED', 'name' => 'Scaduto', 'description' => 'Documento scaduto.', 'sort_order' => 20],
            ['code' => 'REVOKED', 'name' => 'Revocato', 'description' => 'Documento revocato o non più valido.', 'sort_order' => 30],
            ['code' => 'PENDING_RENEWAL', 'name' => 'In rinnovo', 'description' => 'Documento in fase di rinnovo.', 'sort_order' => 40],
        ];

        foreach ($defaults as $status) {
            DB::table('staff_document_statuses')->updateOrInsert(
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

        $legacyStatuses = DB::table('staff_documents')
            ->select('status')
            ->whereNotNull('status')
            ->where('status', '<>', '')
            ->distinct()
            ->pluck('status');

        foreach ($legacyStatuses as $legacyStatus) {
            $raw = trim((string) $legacyStatus);
            $code = match (Str::lower($raw)) {
                'valid', 'valido' => 'VALID',
                'expired', 'scaduto', 'scaduta' => 'EXPIRED',
                'revoked', 'revocato', 'revocata' => 'REVOKED',
                'pending_renewal', 'pending renewal', 'in rinnovo' => 'PENDING_RENEWAL',
                default => Str::upper(Str::slug($raw, '_')),
            };

            if ($code === '') {
                continue;
            }

            DB::table('staff_document_statuses')->updateOrInsert(
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

            DB::table('staff_documents')
                ->where('status', $legacyStatus)
                ->update([
                    'status_code' => $code,
                    'updated_at' => $now,
                ]);
        }

        Schema::table('staff_documents', function (Blueprint $table): void {
            $table->foreign('status_code')
                ->references('code')
                ->on('staff_document_statuses')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('staff_documents', function (Blueprint $table): void {
            $table->dropForeign(['status_code']);
            $table->dropIndex(['status_code']);
            $table->dropColumn('status_code');
        });

        Schema::dropIfExists('staff_document_statuses');
    }
};
