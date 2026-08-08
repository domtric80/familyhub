<?php

use App\Models\MinorExitAccompanier;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_exit_accompaniers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('minor_exit_id')->constrained('minor_exits')->cascadeOnDelete();
            $table->string('person_type', 30);
            $table->foreignId('staff_member_id')->nullable()->constrained('staff_members')->nullOnDelete();
            $table->foreignId('minor_contact_id')->nullable()->constrained('minor_contacts')->nullOnDelete();
            $table->string('external_name', 255)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['minor_exit_id', 'person_type']);
        });

        DB::table('minor_exits')
            ->whereNotNull('accompanied_by')
            ->where('accompanied_by', '<>', '')
            ->orderBy('id')
            ->chunkById(100, function ($exits): void {
                $now = now();

                $rows = $exits->map(function ($exit) use ($now): array {
                    return [
                        'minor_exit_id' => $exit->id,
                        'person_type' => MinorExitAccompanier::TYPE_EXTERNAL,
                        'external_name' => $exit->accompanied_by,
                        'notes' => 'Migrato da campo legacy accompanied_by',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                })->all();

                DB::table('minor_exit_accompaniers')->insert($rows);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_exit_accompaniers');
    }
};
