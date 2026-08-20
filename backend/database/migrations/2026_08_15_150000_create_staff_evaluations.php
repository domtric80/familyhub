<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_evaluation_criteria', function (Blueprint $table): void {
            $table->id(); $table->string('code', 50)->unique(); $table->string('name', 100); $table->text('description')->nullable(); $table->boolean('is_active')->default(true); $table->unsignedInteger('sort_order')->default(100); $table->timestamps();
        });
        Schema::create('staff_evaluations', function (Blueprint $table): void {
            $table->id(); $table->foreignId('facility_id')->constrained()->restrictOnDelete(); $table->foreignId('staff_member_id')->constrained()->restrictOnDelete(); $table->foreignId('evaluator_user_id')->constrained('users')->restrictOnDelete();
            $table->date('period_start'); $table->date('period_end'); $table->date('evaluation_date'); $table->string('status', 20)->default('DRAFT'); $table->decimal('overall_score', 3, 2)->nullable(); $table->text('summary')->nullable(); $table->timestamp('finalized_at')->nullable(); $table->foreignId('finalized_by_user_id')->nullable()->constrained('users')->nullOnDelete(); $table->timestamps(); $table->softDeletes();
            $table->unique(['staff_member_id', 'period_start', 'period_end'], 'staff_evaluations_staff_period_unique'); $table->index(['facility_id', 'status', 'evaluation_date']);
        });
        Schema::create('staff_evaluation_scores', function (Blueprint $table): void {
            $table->id(); $table->foreignId('staff_evaluation_id')->constrained()->cascadeOnDelete(); $table->foreignId('staff_evaluation_criterion_id')->constrained('staff_evaluation_criteria')->restrictOnDelete(); $table->unsignedTinyInteger('score'); $table->text('notes')->nullable(); $table->timestamps(); $table->unique(['staff_evaluation_id', 'staff_evaluation_criterion_id'], 'staff_evaluation_scores_unique');
        });
        foreach ([['COLLABORATION','Collaborazione con il team'],['RELIABILITY','Affidabilità e puntualità'],['EDUCATIONAL_COMPETENCE','Competenza educativa'],['COMMUNICATION','Comunicazione professionale'],['PROFESSIONAL_DEVELOPMENT','Sviluppo professionale']] as $index => [$code,$name]) {
            DB::table('staff_evaluation_criteria')->insert(['code'=>$code,'name'=>$name,'description'=>null,'is_active'=>true,'sort_order'=>($index + 1) * 10,'created_at'=>now(),'updated_at'=>now()]);
        }
        $permissions = collect([['read', 'Visualizzazione valutazioni HR riservate'], ['manage', 'Gestione valutazioni HR riservate']])->mapWithKeys(fn ($item) => [$item[0] => Permission::query()->firstOrCreate(['code' => "staff_evaluations.{$item[0]}"], ['resource' => 'staff_evaluations', 'action' => $item[0], 'description' => $item[1]])]);
        Role::query()->whereIn('code', ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA'])->get()->each(fn (Role $role) => $role->permissions()->syncWithoutDetaching([$permissions['read']->id, $permissions['manage']->id]));
    }
    public function down(): void { Permission::query()->whereIn('code', ['staff_evaluations.read', 'staff_evaluations.manage'])->get()->each(fn (Permission $item) => $item->delete()); Schema::dropIfExists('staff_evaluation_scores'); Schema::dropIfExists('staff_evaluations'); Schema::dropIfExists('staff_evaluation_criteria'); }
};
