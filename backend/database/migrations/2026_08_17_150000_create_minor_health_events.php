<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minor_health_event_categories', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 120);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('minor_health_event_statuses', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 80);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('minor_health_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained()->restrictOnDelete();
            $table->foreignId('minor_id')->constrained()->restrictOnDelete();
            $table->foreignId('category_id')->constrained('minor_health_event_categories')->restrictOnDelete();
            $table->foreignId('status_id')->constrained('minor_health_event_statuses')->restrictOnDelete();
            $table->timestamp('scheduled_at');
            $table->timestamp('occurred_at')->nullable();
            $table->foreignId('provider_staff_member_id')->nullable()->constrained('staff_members')->restrictOnDelete();
            $table->foreignId('health_authority_document_issuer_id')->nullable()->constrained('document_issuers')->restrictOnDelete();
            $table->foreignId('linked_minor_document_id')->nullable()->constrained('minor_documents')->restrictOnDelete();
            $table->text('reason')->nullable();
            $table->text('clinical_findings')->nullable();
            $table->text('outcome_notes')->nullable();
            $table->timestamp('follow_up_at')->nullable();
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['minor_id', 'scheduled_at'], 'minor_health_events_minor_schedule_idx');
            $table->index(['facility_id', 'status_id', 'scheduled_at'], 'minor_health_events_facility_status_idx');
            $table->index(['follow_up_at', 'status_id'], 'minor_health_events_follow_up_idx');
        });

        $now = now();
        foreach ([['PEDIATRIC_VISIT','Visita pediatrica'],['GENERAL_VISIT','Visita medica generale'],['SPECIALIST_VISIT','Visita specialistica'],['LAB_EXAM','Esame di laboratorio'],['DIAGNOSTIC_EXAM','Esame diagnostico'],['EMERGENCY_ROOM','Accesso al pronto soccorso']] as $index => [$code, $name]) {
            DB::table('minor_health_event_categories')->insert(['code'=>$code,'name'=>$name,'sort_order'=>($index+1)*10,'is_active'=>true,'created_at'=>$now,'updated_at'=>$now]);
        }
        foreach ([['SCHEDULED','Programmato'],['COMPLETED','Completato'],['CANCELLED','Annullato']] as $index => [$code, $name]) {
            DB::table('minor_health_event_statuses')->insert(['code'=>$code,'name'=>$name,'sort_order'=>($index+1)*10,'created_at'=>$now,'updated_at'=>$now]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_health_events');
        Schema::dropIfExists('minor_health_event_statuses');
        Schema::dropIfExists('minor_health_event_categories');
    }
};
