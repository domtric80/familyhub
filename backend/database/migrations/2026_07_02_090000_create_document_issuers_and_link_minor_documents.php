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
        Schema::create('document_issuers', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('minor_documents', function (Blueprint $table): void {
            $table->foreignId('document_issuer_id')->nullable()->after('attachment_id')->constrained('document_issuers')->nullOnDelete();
        });

        $defaults = [
            ['code' => 'COMUNE', 'name' => 'Comune', 'description' => 'Comune o ufficio anagrafe.', 'sort_order' => 10],
            ['code' => 'QUESTURA', 'name' => 'Questura', 'description' => 'Questura o ufficio passaporti.', 'sort_order' => 20],
            ['code' => 'TRIBUNALE', 'name' => 'Tribunale per i minorenni', 'description' => 'Autorità giudiziaria minorile.', 'sort_order' => 30],
            ['code' => 'ASL', 'name' => 'ASL / Azienda sanitaria', 'description' => 'Ente sanitario territoriale.', 'sort_order' => 40],
            ['code' => 'SCUOLA', 'name' => 'Scuola / Istituto', 'description' => 'Istituto scolastico.', 'sort_order' => 50],
            ['code' => 'ALTRO_ENTE', 'name' => 'Altro ente', 'description' => 'Ente esterno generico.', 'sort_order' => 60],
        ];

        foreach ($defaults as $issuer) {
            DB::table('document_issuers')->updateOrInsert(
                ['code' => $issuer['code']],
                [...$issuer, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]
            );
        }

        $legacyIssuers = DB::table('minor_documents')
            ->select('issued_by')
            ->whereNotNull('issued_by')
            ->where('issued_by', '<>', '')
            ->distinct()
            ->pluck('issued_by');

        foreach ($legacyIssuers as $legacyIssuer) {
            $normalizedCode = Str::upper(Str::slug(Str::limit((string) $legacyIssuer, 40, ''), '_'));
            $code = $normalizedCode !== '' ? $normalizedCode : 'ISSUER_'.Str::upper(Str::random(8));

            if (DB::table('document_issuers')->where('code', $code)->exists()) {
                $code = $code.'_'.Str::upper(Str::random(4));
            }

            $issuerId = DB::table('document_issuers')->insertGetId([
                'code' => $code,
                'name' => $legacyIssuer,
                'description' => 'Creato automaticamente dalla migrazione dei documenti minore esistenti.',
                'sort_order' => 500,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('minor_documents')
                ->where('issued_by', $legacyIssuer)
                ->update([
                    'document_issuer_id' => $issuerId,
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('minor_documents', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('document_issuer_id');
        });

        Schema::dropIfExists('document_issuers');
    }
};
