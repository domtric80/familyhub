<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JournalEntryTypeApiTest extends TestCase
{
    use RefreshDatabase;

    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'phpunit-journal-entry-types',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_lookup_journal_entry_types_returns_active_values(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/lookups/journal-entry-types')
            ->assertOk()
            ->assertJsonPath('0.code', 'OBSERVATION');
    }
}
