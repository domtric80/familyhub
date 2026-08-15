<?php

namespace Tests\Feature;

use App\Models\ApproachType;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\DocumentType;
use App\Models\Facility;
use App\Models\Minor;
use App\Models\MinorApproach;
use App\Models\MinorContact;
use App\Models\MinorDocument;
use App\Models\MinorUserAssignment;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MinorApproachApiTest extends TestCase
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
            'device_name' => 'phpunit-minor-approaches',
        ])->assertOk();

        $this->token = (string) $login->json('access_token');
    }

    public function test_lookup_approach_types_returns_active_values(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/lookups/approach-types')
            ->assertOk()
            ->assertJsonPath('0.code', 'FAMILY_VISIT');
    }

    public function test_can_create_and_filter_minor_approach_with_multiple_contacts(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-APP-MULTI-001',
            'first_name' => 'Luca',
            'last_name' => 'Rossi',
            'birth_date' => '2012-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $tutorTypeId = \App\Models\ContactType::query()->where('code', 'TUTOR')->firstOrFail()->id;
        $doctorTypeId = \App\Models\ContactType::query()->where('code', 'DOCTOR')->firstOrFail()->id;
        $firstContact = MinorContact::query()->create([
            'minor_id' => $minor->id,
            'contact_type_id' => $tutorTypeId,
            'first_name' => 'Maria',
            'last_name' => 'Rossi',
            'email' => 'maria.rossi@example.test',
        ]);
        $secondContact = MinorContact::query()->create([
            'minor_id' => $minor->id,
            'contact_type_id' => $doctorTypeId,
            'first_name' => 'Paolo',
            'last_name' => 'Rossi',
            'email' => 'paolo.rossi@example.test',
        ]);
        $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();

        $approachId = $this->withToken($this->token)
            ->postJson('/api/approaches', [
                'minor_id' => $minor->id,
                'approach_type_id' => $type->id,
                'participants' => [
                    ['minor_contact_id' => $firstContact->id, 'contact_type_id' => $tutorTypeId],
                    ['minor_contact_id' => $secondContact->id, 'contact_type_id' => $doctorTypeId],
                ],
                'title' => 'Incontro di riallineamento familiare',
                'objective' => 'Osservare qualità della relazione e sostenere il percorso.',
                'location' => 'Sala colloqui',
                'authorization_reference' => 'TRIB-2026-44',
                'authorization_issued_at' => '2026-07-01',
                'authorization_expires_at' => '2026-08-01',
                'authorization_renewal_alert_days' => 15,
                'planned_start_at' => '2026-07-03 10:00:00',
                'planned_end_at' => '2026-07-03 11:00:00',
                'status' => 'planned',
                'pre_reaction_level' => 'neutral',
                'during_reaction_level' => 'positive',
                'post_reaction_level' => 'positive',
                'reserved_coordinator_notes' => 'Prima osservazione riservata.',
            ])
            ->assertCreated()
            ->assertJsonPath('title', 'Incontro di riallineamento familiare')
            ->assertJsonPath('approach_type.code', 'FAMILY_VISIT')
            ->assertJsonPath('minor_contact_id', $firstContact->id)
            ->assertJsonPath('minor_contact_ids.0', $firstContact->id)
            ->assertJsonPath('minor_contact_ids.1', $secondContact->id)
            ->assertJsonPath('minor_contacts_count', 2)
            ->assertJsonPath('participants.0.minor_contact_id', $firstContact->id)
            ->assertJsonPath('participants.0.contact_type_id', $tutorTypeId)
            ->assertJsonPath('participants.1.minor_contact_id', $secondContact->id)
            ->assertJsonPath('participants.1.contact_type_id', $doctorTypeId)
            ->assertJsonPath('can_view_reserved_coordinator_notes', true)
            ->json('id');

        $this->withToken($this->token)
            ->getJson('/api/approaches?minor_contact_id='.$secondContact->id)
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $approachId)
            ->assertJsonPath('0.minor_contacts_count', 2);
    }

    public function test_can_link_existing_minor_document_as_authorization_document(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-APP-DOC-001',
            'first_name' => 'Giorgia',
            'last_name' => 'Neri',
            'birth_date' => '2012-02-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        Storage::disk('s3')->put('released/minors/test/provvedimento.pdf', 'provvedimento');

        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => Minor::class,
            'owner_id' => $minor->id,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'released/minors/test/provvedimento.pdf',
            'original_name' => 'provvedimento.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('provvedimento'),
            'sha256' => hash('sha256', 'provvedimento'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => $adminUser->id,
        ]);

        $minorDocument = MinorDocument::query()->create([
            'minor_id' => $minor->id,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'classification_code' => 'restricted',
            'classification' => 'restricted',
        ]);

        $this->withToken($this->token)
            ->postJson('/api/approaches', [
                'minor_id' => $minor->id,
                'approach_type_id' => $type->id,
                'title' => 'Visita con decreto collegato',
                'planned_start_at' => '2026-07-03 10:00:00',
                'authorization_reference' => 'TRIB-2026-99',
                'authorization_minor_document_id' => $minorDocument->id,
            ])
            ->assertCreated()
            ->assertJsonPath('authorization_minor_document_id', $minorDocument->id)
            ->assertJsonPath('authorization_minor_document.id', $minorDocument->id)
            ->assertJsonPath('authorization_minor_document.attachment.original_name', 'provvedimento.pdf');
    }

    public function test_can_create_approach_with_staff_participants(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-APP-STAFF-001',
            'first_name' => 'Carla',
            'last_name' => 'Riva',
            'birth_date' => '2012-03-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();
        $psychologist = \App\Models\StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-PSY-001',
            'first_name' => 'Laura',
            'last_name' => 'Bianchi',
            'email' => 'laura.bianchi@example.test',
            'qualification_code' => 'PSICOLOGO',
            'status_code' => 'ACTIVE',
        ]);
        $socialWorker = \App\Models\StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-SW-001',
            'first_name' => 'Marco',
            'last_name' => 'Verdi',
            'email' => 'marco.verdi@example.test',
            'qualification_code' => 'ASSISTENTE_SOCIALE',
            'status_code' => 'ACTIVE',
        ]);

        $this->withToken($this->token)
            ->postJson('/api/approaches', [
                'minor_id' => $minor->id,
                'approach_type_id' => $type->id,
                'title' => 'Avvicinamento con professionisti presenti',
                'planned_start_at' => '2026-07-03 15:00:00',
                'staff_participants' => [
                    ['staff_member_id' => $psychologist->id, 'qualification_code' => 'PSICOLOGO'],
                    ['staff_member_id' => $socialWorker->id, 'qualification_code' => 'ASSISTENTE_SOCIALE'],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('supervising_staff_member_id', $psychologist->id)
            ->assertJsonPath('staff_participants_count', 2)
            ->assertJsonPath('staff_participants.0.staff_member_id', $psychologist->id)
            ->assertJsonPath('staff_participants.0.qualification_code', 'PSICOLOGO')
            ->assertJsonPath('staff_participants.1.staff_member_id', $socialWorker->id)
            ->assertJsonPath('staff_participants.1.qualification_code', 'ASSISTENTE_SOCIALE');
    }

    public function test_can_create_and_list_minor_approach(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-APP-001',
            'first_name' => 'Luca',
            'last_name' => 'Rossi',
            'birth_date' => '2012-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $contactTypeId = \App\Models\ContactType::query()->firstOrFail()->id;
        $primaryContact = MinorContact::query()->create([
            'minor_id' => $minor->id,
            'contact_type_id' => $contactTypeId,
            'first_name' => 'Maria',
            'last_name' => 'Rossi',
            'email' => 'maria.rossi@example.test',
        ]);
        $secondaryContact = MinorContact::query()->create([
            'minor_id' => $minor->id,
            'contact_type_id' => $contactTypeId,
            'first_name' => 'Paolo',
            'last_name' => 'Rossi',
            'email' => 'paolo.rossi@example.test',
        ]);
        $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();

        $createResponse = $this->withToken($this->token)
            ->postJson('/api/approaches', [
                'minor_id' => $minor->id,
                'approach_type_id' => $type->id,
                'minor_contact_ids' => [$primaryContact->id, $secondaryContact->id],
                'title' => 'Incontro di riallineamento familiare',
                'objective' => 'Osservare qualità della relazione e sostenere il percorso.',
                'location' => 'Sala colloqui',
                'authorization_reference' => 'TRIB-2026-44',
                'authorization_issued_at' => '2026-07-01',
                'authorization_expires_at' => '2026-08-01',
                'authorization_renewal_alert_days' => 15,
                'planned_start_at' => '2026-07-03 10:00:00',
                'planned_end_at' => '2026-07-03 11:00:00',
                'status' => 'planned',
                'pre_reaction_level' => 'neutral',
                'during_reaction_level' => 'positive',
                'post_reaction_level' => 'positive',
                'reserved_coordinator_notes' => 'Prima osservazione riservata.',
            ])
            ->assertCreated()
            ->assertJsonPath('title', 'Incontro di riallineamento familiare')
            ->assertJsonPath('approach_type.code', 'FAMILY_VISIT')
            ->assertJsonPath('authorization_reference', 'TRIB-2026-44')
            ->assertJsonPath('post_reaction_level', 'positive')
            ->assertJsonPath('minor_contacts_count', 2)
            ->assertJsonPath('minor_contact_ids.0', $primaryContact->id)
            ->assertJsonPath('minor_contact_ids.1', $secondaryContact->id)
            ->assertJsonPath('can_view_reserved_coordinator_notes', true);

        $approachId = $createResponse->json('id');

        $this->withToken($this->token)
            ->getJson('/api/approaches?minor_id='.$minor->id)
            ->assertOk()
            ->assertJsonFragment(['id' => $approachId]);
    }

    public function test_can_filter_approaches_by_involved_contact_from_multi_contact_link(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-APP-001B',
            'first_name' => 'Lucia',
            'last_name' => 'Rosa',
            'birth_date' => '2013-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $contactTypeId = \App\Models\ContactType::query()->firstOrFail()->id;
        $firstContact = MinorContact::query()->create([
            'minor_id' => $minor->id,
            'contact_type_id' => $contactTypeId,
            'first_name' => 'Anna',
            'last_name' => 'Rosa',
        ]);
        $secondContact = MinorContact::query()->create([
            'minor_id' => $minor->id,
            'contact_type_id' => $contactTypeId,
            'first_name' => 'Marco',
            'last_name' => 'Rosa',
        ]);
        $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();

        $approachId = $this->withToken($this->token)
            ->postJson('/api/approaches', [
                'minor_id' => $minor->id,
                'approach_type_id' => $type->id,
                'minor_contact_ids' => [$firstContact->id, $secondContact->id],
                'title' => 'Avvicinamento multi contatto',
                'planned_start_at' => '2026-07-03 10:00:00',
            ])
            ->assertCreated()
            ->json('id');

        $this->withToken($this->token)
            ->getJson('/api/approaches?minor_contact_id='.$secondContact->id)
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $approachId)
            ->assertJsonPath('0.minor_contacts_count', 2);
    }

    public function test_can_return_approach_trend_summary(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-APP-002',
            'first_name' => 'Giulia',
            'last_name' => 'Verdi',
            'birth_date' => '2011-02-02',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();

        MinorApproach::query()->create([
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'approach_type_id' => $type->id,
            'title' => 'Telefonata con madre',
            'planned_start_at' => '2026-07-05 10:00:00',
            'status' => 'completed',
            'authorization_reference' => 'AUTH-1',
            'authorization_expires_at' => now()->addDays(5)->toDateString(),
            'authorization_renewal_alert_days' => 10,
            'post_reaction_level' => 'positive',
        ]);

        $this->withToken($this->token)
            ->getJson('/api/approaches/trend?minor_id='.$minor->id)
            ->assertOk()
            ->assertJsonPath('summary.total', 1)
            ->assertJsonPath('summary.authorization_expiring', 1)
            ->assertJsonPath('monthly_series.0.month', '2026-07');
    }

    public function test_can_filter_approaches_by_authorization_status(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-APP-003',
            'first_name' => 'Marco',
            'last_name' => 'Blu',
            'birth_date' => '2011-03-03',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();

        MinorApproach::query()->create([
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'approach_type_id' => $type->id,
            'title' => 'Approach Expired',
            'planned_start_at' => '2026-07-05 10:00:00',
            'status' => 'planned',
            'authorization_reference' => 'AUTH-EXP',
            'authorization_expires_at' => now()->subDay()->toDateString(),
        ]);

        MinorApproach::query()->create([
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'approach_type_id' => $type->id,
            'title' => 'Approach Active',
            'planned_start_at' => '2026-07-06 10:00:00',
            'status' => 'planned',
            'authorization_reference' => 'AUTH-ACT',
            'authorization_expires_at' => now()->addDays(60)->toDateString(),
            'authorization_renewal_alert_days' => 10,
        ]);

        $this->withToken($this->token)
            ->getJson('/api/approaches?minor_id='.$minor->id.'&authorization_status=expired')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Approach Expired');
    }

    public function test_non_authorized_user_cannot_write_reserved_notes_and_cannot_read_them(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-APP-004',
            'first_name' => 'Elena',
            'last_name' => 'Neri',
            'birth_date' => '2012-04-04',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();

        [$educatorToken, $educatorUserId] = $this->createEducatorTokenForFacility($facility->id);

        MinorUserAssignment::query()->create([
            'minor_id' => $minor->id,
            'user_id' => $educatorUserId,
            'facility_id' => $facility->id,
            'valid_from' => now()->toDateString(),
            'is_active' => true,
            'assigned_by_user_id' => User::query()->where('email', 'admin@familyhub.local')->firstOrFail()->id,
        ]);

        $this->withToken($educatorToken)
            ->postJson('/api/approaches', [
                'minor_id' => $minor->id,
                'approach_type_id' => $type->id,
                'title' => 'Tentativo note riservate',
                'planned_start_at' => '2026-07-07 10:00:00',
                'reserved_psychologist_notes' => 'Non dovrebbe passare.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['reserved_psychologist_notes']);

        $approach = MinorApproach::query()->create([
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'approach_type_id' => $type->id,
            'title' => 'Approach Riservato',
            'planned_start_at' => '2026-07-07 12:00:00',
            'reserved_psychologist_notes' => 'Nota clinica interna.',
            'reserved_coordinator_notes' => 'Nota coordinatore interna.',
        ]);

        $this->withToken($educatorToken)
            ->getJson('/api/approaches/'.$approach->id)
            ->assertOk()
            ->assertJsonPath('reserved_psychologist_notes', null)
            ->assertJsonPath('reserved_coordinator_notes', null)
            ->assertJsonPath('has_reserved_notes', true)
            ->assertJsonPath('can_view_reserved_psychologist_notes', false)
            ->assertJsonPath('can_view_reserved_coordinator_notes', false);
    }

    public function test_suspended_status_requires_reason_and_suspended_at(): void
    {
        $facility = Facility::query()->firstOrFail();
        $minor = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-APP-005',
            'first_name' => 'Sara',
            'last_name' => 'Gialli',
            'birth_date' => '2010-05-05',
            'entry_date' => '2026-01-01',
            'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
        ]);
        $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();

        $this->withToken($this->token)
            ->postJson('/api/approaches', [
                'minor_id' => $minor->id,
                'approach_type_id' => $type->id,
                'title' => 'Approach sospeso',
                'planned_start_at' => '2026-07-08 10:00:00',
                'status' => 'suspended',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['suspension_reason']);

        $this->withToken($this->token)
            ->postJson('/api/approaches', [
                'minor_id' => $minor->id,
                'approach_type_id' => $type->id,
                'title' => 'Approach sospeso 2',
                'planned_start_at' => '2026-07-08 11:00:00',
                'status' => 'suspended',
                'suspension_reason' => 'Situazione non favorevole.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['suspended_at']);
    }


public function test_can_renew_approach_authorization_and_expose_due_items_in_trend(): void
{
    $facility = Facility::query()->firstOrFail();
    $minor = Minor::query()->create([
        'facility_id' => $facility->id,
        'internal_code' => 'MIN-APP-RENEW-001',
        'first_name' => 'Nadia',
        'last_name' => 'Viola',
        'birth_date' => '2012-06-06',
        'entry_date' => '2026-01-01',
        'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
    ]);
    $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();
    $expiresAt = now()->addDays(7)->toDateString();

    $approach = MinorApproach::query()->create([
        'facility_id' => $facility->id,
        'minor_id' => $minor->id,
        'approach_type_id' => $type->id,
        'title' => 'Visita con rinnovo imminente',
        'planned_start_at' => '2026-08-20 10:00:00',
        'status' => 'planned',
        'authorization_reference' => 'AUTH-OLD',
        'authorization_issued_at' => now()->subDays(20)->toDateString(),
        'authorization_expires_at' => now()->subDay()->toDateString(),
        'authorization_renewal_alert_days' => 15,
    ]);

    $this->withToken($this->token)
        ->postJson('/api/approaches/'.$approach->id.'/renew-authorization', [
            'authorization_reference' => 'AUTH-NEW-2026',
            'authorization_issued_at' => now()->toDateString(),
            'authorization_expires_at' => $expiresAt,
            'authorization_renewal_alert_days' => 15,
        ])
        ->assertOk()
        ->assertJsonPath('authorization_reference', 'AUTH-NEW-2026')
        ->assertJsonPath('authorization_status', 'expiring')
        ->assertJsonPath('authorization_needs_renewal', true)
        ->assertJsonPath('authorization_days_until_expiry', 7)
        ->assertJsonPath('can_renew_authorization', true);

    $this->assertDatabaseHas('audit_logs', [
        'resource_type' => 'minor_approach_authorization',
        'resource_id' => (string) $approach->id,
    ]);

    $this->withToken($this->token)
        ->getJson('/api/approaches/trend?minor_id='.$minor->id)
        ->assertOk()
        ->assertJsonPath('summary.authorization_expiring', 1)
        ->assertJsonPath('totals_by_approach_type.0.approach_type_code', 'FAMILY_VISIT')
        ->assertJsonPath('upcoming_authorization_renewals.0.id', $approach->id)
        ->assertJsonPath('upcoming_authorization_renewals.0.authorization_status', 'expiring');
}

public function test_reserved_notes_read_is_audited_and_suspension_can_be_signed(): void
{
    $facility = Facility::query()->firstOrFail();
    $minor = Minor::query()->create([
        'facility_id' => $facility->id,
        'internal_code' => 'MIN-APP-SUSP-001',
        'first_name' => 'Daria',
        'last_name' => 'Rossi',
        'birth_date' => '2012-07-07',
        'entry_date' => '2026-01-01',
        'minor_status_id' => \App\Models\MinorStatus::query()->firstOrFail()->id,
    ]);
    $type = ApproachType::query()->where('code', 'FAMILY_VISIT')->firstOrFail();

    $approach = MinorApproach::query()->create([
        'facility_id' => $facility->id,
        'minor_id' => $minor->id,
        'approach_type_id' => $type->id,
        'title' => 'Approach sospeso da firmare',
        'planned_start_at' => '2026-08-21 10:00:00',
        'status' => 'suspended',
        'reserved_psychologist_notes' => 'Nota clinica riservata.',
        'reserved_coordinator_notes' => 'Nota coordinatore riservata.',
        'suspension_reason' => 'Evento non compatibile con il benessere attuale del minore.',
        'suspended_at' => now()->subHour(),
    ]);

    $this->withToken($this->token)
        ->getJson('/api/approaches/'.$approach->id)
        ->assertOk()
        ->assertJsonPath('has_reserved_notes', true)
        ->assertJsonPath('can_sign_suspension', true);

    $this->assertTrue(AuditLog::query()->where('resource_type', 'minor_approach_reserved_notes')->where('resource_id', (string) $approach->id)->exists());

    $this->withToken($this->token)
        ->postJson('/api/approaches/'.$approach->id.'/sign-suspension', [])
        ->assertOk()
        ->assertJsonPath('status', 'suspended')
        ->assertJsonPath('suspension_is_signed', true);

    $approach->refresh();
    $this->assertNotNull($approach->suspension_signed_at);
    $this->assertTrue(AuditLog::query()->where('resource_type', 'minor_approach_suspension')->where('resource_id', (string) $approach->id)->exists());
}

private function createEducatorTokenForFacility(int $facilityId): array
{

        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();

        $user = User::query()->create([
            'uuid' => (string) str()->uuid(),
            'email' => 'educatore.approach.qa@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Lina',
            'last_name' => 'Educatrice',
            'is_active' => true,
            'mfa_required' => false,
            'email_verified_at' => now(),
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facilityId,
            'role_id' => $educatorRole->id,
            'valid_from' => now()->toDateString(),
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $token = (string) $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'phpunit-minor-approaches-educator',
        ])->assertOk()->json('access_token');

        return [$token, $user->id];
    }
}
