<?php

use App\Models\DocumentClassification;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $role = Role::query()->updateOrCreate(
            ['code' => 'PEDIATRA'],
            [
                'name' => 'Pediatra',
                'description' => 'Accesso clinico sanitario limitato ai minori assegnati',
                'is_system' => true,
            ],
        );

        $permissionIds = Permission::query()
            ->whereIn('code', [
                'facilities.read',
                'minors.read',
                'minor_profiles.read',
                'attachments.read',
                'minor_exits.read',
                'minor_activities.read',
                'internal_messages.read',
            ])
            ->pluck('id')
            ->all();

        if ($permissionIds !== []) {
            $role->permissions()->syncWithoutDetaching($permissionIds);
        }

        $clinical = DocumentClassification::query()->where('code', 'clinical')->first();

        if ($clinical) {
            $clinical->forceFill([
                'allowed_role_codes' => collect($clinical->allowed_role_codes ?? [])
                    ->push('PEDIATRA')
                    ->unique()
                    ->values()
                    ->all(),
            ])->save();
        }
    }

    public function down(): void
    {
        $clinical = DocumentClassification::query()->where('code', 'clinical')->first();

        if ($clinical) {
            $clinical->forceFill([
                'allowed_role_codes' => collect($clinical->allowed_role_codes ?? [])
                    ->reject(fn (string $roleCode): bool => $roleCode === 'PEDIATRA')
                    ->values()
                    ->all(),
            ])->save();
        }

        $role = Role::query()->where('code', 'PEDIATRA')->first();

        if ($role && $role->is_system) {
            $role->permissions()->detach();
            $role->delete();
        }
    }
};
