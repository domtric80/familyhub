<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\Facility;
use App\Models\GenderIdentity;
use App\Models\MinorStatus;
use App\Models\MinorUserAssignment;
use App\Models\Minor;
use App\Models\ContactType;
use App\Models\DocumentType;
use App\Models\DocumentIssuer;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\MinorDocument;
use App\Models\StaffMember;
use App\Models\Role;
use App\Models\User;
use App\Models\UserFacilityRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MinorApiTest extends TestCase
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
            'device_name' => 'minor-test',
        ])->assertOk();

        $this->token = $login->json('access_token');
    }

    public function test_super_admin_can_create_and_read_minor(): void
    {
        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();

        $create = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-0001',
                'first_name' => 'Mario',
                'last_name' => 'Rossi',
                'preferred_name' => 'Marietto',
                'birth_date' => '2012-05-20',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'tax_code' => 'RSSMRA12E20H501X',
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated();

        $minorId = $create->json('id');

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}")
            ->assertOk()
            ->assertJsonPath('first_name', 'Mario')
            ->assertJsonPath('last_name', 'Rossi')
            ->assertJsonPath('minor_status.code', 'ACTIVE')
            ->assertJsonPath('gender_identity.code', 'MALE');
    }

    public function test_super_admin_can_manage_minor_profile_and_contacts(): void
    {
        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $contactType = ContactType::query()->where('code', 'TUTOR')->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-0002',
                'first_name' => 'Luca',
                'last_name' => 'Bianchi',
                'birth_date' => '2011-03-10',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $this->withToken($this->token)
            ->putJson("/api/minors/{$minorId}/profile", [
                'family_background' => 'Nucleo familiare fragile',
                'life_history' => 'Percorso con più collocamenti',
                'risk_factors' => 'Dispersione scolastica',
                'crisis_indicators' => 'Episodi di agitazione',
            ])
            ->assertOk()
            ->assertJsonPath('family_background', 'Nucleo familiare fragile');

        $contactId = $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/contacts", [
                'contact_type_id' => $contactType->id,
                'first_name' => 'Giulia',
                'last_name' => 'Verdi',
                'phone' => '3331234567',
                'email' => 'giulia.verdi@example.test',
                'city_id' => $city->id,
                'notes' => 'Contatto principale',
            ])
            ->assertCreated()
            ->assertJsonPath('contact_type.code', 'TUTOR')
            ->json('id');

        $this->withToken($this->token)
            ->putJson("/api/minors/{$minorId}/contacts/{$contactId}", [
                'notes' => 'Contatto principale aggiornato',
            ])
            ->assertOk()
            ->assertJsonPath('notes', 'Contatto principale aggiornato');

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}")
            ->assertOk()
            ->assertJsonPath('profile.life_history', 'Percorso con più collocamenti')
            ->assertJsonPath('contacts.0.contact_type.code', 'TUTOR')
            ->assertJsonPath('contacts.0.notes', 'Contatto principale aggiornato');
    }

    public function test_super_admin_can_manage_minor_case_details(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $originFacility = Facility::query()->whereKeyNot($facility->id)->first() ?? $facility;
        $birthCity = City::query()->where('name', 'Roma')->firstOrFail();
        $entryCity = City::query()->where('name', 'Milano')->first() ?? $birthCity;
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $judicialAuthority = DocumentIssuer::query()->where('code', 'TRIBUNALE')->first() ?? DocumentIssuer::query()->firstOrFail();
        $healthAuthority = DocumentIssuer::query()->where('code', 'ASL')->first() ?? DocumentIssuer::query()->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-CASE-001',
                'first_name' => 'Sofia',
                'last_name' => 'Blu',
                'birth_date' => '2013-04-10',
                'birth_city_id' => $birthCity->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $doctor = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-GP-001',
            'first_name' => 'Mario',
            'last_name' => 'Medico',
            'email' => 'mario.medico@example.test',
            'qualification_code' => 'MEDICO_BASE',
            'status_code' => 'ACTIVE',
        ]);
        $pediatrician = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-PED-001',
            'first_name' => 'Paola',
            'last_name' => 'Pediatra',
            'email' => 'paola.pediatra@example.test',
            'qualification_code' => 'PEDIATRA',
            'status_code' => 'ACTIVE',
        ]);

        Storage::disk('s3')->put('released/minors/test/decreto.pdf', 'decreto');
        Storage::disk('s3')->put('released/minors/test/vaccini.pdf', 'vaccini');

        $attachmentOrder = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'released/minors/test/decreto.pdf',
            'original_name' => 'decreto.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('decreto'),
            'sha256' => hash('sha256', 'decreto'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => 1,
        ]);
        $attachmentVaccines = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'released/minors/test/vaccini.pdf',
            'original_name' => 'vaccini.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('vaccini'),
            'sha256' => hash('sha256', 'vaccini'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => 1,
        ]);

        $orderDocument = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachmentOrder->id,
            'classification_code' => 'restricted',
            'classification' => 'restricted',
        ]);
        $vaccineDocument = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachmentVaccines->id,
            'classification_code' => 'restricted',
            'classification' => 'restricted',
        ]);

        $this->withToken($this->token)
            ->putJson("/api/minors/{$minorId}/case-details", [
                'entry_city_id' => $entryCity->id,
                'origin_facility_id' => $originFacility->id,
                'origin_structure_name' => 'Struttura esterna convenzionata',
                'placement_order_reference' => 'DEC-2026-55',
                'placement_order_minor_document_id' => $orderDocument->id,
                'judicial_authority_document_issuer_id' => $judicialAuthority->id,
                'proceeding_number' => 'PROC-2026-XYZ',
                'next_hearing_at' => '2026-09-10 09:30:00',
                'general_practitioner_staff_member_id' => $doctor->id,
                'pediatrician_staff_member_id' => $pediatrician->id,
                'health_authority_document_issuer_id' => $healthAuthority->id,
                'vaccination_minor_document_id' => $vaccineDocument->id,
            ])
            ->assertOk()
            ->assertJsonPath('placement_order_reference', 'DEC-2026-55')
            ->assertJsonPath('proceeding_number', 'PROC-2026-XYZ')
            ->assertJsonPath('general_practitioner.id', $doctor->id)
            ->assertJsonPath('pediatrician.id', $pediatrician->id)
            ->assertJsonPath('placement_order_document.id', $orderDocument->id)
            ->assertJsonPath('vaccination_document.id', $vaccineDocument->id);

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}")
            ->assertOk()
            ->assertJsonPath('case_detail.placement_order_reference', 'DEC-2026-55')
            ->assertJsonPath('case_detail.judicial_authority.id', $judicialAuthority->id)
            ->assertJsonPath('case_detail.health_authority.id', $healthAuthority->id)
            ->assertJsonPath('case_detail.general_practitioner.id', $doctor->id)
            ->assertJsonPath('case_detail.pediatrician.id', $pediatrician->id);
    }

    public function test_super_admin_can_manage_minor_case_details_with_legacy_frontend_aliases(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $originFacility = Facility::query()->whereKeyNot($facility->id)->first() ?? $facility;
        $birthCity = City::query()->where('name', 'Roma')->firstOrFail();
        $entryCity = City::query()->where('name', 'Milano')->first() ?? $birthCity;
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $judicialAuthority = DocumentIssuer::query()->where('code', 'TRIBUNALE')->first() ?? DocumentIssuer::query()->firstOrFail();
        $healthAuthority = DocumentIssuer::query()->where('code', 'ASL')->first() ?? DocumentIssuer::query()->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-CASE-ALIAS-001',
                'first_name' => 'Noemi',
                'last_name' => 'Viola',
                'birth_date' => '2014-05-12',
                'birth_city_id' => $birthCity->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $doctor = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-GP-ALIAS-001',
            'first_name' => 'Giulia',
            'last_name' => 'Medico',
            'email' => 'giulia.medico.alias@example.test',
            'qualification_code' => 'MEDICO_BASE',
            'status_code' => 'ACTIVE',
        ]);
        $pediatrician = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-PED-ALIAS-001',
            'first_name' => 'Dario',
            'last_name' => 'Pediatra',
            'email' => 'dario.pediatra.alias@example.test',
            'qualification_code' => 'PEDIATRA',
            'status_code' => 'ACTIVE',
        ]);

        Storage::disk('s3')->put('released/minors/test/vaccini-alias.pdf', 'vaccini-alias');

        $attachmentVaccines = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'released/minors/test/vaccini-alias.pdf',
            'original_name' => 'vaccini-alias.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('vaccini-alias'),
            'sha256' => hash('sha256', 'vaccini-alias'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => 1,
        ]);

        $vaccineDocument = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachmentVaccines->id,
            'classification_code' => 'restricted',
            'classification' => 'restricted',
        ]);

        $this->withToken($this->token)
            ->putJson("/api/minors/{$minorId}/case-details", [
                'entry_city_id' => $entryCity->id,
                'origin_facility_id' => $originFacility->id,
                'judicial_authority_id' => $judicialAuthority->id,
                'family_doctor_id' => $doctor->id,
                'pediatrician_id' => $pediatrician->id,
                'asl_id' => $healthAuthority->id,
                'vaccination_record_document_id' => $vaccineDocument->id,
            ])
            ->assertOk()
            ->assertJsonPath('judicial_authority.id', $judicialAuthority->id)
            ->assertJsonPath('general_practitioner.id', $doctor->id)
            ->assertJsonPath('pediatrician.id', $pediatrician->id)
            ->assertJsonPath('health_authority.id', $healthAuthority->id)
            ->assertJsonPath('vaccination_document.id', $vaccineDocument->id);
    }

    public function test_super_admin_can_load_minor_case_options(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $originFacility = Facility::query()->whereKeyNot($facility->id)->first() ?? $facility;
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $medicalReportType = DocumentType::query()->where('code', 'MEDICAL_REPORT')->firstOrFail();
        $idType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $judicialAuthority = DocumentIssuer::query()->where('code', 'TRIBUNALE')->first() ?? DocumentIssuer::query()->firstOrFail();
        $healthAuthority = DocumentIssuer::query()->where('code', 'ASL')->first() ?? DocumentIssuer::query()->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-CASE-OPTIONS-001',
                'first_name' => 'Elisa',
                'last_name' => 'Neri',
                'birth_date' => '2014-01-15',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $doctor = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-GP-CASEOPT-001',
            'first_name' => 'Laura',
            'last_name' => 'Medico',
            'email' => 'laura.medico@example.test',
            'qualification_code' => 'MEDICO_BASE',
            'status_code' => 'ACTIVE',
        ]);
        $pediatrician = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-PED-CASEOPT-001',
            'first_name' => 'Paolo',
            'last_name' => 'Pediatra',
            'email' => 'paolo.pediatra@example.test',
            'qualification_code' => 'PEDIATRA',
            'status_code' => 'ACTIVE',
        ]);
        StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-EDU-CASEOPT-001',
            'first_name' => 'Marco',
            'last_name' => 'Educatore',
            'email' => 'marco.educatore@example.test',
            'qualification_code' => 'EDUCATORE',
            'status_code' => 'ACTIVE',
        ]);

        $medicalAttachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $medicalReportType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'released/minors/test/certificato-medico.pdf',
            'original_name' => 'certificato-medico.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('medical'),
            'sha256' => hash('sha256', 'medical'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => 1,
        ]);
        $genericAttachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $idType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'released/minors/test/documento-identita.pdf',
            'original_name' => 'documento-identita.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('generic'),
            'sha256' => hash('sha256', 'generic'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => 1,
        ]);

        $medicalDocument = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $medicalReportType->id,
            'attachment_id' => $medicalAttachment->id,
            'classification_code' => 'clinical',
            'classification' => 'clinical',
        ]);
        MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $idType->id,
            'attachment_id' => $genericAttachment->id,
            'classification_code' => 'restricted',
            'classification' => 'restricted',
        ]);

        $response = $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}/case-options")
            ->assertOk()
            ->assertJsonPath('minor_id', $minorId)
            ->assertJsonCount(1, 'judicial_authorities')
            ->assertJsonCount(1, 'health_authorities')
            ->assertJsonCount(2, 'general_practitioners')
            ->assertJsonCount(1, 'pediatricians')
            ->assertJsonCount(1, 'vaccination_documents');

        $this->assertTrue(collect($response->json('origin_facilities'))->pluck('id')->contains($originFacility->id));
        $this->assertTrue(collect($response->json('judicial_authorities'))->pluck('id')->contains($judicialAuthority->id));
        $this->assertTrue(collect($response->json('health_authorities'))->pluck('id')->contains($healthAuthority->id));
        $this->assertTrue(collect($response->json('general_practitioners'))->pluck('id')->contains($doctor->id));
        $this->assertTrue(collect($response->json('general_practitioners'))->pluck('id')->contains($pediatrician->id));
        $this->assertTrue(collect($response->json('pediatricians'))->pluck('id')->contains($pediatrician->id));
        $this->assertFalse(collect($response->json('pediatricians'))->pluck('id')->contains($doctor->id));
        $this->assertSame($medicalDocument->id, $response->json('vaccination_documents.0.id'));
        $this->assertSame('MEDICAL_REPORT', $response->json('vaccination_documents.0.document_type.code'));
    }

    public function test_super_admin_can_manage_minor_diagnoses_pei_and_needs(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-CARE-001',
                'first_name' => 'Giada',
                'last_name' => 'Verde',
                'birth_date' => '2012-11-03',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $responsible = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-EDU-CARE-01',
            'first_name' => 'Chiara',
            'last_name' => 'Rossi',
            'email' => 'chiara.rossi@example.test',
            'qualification_code' => 'EDUCATORE',
            'status_code' => 'ACTIVE',
        ]);

        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'released/minors/test/bisogno.pdf',
            'original_name' => 'bisogno.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('bisogno'),
            'sha256' => hash('sha256', 'bisogno'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => 1,
        ]);

        $minorDocument = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'label' => 'Allegato bisogno relazionale',
            'classification_code' => 'restricted',
            'classification' => 'restricted',
        ]);

        $this->withToken($this->token)
            ->putJson("/api/minors/{$minorId}/profile", [
                'family_background' => 'Contesto familiare complesso',
                'life_history' => 'Percorso con affidamenti multipli',
                'learning_styles' => 'Apprendimento visuale e pratico',
                'interests' => 'Musica, lettura, giardinaggio',
                'hobbies' => 'Disegno e puzzle',
                'strengths' => 'Buona memoria e forte empatia',
                'risk_factors' => 'Ritiro sociale',
                'crisis_indicators' => 'Chiusura improvvisa e insonnia',
                'clinical_notes_encrypted' => 'Nota clinica riservata',
            ])
            ->assertOk()
            ->assertJsonPath('learning_styles', 'Apprendimento visuale e pratico');

        $diagnosisId = $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/diagnoses", [
                'diagnosis_code' => 'DX-001',
                'diagnosis_label' => 'Disturbo d’ansia in osservazione',
                'dsm_code' => 'DSM-5-300.02',
                'diagnosis_notes_encrypted' => 'Annotazione clinica protetta',
                'diagnosed_at' => '2026-06-01',
                'review_due_at' => '2026-09-01',
                'is_primary' => true,
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('diagnosis_label', 'Disturbo d’ansia in osservazione')
            ->json('id');

        $peiId = $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/peis", [
                'title' => 'PEI secondo semestre 2026',
                'summary' => 'Obiettivi su autonomia e regolazione emotiva',
                'start_date' => '2026-07-01',
                'review_date' => '2026-09-30',
                'end_date' => '2026-12-31',
                'status' => 'active',
                'digital_signature_status' => 'signed',
                'signed_at' => '2026-07-03 09:00:00',
            ])
            ->assertCreated()
            ->assertJsonPath('title', 'PEI secondo semestre 2026')
            ->json('id');

        $objectiveId = $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/peis/{$peiId}/objectives", [
                'code' => 'PEI-AUT-01',
                'title' => 'Migliorare autonomia quotidiana',
                'description' => 'Routine serale autonoma',
                'due_date' => '2026-08-15',
                'status' => 'in_progress',
                'progress_percent' => 45,
                'responsible_staff_member_id' => $responsible->id,
            ])
            ->assertCreated()
            ->assertJsonPath('title', 'Migliorare autonomia quotidiana')
            ->json('id');

        $needId = $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/needs", [
                'category_code' => 'relational',
                'title' => 'Stabilizzare relazione con figura educativa',
                'description' => 'Incrementare fiducia e continuità educativa',
                'priority' => 'high',
                'status' => 'open',
                'responsible_staff_member_id' => $responsible->id,
                'attachment_minor_document_id' => $minorDocument->id,
            ])
            ->assertCreated()
            ->assertJsonPath('category_code', 'relational')
            ->json('id');

        $this->withToken($this->token)
            ->patchJson("/api/minors/{$minorId}/diagnoses/{$diagnosisId}", [
                'review_due_at' => '2026-10-01',
                'is_active' => true,
            ])
            ->assertOk()
            ->assertJson(fn ($json) => $json
                ->where('review_due_at', fn ($value) => str_starts_with((string) $value, '2026-10-01'))
                ->etc());

        $this->withToken($this->token)
            ->patchJson("/api/minors/{$minorId}/peis/{$peiId}/objectives/{$objectiveId}", [
                'progress_percent' => 70,
                'status' => 'in_progress',
            ])
            ->assertOk()
            ->assertJsonPath('progress_percent', 70);

        $this->withToken($this->token)
            ->patchJson("/api/minors/{$minorId}/needs/{$needId}", [
                'status' => 'in_progress',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'in_progress');

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}")
            ->assertOk()
            ->assertJsonPath('profile.learning_styles', 'Apprendimento visuale e pratico')
            ->assertJsonPath('diagnoses.0.dsm_code', 'DSM-5-300.02')
            ->assertJsonPath('peis.0.objectives.0.progress_percent', 70)
            ->assertJsonPath('needs.0.category_code', 'relational')
            ->assertJsonPath('needs.0.attachment_document.id', $minorDocument->id);

        $this->assertDatabaseHas('minor_history_entries', [
            'minor_id' => $minorId,
            'event_type' => 'minor_need_created',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'minor_id' => $minorId,
            'resource_type' => 'minor_pei',
            'resource_id' => (string) $peiId,
        ]);
    }

    public function test_super_admin_can_read_pei_history_and_objective_progress_timeline(): void
    {
        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-PEI-HISTORY-001',
                'first_name' => 'Noemi',
                'last_name' => 'Blu',
                'birth_date' => '2013-09-15',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $responsible = StaffMember::query()->create([
            'facility_id' => $facility->id,
            'employee_code' => 'STAFF-EDU-PEI-01',
            'first_name' => 'Laura',
            'last_name' => 'Gialli',
            'email' => 'laura.gialli@example.test',
            'qualification_code' => 'EDUCATORE',
            'status_code' => 'ACTIVE',
        ]);

        $peiId = $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/peis", [
                'title' => 'PEI storico 2026',
                'summary' => 'Lavoro su autonomia personale',
                'start_date' => '2026-07-01',
                'review_date' => '2026-09-01',
                'status' => 'active',
                'digital_signature_status' => 'signed',
                'signed_at' => '2026-07-03 10:00:00',
            ])
            ->assertCreated()
            ->json('id');

        $objectiveId = $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/peis/{$peiId}/objectives", [
                'code' => 'PEI-REL-01',
                'title' => 'Incrementare capacità relazionale',
                'description' => 'Più iniziativa nel gruppo',
                'due_date' => '2026-08-20',
                'status' => 'open',
                'progress_percent' => 10,
                'responsible_staff_member_id' => $responsible->id,
            ])
            ->assertCreated()
            ->json('id');

        $this->withToken($this->token)
            ->patchJson("/api/minors/{$minorId}/peis/{$peiId}", [
                'summary' => 'Lavoro su autonomia personale e regolazione',
                'review_date' => '2026-10-01',
            ])
            ->assertOk();

        $this->withToken($this->token)
            ->patchJson("/api/minors/{$minorId}/peis/{$peiId}/objectives/{$objectiveId}", [
                'progress_percent' => 55,
                'status' => 'in_progress',
            ])
            ->assertOk();

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}/peis/{$peiId}/history")
            ->assertOk()
            ->assertJsonCount(4)
            ->assertJsonPath('0.event_type', 'minor_pei_objective_updated');

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}/peis/{$peiId}/objectives/{$objectiveId}/progress")
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.progress_percent', 55)
            ->assertJsonPath('1.progress_percent', 10);

        $this->assertDatabaseHas('minor_pei_history_entries', [
            'minor_id' => $minorId,
            'minor_pei_id' => $peiId,
            'event_type' => 'minor_pei_updated',
        ]);

        $this->assertDatabaseHas('minor_pei_objective_progress_logs', [
            'minor_id' => $minorId,
            'minor_pei_id' => $peiId,
            'minor_pei_objective_id' => $objectiveId,
            'progress_percent' => 55,
        ]);
    }

    public function test_super_admin_can_upload_minor_document_and_read_history(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');
        config(['document_security.scan.driver' => 'fake-clean']);

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-0003',
                'first_name' => 'Anna',
                'last_name' => 'Neri',
                'birth_date' => '2013-01-01',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $upload = $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/documents", [
                'document_type_id' => $documentType->id,
                'issued_by' => 'Comune di Roma',
                'issue_date' => '2026-01-01',
                'classification' => 'restricted',
                'file' => UploadedFile::fake()->create('documento-minore.pdf', 256, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('document_type.code', 'MINOR_ID')
            ->assertJson(fn ($json) => $json
                ->where('attachment.security_status', fn ($value) => in_array($value, ['pending', 'clean'], true))
                ->etc());

        $documentId = $upload->json('id');

        $history = $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}/history")
            ->assertOk();

        $historyItems = collect($history->json());

        $this->assertGreaterThanOrEqual(2, $historyItems->count());
        $this->assertTrue($historyItems->contains(fn (array $item) => in_array($item['event_type'], ['minor_document_scan_clean', 'minor_document_uploaded'], true)));
        $this->assertTrue($historyItems->contains(fn (array $item) => ($item['actor']['email'] ?? null) === 'admin@familyhub.local'));

        $downloadResponse = $this->withToken($this->token)
            ->get("/api/minors/{$minorId}/documents/{$documentId}/download");

        $this->assertContains($downloadResponse->getStatusCode(), [200, 423]);
    }

    public function test_minor_document_upload_accepts_label_and_returns_it(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');
        config(['document_security.scan.driver' => 'fake-clean']);

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-LABEL-001',
                'first_name' => 'Lidia',
                'last_name' => 'Rosa',
                'birth_date' => '2013-01-01',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/documents", [
                'document_type_id' => $documentType->id,
                'label' => 'Decreto affidamento provvisorio',
                'issued_by' => 'Tribunale',
                'issue_date' => '2026-01-01',
                'classification' => 'restricted',
                'file' => UploadedFile::fake()->create('scan_20260615_0001.pdf', 256, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('label', 'Decreto affidamento provvisorio');

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}")
            ->assertOk()
            ->assertJsonPath('documents.0.label', 'Decreto affidamento provvisorio');
    }

    public function test_super_admin_can_preview_clean_minor_document_and_audit_it(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $minorId = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-0006',
            'first_name' => 'Marta',
            'last_name' => 'Viola',
            'birth_date' => '2014-03-01',
            'birth_city_id' => $city->id,
            'gender_identity_id' => $genderIdentity->id,
            'entry_date' => '2026-06-18',
            'minor_status_id' => $minorStatus->id,
        ])->id;

        Storage::disk('s3')->put('minors/test/preview-doc.pdf', 'preview-content');

        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => \App\Models\Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'minors/test/preview-doc.pdf',
            'original_name' => 'preview-doc.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('preview-content'),
            'sha256' => hash('sha256', 'preview-content'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => $adminUser->id,
        ]);

        $documentId = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'classification' => 'restricted',
        ])->id;

        $this->withToken($this->token)
            ->get("/api/minors/{$minorId}/documents/{$documentId}/preview")
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'resource_type' => 'minor_document_preview',
            'resource_id' => (string) $documentId,
        ]);

        $this->assertDatabaseHas('minor_history_entries', [
            'minor_id' => $minorId,
            'event_type' => 'minor_document_viewed',
        ]);

        $history = $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}/history")
            ->assertOk()
            ->json();

        $this->assertTrue(collect($history)->contains(fn (array $entry) => $entry['event_type'] === 'minor_document_viewed'));
        $this->assertTrue(AuditLog::query()->where('resource_type', 'minor_document_preview')->exists());
    }

    public function test_super_admin_can_upload_office_documents_when_policy_allows_them(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-OFFICE-01',
                'first_name' => 'Paolo',
                'last_name' => 'Verdi',
                'birth_date' => '2012-05-10',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/documents", [
                'document_type_id' => $documentType->id,
                'issued_by' => 'Tribunale',
                'issue_date' => '2026-01-01',
                'classification' => 'restricted',
                'file' => UploadedFile::fake()->create(
                    'provvedimento.docx',
                    128,
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ),
            ])
            ->assertCreated()
            ->assertJsonPath('attachment.mime_type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/documents", [
                'document_type_id' => $documentType->id,
                'issued_by' => 'Comune di Roma',
                'issue_date' => '2026-01-02',
                'classification' => 'restricted',
                'file' => UploadedFile::fake()->create(
                    'anagrafica.xlsx',
                    128,
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ),
            ])
            ->assertCreated()
            ->assertJsonPath('attachment.mime_type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_educator_cannot_download_restricted_minor_document(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $user = User::query()->create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'email' => 'educatore@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Mario',
            'last_name' => 'Educatore',
            'is_active' => true,
            'mfa_required' => false,
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $educatorRole->id,
            'valid_from' => now()->subDay(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'educatore@familyhub.local',
            'password' => 'password',
            'device_name' => 'minor-test-educator',
        ])->assertOk()->json('access_token');

        $this->assertFalse($user->fresh()->hasRoleIn(['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'PSICOLOGO']));
        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'educatore@familyhub.local');

        $minorId = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-0004',
            'first_name' => 'Sara',
            'last_name' => 'Blu',
            'birth_date' => '2014-01-01',
            'birth_city_id' => $city->id,
            'gender_identity_id' => $genderIdentity->id,
            'entry_date' => '2026-06-18',
            'minor_status_id' => $minorStatus->id,
        ])->id;

        Storage::disk('s3')->put('minors/test/documento-minore.pdf', 'fake-pdf-content');

        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => \App\Models\Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'minors/test/documento-minore.pdf',
            'original_name' => 'documento-minore.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('fake-pdf-content'),
            'sha256' => hash('sha256', 'fake-pdf-content'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => $adminUser->id,
        ]);

        $documentId = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'classification' => 'restricted',
        ])->id;

        $this->withToken($token)
            ->get("/api/minors/{$minorId}/documents/{$documentId}/download")
            ->assertForbidden();
    }

    public function test_educator_cannot_download_clinical_minor_document(): void
    {
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MEDICAL_REPORT')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $user = User::query()->create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'email' => 'educatore2@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Luca',
            'last_name' => 'Educatore',
            'is_active' => true,
            'mfa_required' => false,
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $educatorRole->id,
            'valid_from' => now()->subDay(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'educatore2@familyhub.local',
            'password' => 'password',
            'device_name' => 'minor-test-educator-2',
        ])->assertOk()->json('access_token');

        $this->assertFalse($user->fresh()->hasRoleIn(['SUPER_ADMIN', 'DIRETTORE', 'PSICOLOGO']));
        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'educatore2@familyhub.local');

        $minorId = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-0005',
            'first_name' => 'Gina',
            'last_name' => 'Rosa',
            'birth_date' => '2014-02-01',
            'birth_city_id' => $city->id,
            'gender_identity_id' => $genderIdentity->id,
            'entry_date' => '2026-06-18',
            'minor_status_id' => $minorStatus->id,
        ])->id;

        Storage::disk('s3')->put('minors/test/referto-clinico.pdf', 'clinical-content');

        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => \App\Models\Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'minors/test/referto-clinico.pdf',
            'original_name' => 'referto-clinico.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('clinical-content'),
            'sha256' => hash('sha256', 'clinical-content'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => $adminUser->id,
        ]);

        $documentId = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'classification' => 'clinical',
        ])->id;

        $this->withToken($token)
            ->get("/api/minors/{$minorId}/documents/{$documentId}/download")
            ->assertForbidden();
    }

    public function test_educator_can_preview_internal_minor_document_but_cannot_download_it(): void
    {
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $user = User::query()->create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'email' => 'educatore-preview@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Elena',
            'last_name' => 'Educatrice',
            'is_active' => true,
            'mfa_required' => false,
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $educatorRole->id,
            'valid_from' => now()->subDay(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'educatore-preview@familyhub.local',
            'password' => 'password',
            'device_name' => 'minor-test-educator-preview',
        ])->assertOk()->json('access_token');

        $minorId = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-0005A',
            'first_name' => 'Lia',
            'last_name' => 'Verde',
            'birth_date' => '2014-02-01',
            'birth_city_id' => $city->id,
            'gender_identity_id' => $genderIdentity->id,
            'entry_date' => '2026-06-18',
            'minor_status_id' => $minorStatus->id,
        ])->id;

        Storage::disk('s3')->put('minors/test/documento-interno-preview.pdf', 'internal-content');

        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => \App\Models\Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'minors/test/documento-interno-preview.pdf',
            'original_name' => 'documento-interno-preview.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('internal-content'),
            'sha256' => hash('sha256', 'internal-content'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => $adminUser->id,
        ]);

        $documentId = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'classification' => 'internal',
        ])->id;

        $this->assignUserToMinor($user, $minorId, $facility->id, $adminUser->id);

        $this->withToken($token)
            ->get("/api/minors/{$minorId}/documents/{$documentId}/preview")
            ->assertOk();

        $this->withToken($token)
            ->get("/api/minors/{$minorId}/documents/{$documentId}/download")
            ->assertForbidden();
    }

    public function test_psychologist_can_download_clinical_minor_document(): void
    {
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MEDICAL_REPORT')->firstOrFail();
        $role = Role::query()->where('code', 'PSICOLOGO')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $user = User::query()->create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'email' => 'psicologo@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Paola',
            'last_name' => 'Psicologa',
            'is_active' => true,
            'mfa_required' => false,
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $role->id,
            'valid_from' => now()->subDay(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'psicologo@familyhub.local',
            'password' => 'password',
            'device_name' => 'minor-test-psychologist',
        ])->assertOk()->json('access_token');

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-0006',
                'first_name' => 'Marta',
                'last_name' => 'Viola',
                'birth_date' => '2015-01-10',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        Storage::disk('s3')->put('minors/test/referto-clinico-2.pdf', 'clinical-content-2');

        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => \App\Models\Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'minors/test/referto-clinico-2.pdf',
            'original_name' => 'referto-clinico-2.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('clinical-content-2'),
            'sha256' => hash('sha256', 'clinical-content-2'),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => $adminUser->id,
        ]);

        $documentId = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'classification' => 'clinical',
        ])->id;

        $this->assignUserToMinor($user, $minorId, $facility->id, $adminUser->id);

        $this->withToken($token)
            ->get("/api/minors/{$minorId}/documents/{$documentId}/download")
            ->assertOk();
    }

    public function test_admin_can_create_minor_assignment_without_role_or_access_level_fields(): void
    {
        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $user = User::query()->create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'email' => 'educatore-assignment@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Nina',
            'last_name' => 'Educatrice',
            'is_active' => true,
            'mfa_required' => false,
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $educatorRole->id,
            'valid_from' => now()->subDay(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-0008',
                'first_name' => 'Lia',
                'last_name' => 'Arancio',
                'birth_date' => '2014-04-02',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $response = $this->withToken($this->token)
            ->postJson('/api/admin/minor-assignments', [
                'facility_id' => $facility->id,
                'minor_id' => $minorId,
                'user_id' => $user->id,
                'valid_from' => '2026-06-28',
                'valid_to' => null,
                'is_active' => true,
                'notes' => 'Assegnazione semplice',
            ])
            ->assertCreated()
            ->assertJsonMissingPath('assignment_role_code')
            ->assertJsonMissingPath('access_level')
            ->assertJsonPath('effective_role_code', 'EDUCATORE')
            ->assertJsonPath('effective_role_name', 'Educatore')
            ->assertJsonPath('user_id', $user->id)
            ->assertJsonPath('minor_id', $minorId)
            ->assertJsonPath('facility_id', $facility->id);

        $this->assertDatabaseHas('minor_user_assignments', [
            'minor_id' => $minorId,
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_bulk_sync_minor_assignments_for_user(): void
    {
        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $educatorRole = Role::query()->where('code', 'EDUCATORE')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $user = User::query()->create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'email' => 'bulk-user@familyhub.local',
            'password' => Hash::make('password'),
            'first_name' => 'Bulk',
            'last_name' => 'User',
            'is_active' => true,
            'mfa_required' => false,
        ]);

        UserFacilityRole::query()->create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'role_id' => $educatorRole->id,
            'valid_from' => now()->subDay(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $adminUser->id,
        ]);

        $minorOne = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-0009',
                'first_name' => 'Uno',
                'last_name' => 'Test',
                'birth_date' => '2014-05-01',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])->assertCreated()->json('id');

        $minorTwo = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-0010',
                'first_name' => 'Due',
                'last_name' => 'Test',
                'birth_date' => '2014-05-02',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])->assertCreated()->json('id');

        $this->withToken($this->token)
            ->postJson("/api/admin/users/{$user->id}/minor-assignments/bulk-sync", [
                'facility_id' => $facility->id,
                'minor_ids' => [$minorOne, $minorTwo],
                'valid_from' => '2026-06-28',
                'valid_to' => null,
                'is_active' => true,
                'notes' => 'Bulk test',
            ])
            ->assertOk()
            ->assertJsonPath('synced_minor_ids.0', $minorOne)
            ->assertJsonPath('synced_minor_ids.1', $minorTwo);

        $this->assertDatabaseCount('minor_user_assignments', 2);
        $this->assertDatabaseHas('minor_user_assignments', ['minor_id' => $minorOne, 'user_id' => $user->id, 'is_active' => true]);
        $this->assertDatabaseHas('minor_user_assignments', ['minor_id' => $minorTwo, 'user_id' => $user->id, 'is_active' => true]);
    }

    private function assignUserToMinor(User $user, int $minorId, int $facilityId, int $assignedByUserId): void
    {
        MinorUserAssignment::query()->create([
            'minor_id' => $minorId,
            'user_id' => $user->id,
            'facility_id' => $facilityId,
            'valid_from' => now()->subDay()->toDateString(),
            'valid_to' => null,
            'is_active' => true,
            'assigned_by_user_id' => $assignedByUserId,
            'notes' => 'Test assignment',
        ]);
    }

    public function test_document_download_is_blocked_until_security_scan_is_clean(): void
    {
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-0007',
                'first_name' => 'Elena',
                'last_name' => 'Grigi',
                'birth_date' => '2015-02-15',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        Storage::disk('s3')->put('quarantine/minors/test/pending.pdf', 'pending-content');

        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => \App\Models\Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'quarantine/minors/test/pending.pdf',
            'original_name' => 'pending.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('pending-content'),
            'sha256' => hash('sha256', 'pending-content'),
            'is_encrypted' => true,
            'security_status' => 'pending',
            'quarantined_at' => now(),
            'uploaded_by_user_id' => $adminUser->id,
        ]);

        $documentId = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'classification' => 'restricted',
        ])->id;

        $this->withToken($this->token)
            ->get("/api/minors/{$minorId}/documents/{$documentId}/download")
            ->assertStatus(423);
    }

    public function test_super_admin_can_read_minor_pei_dashboard_trends(): void
    {
        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();

        $minorId = $this->withToken($this->token)
            ->postJson('/api/minors', [
                'facility_id' => $facility->id,
                'internal_code' => 'MIN-PEI-TREND-01',
                'first_name' => 'Trend',
                'last_name' => 'Pei',
                'birth_date' => '2014-07-01',
                'birth_city_id' => $city->id,
                'gender_identity_id' => $genderIdentity->id,
                'entry_date' => '2026-06-18',
                'minor_status_id' => $minorStatus->id,
            ])
            ->assertCreated()
            ->json('id');

        $peiId = $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/peis", [
                'title' => 'PEI Dashboard',
                'status' => 'active',
            ])
            ->assertCreated()
            ->json('id');

        $objectiveId = $this->withToken($this->token)
            ->postJson("/api/minors/{$minorId}/peis/{$peiId}/objectives", [
                'code' => 'OBJ-TREND-01',
                'title' => 'Obiettivo trend',
                'status' => 'in_progress',
                'progress_percent' => 30,
            ])
            ->assertCreated()
            ->json('id');

        $activityType = \App\Models\ActivityType::query()->where('code', 'LAB')->firstOrFail();
        $journalType = \App\Models\JournalEntryType::query()->where('code', 'OBSERVATION')->firstOrFail();

        $this->withToken($this->token)
            ->postJson('/api/activities', [
                'minor_id' => $minorId,
                'activity_type_id' => $activityType->id,
                'title' => 'Attività trend',
                'planned_start_at' => '2026-07-03 10:00:00',
                'status' => 'completed',
                'pei_objective_id' => $objectiveId,
            ])
            ->assertCreated();

        $this->withToken($this->token)
            ->postJson('/api/journals', [
                'minor_id' => $minorId,
                'journal_entry_type_id' => $journalType->id,
                'observed_at' => '2026-07-03 15:00:00',
                'title' => 'Diario trend',
                'content' => 'Osservazione collegata al PEI.',
                'priority_level' => 'green',
                'pei_objective_id' => $objectiveId,
            ])
            ->assertCreated();

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}")
            ->assertOk()
            ->assertJsonPath('pei_trends.summary.total_peis', 1)
            ->assertJsonPath('pei_trends.summary.active_peis', 1)
            ->assertJsonPath('pei_trends.summary.total_objectives', 1)
            ->assertJsonPath('pei_trends.summary.linked_activity_events', 1)
            ->assertJsonPath('pei_trends.summary.linked_journal_events', 1)
            ->assertJsonPath('pei_trends.objective_trends.0.objective_id', $objectiveId)
            ->assertJsonPath('pei_trends.objective_trends.0.series.1.source_type', 'minor_activity');
    }

    public function test_super_admin_can_read_structured_preview_for_xlsx_minor_document(): void
    {
        Storage::fake('s3');

        $facility = Facility::query()->firstOrFail();
        $city = City::query()->where('name', 'Roma')->firstOrFail();
        $minorStatus = MinorStatus::query()->where('code', 'ACTIVE')->firstOrFail();
        $genderIdentity = GenderIdentity::query()->where('code', 'MALE')->firstOrFail();
        $documentType = DocumentType::query()->where('code', 'MINOR_ID')->firstOrFail();
        $adminUser = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $minorId = Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => 'MIN-XLSX-01',
            'first_name' => 'Excel',
            'last_name' => 'Preview',
            'birth_date' => '2014-08-01',
            'birth_city_id' => $city->id,
            'gender_identity_id' => $genderIdentity->id,
            'entry_date' => '2026-06-18',
            'minor_status_id' => $minorStatus->id,
        ])->id;

        Storage::disk('s3')->put('minors/test/structured-preview.xlsx', $this->fakeXlsxBinary());

        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => \App\Models\Minor::class,
            'owner_id' => $minorId,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-bucket',
            'path' => 'minors/test/structured-preview.xlsx',
            'original_name' => 'structured-preview.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size_bytes' => strlen($this->fakeXlsxBinary()),
            'sha256' => hash('sha256', $this->fakeXlsxBinary()),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'released_at' => now(),
            'uploaded_by_user_id' => $adminUser->id,
        ]);

        $documentId = MinorDocument::query()->create([
            'minor_id' => $minorId,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'classification' => 'internal',
        ])->id;

        $this->withToken($this->token)
            ->getJson("/api/minors/{$minorId}/documents/{$documentId}/preview-structured")
            ->assertOk()
            ->assertJsonPath('kind', 'spreadsheet')
            ->assertJsonPath('format', 'xlsx')
            ->assertJsonPath('sheets.0.name', 'Foglio1')
            ->assertJsonPath('sheets.0.rows.0.0', 'Nome')
            ->assertJsonPath('sheets.0.rows.0.1', 'Valore')
            ->assertJsonPath('sheets.0.rows.1.0', 'Comune')
            ->assertJsonPath('sheets.0.rows.1.1', 'Roma');
    }

    private function fakeXlsxBinary(): string
    {
        return (string) base64_decode('UEsDBBQAAAAIAJgGCV2xA9fkDAEAALUCAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbK2Sy07DMBBF9/0Ky9sqdssCIZS0Cx5LQKJ8gHEmiVV7bHmmIfw9SspLiFIWXc1i7txzZLlcD8GLHjK5iJVcqoUUgDbWDttKPm1uiwu5Xs3KzWsCEkPwSJXsmNOl1mQ7CIZUTIBD8E3MwTCpmFudjN2aFvTZYnGubUQG5ILHDrmaCVFeQ2N2nsXNwIB7dAZPUlztsyOukiYl76xhF1H3WP8AFe8QlcFPGepcovkQvNSHIOPyMOPr9L6HnF0N4sFkvjMBKqkHr19i3j7HuFV/9/ziGpvGWaij3QVAVpQymJo6AA5eTVMF43D+LwUa86SnsTyxy2f/cRXqTIb6kbPDlk7+JN+6P1RKPX3D1RtQSwMEFAAAAAgAmAYJXedHanKqAAAAGwEAAAsAAABfcmVscy8ucmVsc43PsQ7CIBSF4b1PQe5uaR2MMaVdjElXUx8A6W1LClwCqPj2rmoc3E++k7/psjXsjiFqcgLqsgKGTtGo3SzgMpw2e+jaojmjkUmTi4v2kWVrXBSwpOQPnEe1oJWxJI8uWzNRsDLFksLMvVSrnJFvq2rHw7sBbcHYB8v6UUDoxxrY8PT4D0/TpBUeSd0suvTj5WsBbJBhxiQgG/6gsF6J1jJbA7wtGv4R2b4AUEsDBBQAAAAIAJgGCV1GY+9LuQAAABgBAAAPAAAAeGwvd29ya2Jvb2sueG1sjY/BasMwEETv+Qqx91h2DiUYy7mEQO7tB6jW2hbRas2u0vrzSx18z21mYN4w3WWlZH5QNHJ20FQ1GMwDh5gnB1+ft+MZLv2h+2V5fDM/zEopq4O5lKW1VocZyWvFC+aV0shCvmjFMlldBH3QGbFQsqe6/rDkY4YXoZV3GDyOccArD0/CXF4QweRL5KxzXBT6gzHdNqL/cjcme0IHN55S5AbMFt6DgwaMtDE4kHtowG51u/c7u9/s/wBQSwMEFAAAAAgAmAYJXex/TR7GAAAArAEAABoAAAB4bC9fcmVscy93b3JrYm9vay54bWwucmVsc62Qy2rDMBBF9/kKMftadhalFMvZhEK2qfMBQh5LInoxo7TO3wcCfRha6KKrC3dx7uH2uyUG8YbEPicFXdOCwGTy5JNVcBpfHp5gN2z6IwZdfU7sfGGxxJBYgau1PEvJxmHU3OSCaYlhzhR15SaTlUWbs7Yot237KOk7A4aNECusOEwK6DB1IMZrwb/g8zx7g/tsLhFT/WFFvmc6s0OsIEZNFquCz4rlPbpmiQHkrz7b//Rhpwmn10o+Wf5yWtUfPr1cvT7cAFBLAwQUAAAACACYBgldPa5YiZ4AAADvAAAAFAAAAHhsL3NoYXJlZFN0cmluZ3MueG1sbcmxCsIwEIDhvU8RsttUERFJ4yA4Ooi6h3raQO6u5q7Sx3cSHTr+3+/3E2bzhiKJqbXLurEGqON7omdrr5fjYmv3ofIiaibMJK3tVYedc9L1gFFqHoAmzA8uGFVqLk8nQ4F4lx5AMbtV02wcxkTWdDyStnZtzUjpNcLh26EyxksKXsOJEbzT4J2kP77FzGVuHBhHmhtnxvhj70Q0fABQSwMEFAAAAAgAmAYJXe//cyG4AAAAYAEAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWxtkEEOgjAQRfecYjJ7GcDEGDMt0RhPoAdosAqRtqRtgOMbWBgwLOfP+3mZ4XI0LfTah8ZZgXmaIWhbuWdj3wIf99vuiKVMeHD+E2qtI4ymtUFgHWN3IgpVrY0Kqeu0HU37ct6oGFLn3xQ6r9VzLpmWiiw7kFGNRZkA8BxfVVTTBMDeDeAF5vN2TqppPucIUWBAyb3MmHrJVK2RyxLJVwiTd8NaUPwLikW72BYskf22gGlxENPvW/ILUEsBAhQAFAAAAAgAmAYJXbED1+QMAQAAtQIAABMAAAAAAAAAAAAAAIABAAAAAFtDb250ZW50X1R5cGVzXS54bWxQSwECFAAUAAAACACYBgld50dqcqoAAAAbAQAACwAAAAAAAAAAAAAAgAE9AQAAX3JlbHMvLnJlbHNQSwECFAAUAAAACACYBgldRmPvS7kAAAAYAQAADwAAAAAAAAAAAAAAgAEQAgAAeGwvd29ya2Jvb2sueG1sUEsBAhQAFAAAAAgAmAYJXex/TR7GAAAArAEAABoAAAAAAAAAAAAAAIAB9gIAAHhsL19yZWxzL3dvcmtib29rLnhtbC5yZWxzUEsBAhQAFAAAAAgAmAYJXT2uWImeAAAA7wAAABQAAAAAAAAAAAAAAIAB9AMAAHhsL3NoYXJlZFN0cmluZ3MueG1sUEsBAhQAFAAAAAgAmAYJXe//cyG4AAAAYAEAABgAAAAAAAAAAAAAAIABxAQAAHhsL3dvcmtzaGVldHMvc2hlZXQxLnhtbFBLBQYAAAAABgAGAIcBAACyBQAAAAA=', true);
    }
}
