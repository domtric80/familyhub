<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medications', function (Blueprint $t): void { $t->id(); $t->string('code', 80)->unique(); $t->string('name', 180); $t->string('active_ingredient', 180)->nullable(); $t->boolean('is_active')->default(true); $t->timestamps(); });
        Schema::create('medication_dosage_units', function (Blueprint $t): void { $t->id(); $t->string('code', 30)->unique(); $t->string('name', 80); $t->unsignedInteger('sort_order')->default(0); $t->boolean('is_active')->default(true); $t->timestamps(); });
        Schema::create('medication_administration_routes', function (Blueprint $t): void { $t->id(); $t->string('code', 40)->unique(); $t->string('name', 100); $t->unsignedInteger('sort_order')->default(0); $t->boolean('is_active')->default(true); $t->timestamps(); });
        Schema::create('medication_administration_outcomes', function (Blueprint $t): void { $t->id(); $t->string('code', 40)->unique(); $t->string('name', 100); $t->unsignedInteger('sort_order')->default(0); $t->timestamps(); });
        Schema::create('minor_medication_plans', function (Blueprint $t): void {
            $t->id(); $t->foreignId('facility_id')->constrained()->restrictOnDelete(); $t->foreignId('minor_id')->constrained()->restrictOnDelete(); $t->foreignId('medication_id')->constrained()->restrictOnDelete(); $t->decimal('dose_quantity', 12, 3); $t->foreignId('dosage_unit_id')->constrained('medication_dosage_units')->restrictOnDelete(); $t->foreignId('administration_route_id')->constrained('medication_administration_routes')->restrictOnDelete(); $t->foreignId('prescriber_staff_member_id')->constrained('staff_members')->restrictOnDelete(); $t->foreignId('prescription_minor_document_id')->nullable()->constrained('minor_documents')->restrictOnDelete(); $t->date('start_date'); $t->date('end_date')->nullable(); $t->text('instructions')->nullable(); $t->boolean('is_active')->default(true); $t->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete(); $t->foreignId('updated_by_user_id')->nullable()->constrained('users')->restrictOnDelete(); $t->timestamps(); $t->index(['minor_id', 'is_active', 'end_date'], 'minor_medication_plans_active_idx');
        });
        Schema::create('minor_medication_schedules', function (Blueprint $t): void { $t->id(); $t->foreignId('minor_medication_plan_id')->constrained()->cascadeOnDelete(); $t->time('time_of_day'); $t->json('days_of_week'); $t->boolean('as_needed')->default(false); $t->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete(); $t->timestamps(); $t->unique(['minor_medication_plan_id', 'time_of_day'], 'minor_medication_schedule_unique'); });
        Schema::create('minor_medication_administrations', function (Blueprint $t): void { $t->id(); $t->foreignId('minor_medication_plan_id')->constrained()->restrictOnDelete(); $t->foreignId('minor_medication_schedule_id')->nullable()->constrained()->restrictOnDelete(); $t->timestamp('scheduled_for'); $t->timestamp('administered_at')->nullable(); $t->foreignId('outcome_id')->constrained('medication_administration_outcomes')->restrictOnDelete(); $t->text('notes')->nullable(); $t->foreignId('administered_by_user_id')->constrained('users')->restrictOnDelete(); $t->string('signature_type', 60); $t->timestamp('signed_at'); $t->timestamps(); $t->unique(['minor_medication_plan_id', 'scheduled_for'], 'minor_medication_administration_unique'); $t->index(['administered_by_user_id', 'signed_at'], 'minor_medication_administration_actor_idx'); });

        $now = now();
        foreach ([['MG','Milligrammi'],['G','Grammi'],['ML','Millilitri'],['TABLET','Compresse'],['DROP','Gocce']] as $i => [$code,$name]) DB::table('medication_dosage_units')->insert(['code'=>$code,'name'=>$name,'sort_order'=>($i+1)*10,'is_active'=>true,'created_at'=>$now,'updated_at'=>$now]);
        foreach ([['ORAL','Orale'],['TOPICAL','Topica'],['INHALATION','Inalatoria'],['INJECTION','Iniettiva']] as $i => [$code,$name]) DB::table('medication_administration_routes')->insert(['code'=>$code,'name'=>$name,'sort_order'=>($i+1)*10,'is_active'=>true,'created_at'=>$now,'updated_at'=>$now]);
        foreach ([['ADMINISTERED','Somministrato'],['REFUSED','Rifiutato'],['MISSED','Non somministrato'],['HELD','Sospeso']] as $i => [$code,$name]) DB::table('medication_administration_outcomes')->insert(['code'=>$code,'name'=>$name,'sort_order'=>($i+1)*10,'created_at'=>$now,'updated_at'=>$now]);

        $ids=[]; foreach ([['medication_catalog','create'],['medication_catalog','read'],['medication_catalog','update'],['medication_catalog','delete'],['minor_health','create'],['minor_health','read'],['minor_health','update'],['minor_health','administer'],['minor_health','export']] as [$r,$a]) { $c="$r.$a"; $ids[$c]=DB::table('permissions')->insertGetId(['code'=>$c,'resource'=>$r,'action'=>$a,'description'=>str($c)->replace('.',' ')->replace('_',' ')->title(),'created_at'=>$now,'updated_at'=>$now]); }
        $grants=['SUPER_ADMIN'=>array_keys($ids),'ADMIN_IT'=>['medication_catalog.create','medication_catalog.read','medication_catalog.update','medication_catalog.delete'],'DIRETTORE'=>array_keys($ids),'PEDIATRA'=>['medication_catalog.read','minor_health.create','minor_health.read','minor_health.update','minor_health.export'],'EDUCATORE'=>['medication_catalog.read','minor_health.read','minor_health.administer'],'EDUCATORE_NOTTURNO'=>['medication_catalog.read','minor_health.read','minor_health.administer']];
        foreach ($grants as $role => $codes) {
            $roleId = DB::table('roles')->where('code', $role)->value('id');
            if ($roleId === null) {
                continue;
            }

            foreach ($codes as $code) {
                DB::table('role_permissions')->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => $ids[$code],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
    public function down(): void
    {
        Schema::dropIfExists('minor_medication_administrations'); Schema::dropIfExists('minor_medication_schedules'); Schema::dropIfExists('minor_medication_plans'); Schema::dropIfExists('medication_administration_outcomes'); Schema::dropIfExists('medication_administration_routes'); Schema::dropIfExists('medication_dosage_units'); Schema::dropIfExists('medications');
        $ids=DB::table('permissions')->whereIn('resource',['medication_catalog','minor_health'])->pluck('id'); DB::table('role_permissions')->whereIn('permission_id',$ids)->delete(); DB::table('permissions')->whereIn('id',$ids)->delete();
    }
};
