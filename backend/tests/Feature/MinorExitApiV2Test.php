<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\City;
use App\Models\ExitType;
use App\Models\Facility;
use App\Models\GenderIdentity;
use App\Models\Minor;
use App\Models\MinorStatus;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MinorExitApiV2Test extends TestCase
{
    use RefreshDatabase;

    public function test_can_return_exit_summary(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor, $facility] = $this->createEducatorWithMinorAssignment();
        $exitTypeId = ExitType::query()->firstOrFail()->id;

        $this->withToken($token)->postJson('/api/exits', [
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'exit_type_id' => $exitTypeId,
            'destination' => 'Dentista',
            'planned_exit_at' => now()->subHour()->format('Y-m-d H:i:s'),
            'expected_return_at' => now()->subMinutes(30)->format('Y-m-d H:i:s'),
        ])->assertCreated();

        $exit = \App\Models\MinorExit::query()->latest('id')->firstOrFail();
        $exit->update([
            'status' => \App\Models\MinorExit::STATUS_OUT,
            'actual_exit_at' => now()->subHour(),
        ]);

        $this->withToken($token)
            ->getJson('/api/exits/summary?minor_id='.$minor->id)
            ->assertOk()
            ->assertJsonPath('summary.total', 1)
            ->assertJsonPath('summary.out', 1)
            ->assertJsonPath('summary.overdue_open', 1);
    }

    public function test_mark_returned_persists_structured_return_and_audit(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor, $facility] = $this->createEducatorWithMinorAssignment();
        $exitTypeId = ExitType::query()->firstOrFail()->id;

        $create = $this->withToken($token)->postJson('/api/exits', [
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'exit_type_id' => $exitTypeId,
            'destination' => 'Tribunale',
            'planned_exit_at' => '2026-07-02 09:00:00',
            'expected_return_at' => '2026-07-02 11:00:00',
        ])->assertCreated();

        $exitId = $create->json('id');

        $this->withToken($token)
            ->postJson('/api/exits/'.$exitId.'/mark-returned', [
                'actual_return_at' => '2026-07-02 11:20:00',
                'return_condition' => 'delayed',
                'follow_up_required' => true,
                'follow_up_notes' => 'Verifica con equipe educativa il ritardo.',
                'outcome_notes' => 'Rientro regolare ma in ritardo.',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'returned')
            ->assertJsonPath('return_condition', 'delayed')
            ->assertJsonPath('follow_up_required', true)
            ->assertJsonPath('delay_minutes', 20);

        $audit = AuditLog::query()
            ->where('resource_type', 'minor_exit')
            ->where('resource_id', (string) $exitId)
            ->latest('id')
            ->first();

        $this->assertNotNull($audit);
        $this->assertStringContainsString('Esito rientro: delayed', $audit->operation_summary);
        $this->assertStringContainsString('Follow-up: richiesto', $audit->operation_summary);
    }

    private function createEducatorWithMinorAssignment(): array
    {
        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();

        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-EXIT-V2-'.str()->upper(str()->random(6)),
            'first_name' => 'Luca',
            'last_name' => 'Verde',
            'birth_date' => '2013-02-01',
            'birth_city_id' => $city->id,
            'gender_identity_id' => $genderIdentity->id,
            'entry_date' => '2026-06-18',
            'minor_status_id' => $minorStatus->id,
        ]);

        $user = User::query()->create([
            'uuid' => (string) str()->uuid(),
            'email' => 'educatore.exitv2@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Marco',
            'last_name' => 'Educatore',
            'is_active' => true,
            'mfa_required' => false,
            'email_verified_at' => now(),
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $educatorRole->id,
            'valid_from' => now()->toDateString(),
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        \App\Models\MinorUserAssignment::query()->create([
            'minor_id' => $minor->id,
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'valid_from' => now()->toDateString(),
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'educatore.exitv2@familyhub.local',
            'password' => 'password',
            'device_name' => 'minor-exit-v2-test',
        ])->assertOk()->json('access_token');

        return [$token, $minor, $facility];
    }
}
