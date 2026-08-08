<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetAdminAccessCommand extends Command
{
    protected $signature = 'familyhub:reset-admin-access
        {email=admin@familyhub.local : Email dell\'utente amministratore}
        {--password=password : Nuova password}
        {--disable-mfa : Disabilita MFA e pulisce i segreti}';

    protected $description = 'Ripristina in modo sicuro l’accesso di un amministratore FamilyHub.';

    public function handle(): int
    {
        $user = User::query()->where('email', (string) $this->argument('email'))->first();

        if (! $user) {
            $this->warn('Utente amministratore non trovato, eseguo prima il bootstrap minimo.');
            $this->call('familyhub:ensure-bootstrap', [
                '--admin-email' => (string) $this->argument('email'),
                '--admin-password' => (string) $this->option('password'),
                '--force-admin-password' => true,
                '--disable-admin-mfa' => (bool) $this->option('disable-mfa'),
            ]);

            $user = User::query()->where('email', (string) $this->argument('email'))->first();
        }

        if (! $user) {
            $this->error('Utente amministratore non trovato anche dopo il bootstrap.');

            return self::FAILURE;
        }

        $payload = [
            'password' => Hash::make((string) $this->option('password')),
            'is_active' => true,
        ];

        if ($this->option('disable-mfa')) {
            $payload['mfa_required'] = false;
            $payload['mfa_secret_encrypted'] = null;
            $payload['mfa_recovery_codes_encrypted'] = null;
            $payload['mfa_confirmed_at'] = null;
        }

        $user->forceFill($payload)->save();

        $this->info('Accesso amministratore ripristinato.');

        return self::SUCCESS;
    }
}
