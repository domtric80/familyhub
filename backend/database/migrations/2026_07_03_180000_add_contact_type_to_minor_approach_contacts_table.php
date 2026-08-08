<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minor_approach_contacts', function (Blueprint $table): void {
            $table->foreignId('contact_type_id')
                ->nullable()
                ->after('minor_contact_id')
                ->constrained('contact_types')
                ->nullOnDelete();
        });

        $rows = DB::table('minor_approach_contacts')
            ->join('minor_contacts', 'minor_contacts.id', '=', 'minor_approach_contacts.minor_contact_id')
            ->whereNull('minor_approach_contacts.contact_type_id')
            ->select([
                'minor_approach_contacts.id',
                'minor_contacts.contact_type_id',
            ])
            ->get();

        foreach ($rows as $row) {
            DB::table('minor_approach_contacts')
                ->where('id', $row->id)
                ->update([
                    'contact_type_id' => $row->contact_type_id,
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('minor_approach_contacts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('contact_type_id');
        });
    }
};
