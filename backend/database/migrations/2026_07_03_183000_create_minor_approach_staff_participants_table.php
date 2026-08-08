<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_approach_staff_participants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_approach_id')->constrained('minor_approaches')->cascadeOnDelete();
            $table->foreignId('staff_member_id')->constrained('staff_members')->cascadeOnDelete();
            $table->string('qualification_code', 50)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['minor_approach_id', 'staff_member_id'], 'minor_approach_staff_participants_unique');
            $table->index(['staff_member_id', 'minor_approach_id'], 'minor_approach_staff_participants_staff_idx');
            $table->foreign('qualification_code')
                ->references('code')
                ->on('staff_qualifications')
                ->nullOnDelete();
        });

        $rows = DB::table('minor_approaches')
            ->whereNotNull('supervising_staff_member_id')
            ->select(['id', 'supervising_staff_member_id'])
            ->get();

        $now = now();

        foreach ($rows as $row) {
            $qualificationCode = DB::table('staff_members')
                ->where('id', $row->supervising_staff_member_id)
                ->value('qualification_code');

            DB::table('minor_approach_staff_participants')->updateOrInsert(
                [
                    'minor_approach_id' => $row->id,
                    'staff_member_id' => $row->supervising_staff_member_id,
                ],
                [
                    'qualification_code' => $qualificationCode,
                    'sort_order' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_approach_staff_participants');
    }
};
