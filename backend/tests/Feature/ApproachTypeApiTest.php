<?php

namespace Tests\Feature;

use App\Models\ApproachType;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApproachTypeApiTest extends TestCase
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
            'device_name' => 'phpunit-approach-types',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_lookup_approach_types_returns_active_lookup_values(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/lookups/approach-types')
            ->assertOk()
            ->assertJsonPath('0.code', 'FAMILY_VISIT');
    }

    public function test_admin_can_create_update_and_delete_approach_type(): void
    {
        $createResponse = $this->withToken($this->token)
            ->postJson('/api/admin/approach-types', [
                'code' => 'TEST_APPROACH',
                'name' => 'Test approccio',
                'description' => 'Tipologia di test',
                'sort_order' => 90,
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('code', 'TEST_APPROACH');

        $approachTypeId = $createResponse->json('id');

        $this->withToken($this->token)
            ->putJson("/api/admin/approach-types/{$approachTypeId}", [
                'code' => 'TEST_APPROACH',
                'name' => 'Test approccio aggiornato',
                'description' => 'Tipologia aggiornata',
                'sort_order' => 95,
                'is_active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Test approccio aggiornato')
            ->assertJsonPath('is_active', false);

        $this->withToken($this->token)
            ->deleteJson("/api/admin/approach-types/{$approachTypeId}")
            ->assertNoContent();

        $this->assertDatabaseMissing('approach_types', [
            'id' => $approachTypeId,
        ]);
    }

    public function test_admin_cannot_reuse_existing_approach_type_code(): void
    {
        $existing = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();

        $this->withToken($this->token)
            ->postJson('/api/admin/approach-types', [
                'code' => $existing->code,
                'name' => 'Duplicato',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }
}
