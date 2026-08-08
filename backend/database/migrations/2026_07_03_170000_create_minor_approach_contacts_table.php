<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_approach_contacts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_approach_id')->constrained('minor_approaches')->cascadeOnDelete();
            $table->foreignId('minor_contact_id')->constrained('minor_contacts')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['minor_approach_id', 'minor_contact_id'], 'minor_approach_contacts_unique');
            $table->index(['minor_contact_id', 'minor_approach_id'], 'minor_approach_contacts_contact_idx');
        });

        $rows = DB::table('minor_approaches')
            ->whereNotNull('minor_contact_id')
            ->select(['id', 'minor_contact_id'])
            ->get();

        $now = now();

        foreach ($rows as $row) {
            DB::table('minor_approach_contacts')->updateOrInsert(
                [
                    'minor_approach_id' => $row->id,
                    'minor_contact_id' => $row->minor_contact_id,
                ],
                [
                    'sort_order' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_approach_contacts');
    }
};
