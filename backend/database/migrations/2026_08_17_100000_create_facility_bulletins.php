<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facility_bulletins', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facility_id')->constrained()->restrictOnDelete();
            $table->text('title');
            $table->longText('body');
            $table->string('status', 20)->default('DRAFT');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('published_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['facility_id', 'status', 'published_at'], 'facility_bulletins_scope_idx');
            $table->index(['facility_id', 'expires_at'], 'facility_bulletins_expiry_idx');
        });
        Schema::create('facility_bulletin_role_targets', function (Blueprint $table): void {
            $table->id(); $table->foreignId('facility_bulletin_id')->constrained()->cascadeOnDelete(); $table->foreignId('role_id')->constrained()->restrictOnDelete(); $table->timestamps();
            $table->unique(['facility_bulletin_id', 'role_id'], 'facility_bulletin_role_target_unique');
        });
        Schema::create('facility_bulletin_acknowledgements', function (Blueprint $table): void {
            $table->id(); $table->foreignId('facility_bulletin_id')->constrained()->cascadeOnDelete(); $table->foreignId('user_id')->constrained()->restrictOnDelete(); $table->timestamp('acknowledged_at'); $table->timestamps();
            $table->unique(['facility_bulletin_id', 'user_id'], 'facility_bulletin_ack_unique');
            $table->index(['user_id', 'acknowledged_at'], 'facility_bulletin_ack_user_idx');
        });

        $definitions = [['read', 'Lettura circolari di struttura'], ['manage', 'Gestione bozze circolari'], ['publish', 'Pubblicazione circolari'], ['acknowledge', 'Presa visione circolari']];
        $permissions = collect($definitions)->mapWithKeys(fn (array $item) => [$item[0] => Permission::query()->firstOrCreate(['code' => "facility_bulletins.{$item[0]}"], ['resource' => 'facility_bulletins', 'action' => $item[0], 'description' => $item[1]])]);
        Role::query()->whereIn('code', ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA'])->get()->each(fn (Role $role) => $role->permissions()->syncWithoutDetaching($permissions->pluck('id')->all()));
        Role::query()->whereIn('code', ['PSICOLOGO', 'PEDIATRA', 'EDUCATORE', 'EDUCATORE_NOTTURNO', 'ASSISTENTE_SOCIALE_EST'])->get()->each(fn (Role $role) => $role->permissions()->syncWithoutDetaching([$permissions['read']->id, $permissions['acknowledge']->id]));
    }

    public function down(): void
    {
        Permission::query()->where('resource', 'facility_bulletins')->get()->each(function (Permission $permission): void { $permission->roles()->detach(); $permission->delete(); });
        Schema::dropIfExists('facility_bulletin_acknowledgements'); Schema::dropIfExists('facility_bulletin_role_targets'); Schema::dropIfExists('facility_bulletins');
    }
};
