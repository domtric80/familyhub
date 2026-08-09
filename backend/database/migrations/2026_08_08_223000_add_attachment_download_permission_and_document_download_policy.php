<?php

use App\Models\DocumentClassification;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('document_classifications', 'allowed_download_role_codes')) {
            Schema::table('document_classifications', function (Blueprint $table): void {
                $table->json('allowed_download_role_codes')->nullable()->after('allowed_role_codes');
            });
        }

        $permission = Permission::query()->firstOrCreate(
            ['code' => 'attachments.download'],
            [
                'resource' => 'attachments',
                'action' => 'download',
                'description' => 'Attachments Download',
            ]
        );

        Role::query()
            ->whereIn('code', ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA', 'PSICOLOGO', 'PEDIATRA'])
            ->get()
            ->each(function (Role $role) use ($permission): void {
                if (! $role->permissions()->where('permissions.id', $permission->id)->exists()) {
                    $role->permissions()->attach($permission->id);
                }
            });

        $downloadPolicies = [
            'internal' => ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA', 'PSICOLOGO'],
            'restricted' => ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA', 'PSICOLOGO'],
            'clinical' => ['SUPER_ADMIN', 'DIRETTORE', 'PSICOLOGO', 'PEDIATRA'],
            'judicial' => ['SUPER_ADMIN', 'DIRETTORE'],
        ];

        foreach ($downloadPolicies as $classificationCode => $allowedDownloadRoleCodes) {
            $classification = DocumentClassification::query()->where('code', $classificationCode)->first();

            if (! $classification) {
                continue;
            }

            $classification->forceFill([
                'allowed_role_codes' => collect($classification->allowed_role_codes ?? [])
                    ->when(
                        in_array($classificationCode, ['internal', 'restricted'], true),
                        fn ($codes) => $codes->push('REFERENTE_STRUTTURA')
                    )
                    ->unique()
                    ->values()
                    ->all(),
                'allowed_download_role_codes' => $allowedDownloadRoleCodes,
            ])->save();
        }
    }

    public function down(): void
    {
        $permission = Permission::query()->where('code', 'attachments.download')->first();

        if ($permission) {
            $permission->roles()->detach();
            $permission->delete();
        }

        if (Schema::hasColumn('document_classifications', 'allowed_download_role_codes')) {
            Schema::table('document_classifications', function (Blueprint $table): void {
                $table->dropColumn('allowed_download_role_codes');
            });
        }
    }
};
