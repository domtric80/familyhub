<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minor_documents', function (Blueprint $table): void {
            $table->string('label', 255)->nullable()->after('attachment_id');
            $table->index('label');
        });

        $documents = DB::table('minor_documents')
            ->join('attachments', 'attachments.id', '=', 'minor_documents.attachment_id')
            ->whereNull('minor_documents.label')
            ->select(['minor_documents.id', 'attachments.original_name'])
            ->get();

        foreach ($documents as $document) {
            $baseName = pathinfo((string) $document->original_name, PATHINFO_FILENAME);

            DB::table('minor_documents')
                ->where('id', $document->id)
                ->update([
                    'label' => $baseName !== '' ? $baseName : null,
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('minor_documents', function (Blueprint $table): void {
            $table->dropIndex(['label']);
            $table->dropColumn('label');
        });
    }
};
