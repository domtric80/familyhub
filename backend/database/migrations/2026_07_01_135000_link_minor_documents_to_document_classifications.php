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
        Schema::table('minor_documents', function (Blueprint $table): void {
            $table->string('classification_code', 50)->nullable()->after('classification');
            $table->index('classification_code');
        });

        $now = now();
        $existingCodes = DB::table('document_classifications')->pluck('code')->all();

        $legacyClassifications = DB::table('minor_documents')
            ->select('classification')
            ->whereNotNull('classification')
            ->where('classification', '<>', '')
            ->distinct()
            ->pluck('classification');

        foreach ($legacyClassifications as $legacyClassification) {
            $raw = trim((string) $legacyClassification);
            $candidate = Str::lower($raw);

            $code = in_array($candidate, $existingCodes, true)
                ? $candidate
                : match ($candidate) {
                    'interno' => 'internal',
                    'riservato' => 'restricted',
                    'clinico' => 'clinical',
                    'giudiziario' => 'judicial',
                    default => $candidate,
                };

            if (! in_array($code, $existingCodes, true)) {
                continue;
            }

            DB::table('minor_documents')
                ->where('classification', $legacyClassification)
                ->update([
                    'classification_code' => $code,
                    'updated_at' => $now,
                ]);
        }

        Schema::table('minor_documents', function (Blueprint $table): void {
            $table->foreign('classification_code')
                ->references('code')
                ->on('document_classifications')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('minor_documents', function (Blueprint $table): void {
            $table->dropForeign(['classification_code']);
            $table->dropIndex(['classification_code']);
            $table->dropColumn('classification_code');
        });
    }
};
