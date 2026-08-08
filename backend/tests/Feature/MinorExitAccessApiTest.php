<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\Facility;
use App\Models\GenderIdentity;
use App\Models\Minor;
use App\Models\ContactType;
use App\Models\MinorStatus;
use App\Models\Role;
use App\Models\StaffMember;
use App\Models\User;
use App\Models\UserFacilityRole;
use App\Models\AuditLog;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MinorExitAccessApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_educator_with_minor_exit_permission_can_create_exit(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor, $facility] = $this->createEducatorWithMinorAssignment('educatore.assigned@familyhub.local', true);
        $exitTypeId = \App\Models\ExitType::query()->where('code', 'MEDICAL')->value('id')
            ?? \App\Models\ExitType::query()->firstOrFail()->id;

        $this->withToken($token)
            ->postJson('/api/exits', [
                'facility_id' => $facility->id,
                'minor_id' => $minor->id,
                'exit_type_id' => $exitTypeId,
                'destination' => 'Visita specialistica',
                'planned_exit_at' => '2026-06-29 10:00:00',
                'expected_return_at' => '2026-06-29 12:00:00',
            ])
            ->assertCreated()
            ->assertJsonPath('minor_id', $minor->id)
            ->assertJsonPath('facility_id', $facility->id);
    }

    public function test_assigned_educator_can_create_exit_with_relational_accompaniers(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor, $facility] = $this->createEducatorWithMinorAssignment('educatore.accomp@familyhub.local', true);
        $exitTypeId = \App\Models\ExitType::query()->where('code', 'MEDICAL')->value('id')
            ?? \App\Models\ExitType::query()->firstOrFail()->id;
        $contactType = ContactType::query()->where('code', 'TUTOR')->firstOrFail();

        $staffMember = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'EDU-ACCOMP-01',
            'first_name' => 'Mario',
            'last_name' => 'Accompagnatore',
            'email' => 'mario.accomp@familyhub.local',
            'qualification' => 'educatore',
            'status' => 'active',
        ]);

        $minorContact = \App\Models\MinorContact::query()->create([
            'minor_id' => $minor->id,
            'contact_type_id' => $contactType->id,
            'first_name' => 'Lucia',
            'last_name' => 'Tutrice',
            'notes' => 'Tutrice legale',
        ]);

        $this->withToken($token)
            ->postJson('/api/exits', [
                'facility_id' => $facility->id,
                'minor_id' => $minor->id,
                'exit_type_id' => $exitTypeId,
                'destination' => 'Visita specialistica',
                'planned_exit_at' => '2026-06-29 10:00:00',
                'expected_return_at' => '2026-06-29 12:00:00',
                'accompaniers' => [
                    [
                        'person_type' => 'staff_member',
                        'staff_member_id' => $staffMember->id,
                    ],
                    [
                        'person_type' => 'minor_contact',
                        'minor_contact_id' => $minorContact->id,
                    ],
                    [
                        'person_type' => 'external',
                        'external_name' => 'Avv. Rossi',
                    ],
                ],
            ])
            ->assertCreated()
            ->assertJsonCount(3, 'accompaniers')
            ->assertJsonPath('accompanied_by', 'Mario Accompagnatore, Lucia Tutrice, Avv. Rossi')
            ->assertJsonPath('accompaniers.0.person_type', 'staff_member')
            ->assertJsonPath('accompaniers.1.person_type', 'minor_contact')
            ->assertJsonPath('accompaniers.2.person_type', 'external');
    }

    public function test_unassigned_educator_with_minor_exit_permission_cannot_create_exit(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor, $facility] = $this->createEducatorWithMinorAssignment('educatore.unassigned@familyhub.local', false);
        $exitTypeId = \App\Models\ExitType::query()->where('code', 'MEDICAL')->value('id')
            ?? \App\Models\ExitType::query()->firstOrFail()->id;

        $this->withToken($token)
            ->postJson('/api/exits', [
                'facility_id' => $facility->id,
                'minor_id' => $minor->id,
                'exit_type_id' => $exitTypeId,
                'destination' => 'Visita specialistica',
                'planned_exit_at' => '2026-06-29 10:00:00',
                'expected_return_at' => '2026-06-29 12:00:00',
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Creazione uscita non consentita per questo minore.');
    }

    public function test_assigned_educator_can_read_accompanier_options_for_minor(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor, $facility] = $this->createEducatorWithMinorAssignment('educatore.options@familyhub.local', true);
        $contactType = ContactType::query()->where('code', 'TUTOR')->firstOrFail();

        StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'EDU-OPT-01',
            'first_name' => 'Sara',
            'last_name' => 'Interna',
            'qualification' => 'educatore',
            'status' => 'active',
        ]);

        \App\Models\MinorContact::query()->create([
            'minor_id' => $minor->id,
            'contact_type_id' => $contactType->id,
            'first_name' => 'Claudia',
            'last_name' => 'Tutore',
            'notes' => 'Contatto reperibile',
        ]);

        $this->withToken($token)
            ->getJson('/api/exits/options/accompaniers?minor_id='.$minor->id)
            ->assertOk()
            ->assertJsonPath('minor.id', $minor->id)
            ->assertJsonPath('facility.id', $facility->id)
            ->assertJsonCount(1, 'staff_members')
            ->assertJsonCount(1, 'minor_contacts')
            ->assertJsonPath('staff_members.0.first_name', 'Sara')
            ->assertJsonPath('minor_contacts.0.first_name', 'Claudia');
    }

    public function test_exit_create_and_update_write_human_readable_audit_for_accompaniers(): void
    {
        $this->seed(DatabaseSeeder::class);

        [$token, $minor, $facility] = $this->createEducatorWithMinorAssignment('educatore.audit@familyhub.local', true);
        $exitTypeId = \App\Models\ExitType::query()->where('code', 'MEDICAL')->value('id')
            ?? \App\Models\ExitType::query()->firstOrFail()->id;
        $contactType = ContactType::query()->where('code', 'TUTOR')->firstOrFail();

        $staffMember = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'EDU-AUD-01',
            'first_name' => 'Paolo',
            'last_name' => 'Interno',
            'qualification' => 'educatore',
            'status' => 'active',
        ]);

        $minorContact = \App\Models\MinorContact::query()->create([
            'minor_id' => $minor->id,
            'contact_type_id' => $contactType->id,
            'first_name' => 'Marta',
            'last_name' => 'Tutrice',
        ]);

        $create = $this->withToken($token)
            ->postJson('/api/exits', [
                'facility_id' => $facility->id,
                'minor_id' => $minor->id,
                'exit_type_id' => $exitTypeId,
                'destination' => 'Controllo clinico',
                'planned_exit_at' => '2026-07-01 10:00:00',
                'expected_return_at' => '2026-07-01 12:00:00',
                'accompaniers' => [
                    [
                        'person_type' => 'staff_member',
                        'staff_member_id' => $staffMember->id,
                    ],
                    [
                        'person_type' => 'minor_contact',
                        'minor_contact_id' => $minorContact->id,
                    ],
                ],
            ])
            ->assertCreated();

        $exitId = $create->json('id');

        $createAudit = AuditLog::query()
            ->where('resource_type', 'minor_exit')
            ->where('resource_id', (string) $exitId)
            ->where('action', 'create')
            ->latest('id')
            ->first();

        $this->assertNotNull($createAudit);
        $this->assertStringContainsString('Paolo Interno [staff]', $createAudit->operation_summary);
        $this->assertStringContainsString('Marta Tutrice [contatto minore]', $createAudit->operation_summary);

        $this->withToken($token)
            ->putJson('/api/exits/'.$exitId, [
                'exit_type_id' => $exitTypeId,
                'destination' => 'Controllo clinico',
                'planned_exit_at' => '2026-07-01 10:00:00',
                'expected_return_at' => '2026-07-01 12:00:00',
                'status' => 'planned',
                'accompaniers' => [
                    [
                        'person_type' => 'external',
                        'external_name' => 'Avv. Viola',
                    ],
                ],
            ])
            ->assertOk();

        $updateAudit = AuditLog::query()
            ->where('resource_type', 'minor_exit')
            ->where('resource_id', (string) $exitId)
            ->where('action', 'update')
            ->latest('id')
            ->first();

        $this->assertNotNull($updateAudit);
        $this->assertStringContainsString('Accompagnatori prima:', $updateAudit->operation_summary);
        $this->assertStringContainsString('Paolo Interno [staff]', $updateAudit->operation_summary);
        $this->assertStringContainsString('Avv. Viola [esterno]', $updateAudit->operation_summary);
    }

    private function createEducatorWithMinorAssignment(string $email, bool $assignMinor): array
    {
        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();

        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-EXIT-'.str()->upper(str()->random(6)),
            'first_name' => 'Test',
            'last_name' => 'Minor',
            'birth_date' => '2012-01-01',
            'birth_city_id' => $city->id,
            'gender_identity_id' => $genderIdentity->id,
            'entry_date' => '2026-06-18',
            'minor_status_id' => $minorStatus->id,
        ]);

        $user = User::query()->create([
            'uuid' => (string) str()->uuid(),
            'email' => $email,
            'password' => Hash::make('password'),
            'first_name' => 'Edu',
            'last_name' => 'Catore',
            'is_active' => true,
            'mfa_required' => false,
            'email_verified_at' => now(),
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $educatorRole->id,
            'valid_from' => now()->toDateString(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        if ($assignMinor) {
            \App\Models\MinorUserAssignment::query()->create([
                'minor_id' => $minor->id,
                'user_id' => $user->id,
                'facility_id' => $facility->id,
                'valid_from' => now()->toDateString(),
                'valid_to' => null,
                'is_active' => true,
                'assigned_by_user_id' => $adminUser->id,
            ]);
        }

        $token = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password',
            'device_name' => 'minor-exit-access-test',
        ])->assertOk()->json('access_token');

        return [$token, $minor, $facility];
    }
}
