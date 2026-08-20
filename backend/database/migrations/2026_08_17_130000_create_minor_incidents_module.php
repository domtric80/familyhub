<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incident_types', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('incident_severity_levels', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 80);
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('incident_statuses', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_terminal')->default(false);
            $table->timestamps();
        });
        Schema::create('minor_incidents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained()->restrictOnDelete();
            $table->foreignId('minor_id')->constrained()->restrictOnDelete();
            $table->foreignId('incident_type_id')->constrained('incident_types')->restrictOnDelete();
            $table->foreignId('severity_level_id')->constrained('incident_severity_levels')->restrictOnDelete();
            $table->foreignId('status_id')->constrained('incident_statuses')->restrictOnDelete();
            $table->timestamp('occurred_at');
            $table->text('location')->nullable();
            $table->text('description');
            $table->text('immediate_actions')->nullable();
            $table->boolean('requires_external_notification')->default(false);
            $table->foreignId('reported_by_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['facility_id', 'occurred_at'], 'minor_incidents_facility_date_idx');
            $table->index(['minor_id', 'occurred_at'], 'minor_incidents_minor_date_idx');
            $table->index(['status_id', 'severity_level_id'], 'minor_incidents_status_severity_idx');
        });
        Schema::create('minor_incident_transitions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_incident_id')->constrained('minor_incidents')->cascadeOnDelete();
            $table->foreignId('from_status_id')->nullable()->constrained('incident_statuses')->restrictOnDelete();
            $table->foreignId('to_status_id')->constrained('incident_statuses')->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('performed_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('performed_at');
            $table->timestamps();
            $table->index(['minor_incident_id', 'performed_at'], 'minor_incident_transitions_timeline_idx');
        });
        Schema::create('minor_incident_analyses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_incident_id')->unique()->constrained('minor_incidents')->cascadeOnDelete();
            $table->text('root_cause');
            $table->text('corrective_measures');
            $table->foreignId('responsible_staff_member_id')->nullable()->constrained('staff_members')->restrictOnDelete();
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('updated_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
        Schema::create('minor_incident_external_notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('minor_incident_id')->constrained('minor_incidents')->cascadeOnDelete();
            $table->foreignId('document_issuer_id')->constrained('document_issuers')->restrictOnDelete();
            $table->timestamp('notified_at');
            $table->text('reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('sent_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['minor_incident_id', 'notified_at'], 'minor_incident_notifications_timeline_idx');
        });

        $now = now();
        DB::table('incident_types')->insert([
            ['code' => 'FALL', 'name' => 'Caduta', 'description' => 'Caduta accidentale o evento assimilabile.', 'sort_order' => 10, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'AGGRESSION', 'name' => 'Aggressione', 'description' => 'Aggressione fisica o comportamento violento.', 'sort_order' => 20, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'SELF_HARM', 'name' => 'Autolesionismo', 'description' => 'Comportamento autolesivo osservato o tentato.', 'sort_order' => 30, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'ESCAPE', 'name' => 'Fuga o allontanamento', 'description' => 'Fuga o allontanamento non autorizzato.', 'sort_order' => 40, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'CRISIS', 'name' => 'Crisi', 'description' => 'Crisi emotiva, comportamentale o altra situazione critica.', 'sort_order' => 50, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
        DB::table('incident_severity_levels')->insert([
            ['code' => 'GREEN', 'name' => 'Verde', 'description' => 'Evento gestito senza conseguenze rilevanti immediate.', 'sort_order' => 10, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'YELLOW', 'name' => 'Giallo', 'description' => 'Evento che richiede attenzione e revisione tempestiva.', 'sort_order' => 20, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'RED', 'name' => 'Rosso', 'description' => 'Evento grave o urgente con escalation immediata.', 'sort_order' => 30, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
        DB::table('incident_statuses')->insert([
            ['code' => 'REPORTED', 'name' => 'Segnalato', 'description' => 'Segnalazione registrata dall’operatore.', 'sort_order' => 10, 'is_terminal' => false, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'COORDINATOR_REVIEWED', 'name' => 'Revisionato dal coordinatore', 'description' => 'Prima revisione operativa completata.', 'sort_order' => 20, 'is_terminal' => false, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'DIRECTOR_REVIEWED', 'name' => 'Revisionato dal direttore', 'description' => 'Revisione direttiva completata.', 'sort_order' => 30, 'is_terminal' => false, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'EXTERNAL_NOTIFIED', 'name' => 'Autorità informata', 'description' => 'Almeno una comunicazione esterna è stata registrata.', 'sort_order' => 40, 'is_terminal' => false, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'CLOSED', 'name' => 'Chiuso', 'description' => 'Workflow concluso.', 'sort_order' => 50, 'is_terminal' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        $permissionIds = [];
        foreach ([
            ['incident_types', 'create'], ['incident_types', 'read'], ['incident_types', 'update'], ['incident_types', 'delete'],
            ['minor_incidents', 'create'], ['minor_incidents', 'read'], ['minor_incidents', 'update'], ['minor_incidents', 'export'],
        ] as [$resource, $action]) {
            $code = $resource.'.'.$action;
            $permissionIds[$code] = DB::table('permissions')->insertGetId([
                'code' => $code, 'resource' => $resource, 'action' => $action,
                'description' => str($code)->replace('.', ' ')->replace('_', ' ')->title()->toString(),
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        $grants = [
            'SUPER_ADMIN' => array_keys($permissionIds),
            'ADMIN_IT' => ['incident_types.create', 'incident_types.read', 'incident_types.update', 'incident_types.delete'],
            'DIRETTORE' => array_keys($permissionIds),
            'COORDINATORE' => ['incident_types.read', 'minor_incidents.create', 'minor_incidents.read', 'minor_incidents.update', 'minor_incidents.export'],
            'REFERENTE_STRUTTURA' => ['incident_types.read', 'minor_incidents.create', 'minor_incidents.read', 'minor_incidents.update', 'minor_incidents.export'],
            'PSICOLOGO' => ['incident_types.read', 'minor_incidents.create', 'minor_incidents.read', 'minor_incidents.update'],
            'EDUCATORE' => ['incident_types.read', 'minor_incidents.create', 'minor_incidents.read', 'minor_incidents.update'],
            'EDUCATORE_NOTTURNO' => ['incident_types.read', 'minor_incidents.create', 'minor_incidents.read', 'minor_incidents.update'],
            'ASSISTENTE_SOCIALE_EST' => ['incident_types.read', 'minor_incidents.read'],
        ];
        foreach ($grants as $roleCode => $codes) {
            $roleId = DB::table('roles')->where('code', $roleCode)->value('id');
            foreach ($codes as $code) {
                DB::table('role_permissions')->insertOrIgnore([
                    'role_id' => $roleId, 'permission_id' => $permissionIds[$code], 'created_at' => $now, 'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('minor_incident_external_notifications');
        Schema::dropIfExists('minor_incident_analyses');
        Schema::dropIfExists('minor_incident_transitions');
        Schema::dropIfExists('minor_incidents');
        Schema::dropIfExists('incident_statuses');
        Schema::dropIfExists('incident_severity_levels');
        Schema::dropIfExists('incident_types');
        $codes = ['incident_types.create', 'incident_types.read', 'incident_types.update', 'incident_types.delete', 'minor_incidents.create', 'minor_incidents.read', 'minor_incidents.update', 'minor_incidents.export'];
        $ids = DB::table('permissions')->whereIn('code', $codes)->pluck('id');
        DB::table('role_permissions')->whereIn('permission_id', $ids)->delete();
        DB::table('permissions')->whereIn('id', $ids)->delete();
    }
};
