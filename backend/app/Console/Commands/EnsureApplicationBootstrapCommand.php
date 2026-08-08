<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\Facility;
use App\Models\Organization;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\GeographySeeder;
use Database\Seeders\LookupSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EnsureApplicationBootstrapCommand extends Command
{
    protected $signature = 'familyhub:ensure-bootstrap
        {--admin-email=admin@familyhub.local : Email dell\'utente amministratore}
        {--admin-password=password : Password amministratore di bootstrap}
        {--force-admin-password : Forza l\'aggiornamento della password admin}
        {--disable-admin-mfa : Disabilita MFA per l\'utente admin durante il bootstrap}
        {--seed-missing-only : Ripristina solo i dataset minimi mancanti}';

    protected $description = 'Verifica e ripristina in modo idempotente il bootstrap minimo applicativo.';

    public function handle(): int
    {
        DB::transaction(function (): void {
            $this->ensureReferenceData();
            $this->ensureAdminBootstrap();
        });

        $this->info('Bootstrap applicativo verificato.');

        return self::SUCCESS;
    }

    private function ensureReferenceData(): void
    {
        if (Role::query()->count() === 0 || Permission::query()->count() === 0) {
            $this->components->info('RBAC assente: eseguo RbacSeeder.');
            $this->callSilent('db:seed', ['--class' => RbacSeeder::class, '--force' => true]);
        }

        if (City::query()->count() === 0) {
            $this->components->info('Geografia assente: eseguo GeographySeeder.');
            $this->callSilent('db:seed', ['--class' => GeographySeeder::class, '--force' => true]);
        }

        if ($this->shouldSeedLookups()) {
            $this->components->info('Lookup assenti: eseguo LookupSeeder.');
            $this->callSilent('db:seed', ['--class' => LookupSeeder::class, '--force' => true]);
        }
    }

    private function ensureAdminBootstrap(): void
    {
        $adminEmail = (string) $this->option('admin-email');
        $adminPassword = (string) $this->option('admin-password');
        $forceAdminPassword = (bool) $this->option('force-admin-password');
        $disableAdminMfa = (bool) $this->option('disable-admin-mfa');

        $user = User::query()->where('email', $adminEmail)->first();

        if (! $user) {
            $this->components->info('Utente admin assente: creo account bootstrap.');

            $user = User::query()->create([
                'uuid' => '11111111-1111-1111-1111-111111111111',
                'email' => $adminEmail,
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'password' => Hash::make($adminPassword),
                'mfa_required' => ! $disableAdminMfa,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        } else {
            $payload = [
                'is_active' => true,
            ];

            if ($forceAdminPassword) {
                $payload['password'] = Hash::make($adminPassword);
            }

            if ($disableAdminMfa) {
                $payload['mfa_required'] = false;
                $payload['mfa_secret_encrypted'] = null;
                $payload['mfa_recovery_codes_encrypted'] = null;
                $payload['mfa_confirmed_at'] = null;
            }

            $user->forceFill($payload)->save();
        }

        $organization = Organization::query()->firstOrCreate(
            ['name' => 'FamilyHub Demo Organization'],
            [
                'legal_name' => 'FamilyHub Demo Organization',
                'email' => 'info@familyhub.local',
            ],
        );

        $city = City::query()->where('name', 'Roma')->first();

        if (! $city) {
            throw new \RuntimeException('Città bootstrap Roma non disponibile: geografia non inizializzata.');
        }

        $facility = Facility::query()->firstOrCreate(
            [
                'organization_id' => $organization->id,
                'code' => 'FH-ROMA-01',
            ],
            [
                'name' => 'FamilyHub Roma Demo',
                'address_line' => 'Via Demo 1',
                'city_id' => $city->id,
                'postal_code' => '00100',
                'capacity' => 20,
                'status' => 'active',
            ],
        );

        $role = Role::query()->where('code', 'SUPER_ADMIN')->first();

        if (! $role) {
            throw new \RuntimeException('Ruolo SUPER_ADMIN non disponibile: RBAC non inizializzato.');
        }

        UserFacilityRole::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'facility_id' => $facility->id,
                'role_id' => $role->id,
            ],
            [
                'valid_from' => now(),
                'valid_to' => null,
                'is_active' => true,
                'assigned_by_user_id' => $user->id,
            ],
        );
    }

    private function shouldSeedLookups(): bool
    {
        foreach (['contact_types', 'document_types', 'document_scopes', 'document_classifications', 'document_issuers', 'minor_statuses', 'gender_identities', 'biological_sexes', 'exit_types', 'activity_types', 'approach_types', 'journal_entry_types', 'staff_qualifications', 'staff_statuses', 'facility_statuses', 'staff_document_statuses'] as $table) {
            if (DB::table($table)->count() === 0) {
                return true;
            }
        }

        return false;
    }
}
