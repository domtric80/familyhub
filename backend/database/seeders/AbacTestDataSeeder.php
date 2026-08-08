<?php

namespace Database\Seeders;

use App\Models\Attachment;
use App\Models\Facility;
use App\Models\Minor;
use App\Models\MinorProfile;
use App\Models\MinorUserAssignment;
use App\Models\Role;
use App\Models\StaffMember;
use App\Models\User;
use App\Models\UserFacilityRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AbacTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $facility = Facility::query()->findOrFail(2);
        $minorStatusId = 1;
        $birthCityId = 1;
        $documentTypeId = 4;

        $admin = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();

        $users = [
            'pediatra' => $this->upsertUser('qa.pediatra@familyhub.local', 'Paolo', 'Medici'),
            'psicologo' => $this->upsertUser('qa.psicologo@familyhub.local', 'Chiara', 'Neri'),
            'educatore' => $this->upsertUser('qa.educatore@familyhub.local', 'Luca', 'Verdi'),
            'coordinatore' => $this->upsertUser('qa.coordinatore@familyhub.local', 'Elena', 'Blu'),
        ];

        $this->ensureRoleAssignment($users['pediatra'], $facility->id, 'PEDIATRA', $admin->id);
        $this->ensureRoleAssignment($users['psicologo'], $facility->id, 'PSICOLOGO', $admin->id);
        $this->ensureRoleAssignment($users['educatore'], $facility->id, 'EDUCATORE', $admin->id);
        $this->ensureRoleAssignment($users['coordinatore'], $facility->id, 'COORDINATORE', $admin->id);

        $this->ensureStaffMember($users['pediatra'], $facility->id, 'QA-PED-01', 'Pediatra');
        $this->ensureStaffMember($users['psicologo'], $facility->id, 'QA-PSI-01', 'Psicologo');
        $this->ensureStaffMember($users['educatore'], $facility->id, 'QA-EDU-01', 'Educatore');

        $minorA = Minor::query()->findOrFail(1);
        $minorB = Minor::query()->firstOrCreate(
            ['facility_id' => $facility->id, 'internal_code' => 'MIN-QA-ABAC-02'],
            [
                'first_name' => 'Giulia',
                'last_name' => 'Bianchi',
                'preferred_name' => 'Giulia',
                'birth_date' => '2012-05-14',
                'birth_city_id' => $birthCityId,
                'biological_sex_id' => 1,
                'gender_identity_id' => 1,
                'tax_code' => null,
                'entry_date' => '2026-06-01',
                'minor_status_id' => $minorStatusId,
            ]
        );

        $this->ensureProfile($minorA, 'Caso ABAC 1', $admin->id);
        $this->ensureProfile($minorB, 'Caso ABAC 2', $admin->id);

        $this->ensureMinorAssignment($minorA, $users['pediatra'], $facility->id, $admin->id);
        $this->ensureMinorAssignment($minorA, $users['psicologo'], $facility->id, $admin->id);
        $this->ensureMinorAssignment($minorA, $users['educatore'], $facility->id, $admin->id);
        $this->ensureMinorAssignment($minorB, $users['psicologo'], $facility->id, $admin->id);
        $this->ensureMinorAssignment($minorB, $users['educatore'], $facility->id, $admin->id);

        $this->ensureMinorDocument($minorA, $documentTypeId, 'public', 'qa-public-minor-a.txt', 'Documento pubblico di test ABAC A');
        $this->ensureMinorDocument($minorA, $documentTypeId, 'restricted', 'qa-restricted-minor-a.txt', 'Documento riservato di test ABAC A');
        $this->ensureMinorDocument($minorA, $documentTypeId, 'clinical', 'qa-clinical-minor-a.txt', 'Documento clinico di test ABAC A');
        $this->ensureMinorDocument($minorB, $documentTypeId, 'clinical', 'qa-clinical-minor-b.txt', 'Documento clinico di test ABAC B');
    }

    private function upsertUser(string $email, string $firstName, string $lastName): User
    {
        return User::query()->updateOrCreate(
            ['email' => $email],
            [
                'uuid' => (string) Str::uuid(),
                'first_name' => $firstName,
                'last_name' => $lastName,
                'password' => Hash::make('Password1234!'),
                'is_active' => true,
                'mfa_required' => false,
            ]
        );
    }

    private function ensureRoleAssignment(User $user, int $facilityId, string $roleCode, int $assignedByUserId): void
    {
        $roleId = Role::query()->where('code', $roleCode)->value('id');

        UserFacilityRole::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'facility_id' => $facilityId,
                'role_id' => $roleId,
                'valid_from' => '2026-06-01 00:00:00',
            ],
            [
                'valid_to' => null,
                'is_active' => true,
                'assigned_by_user_id' => $assignedByUserId,
            ]
        );
    }

    private function ensureStaffMember(User $user, int $facilityId, string $employeeCode, string $qualification): void
    {
        StaffMember::query()->updateOrCreate(
            ['facility_id' => $facilityId, 'employee_code' => $employeeCode],
            [
                'user_id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'qualification' => $qualification,
                'status' => 'active',
            ]
        );
    }

    private function ensureProfile(Minor $minor, string $tag, int $updatedByUserId): void
    {
        MinorProfile::query()->updateOrCreate(
            ['minor_id' => $minor->id],
            [
                'family_background' => "Profilo demo {$tag}",
                'life_history' => "Storico demo {$tag}",
                'risk_factors' => "Rischi demo {$tag}",
                'crisis_indicators' => "Indicatori demo {$tag}",
                'clinical_notes_encrypted' => encrypt("Note cliniche demo {$tag}"),
                'updated_by_user_id' => $updatedByUserId,
            ]
        );
    }

    private function ensureMinorAssignment(Minor $minor, User $user, int $facilityId, int $assignedByUserId): void
    {
        MinorUserAssignment::query()->updateOrCreate(
            [
                'minor_id' => $minor->id,
                'user_id' => $user->id,
                'facility_id' => $facilityId,
                'valid_from' => '2026-06-01',
            ],
            [
                'valid_to' => null,
                'is_active' => true,
                'assigned_by_user_id' => $assignedByUserId,
                'notes' => 'Dato di test ABAC',
            ]
        );
    }

    private function ensureMinorDocument(Minor $minor, int $documentTypeId, string $classification, string $fileName, string $content): void
    {
        $disk = config('filesystems.default', 's3');
        $bucket = (string) config("filesystems.disks.{$disk}.bucket", '');
        $path = "released/minors/{$minor->id}/documents/{$fileName}";

        Storage::disk($disk)->put($path, $content);

        $attachment = Attachment::query()->updateOrCreate(
            ['disk' => $disk, 'bucket' => $bucket, 'path' => $path],
            [
                'facility_id' => $minor->facility_id,
                'owner_type' => Minor::class,
                'owner_id' => $minor->id,
                'document_type_id' => $documentTypeId,
                'original_name' => $fileName,
                'mime_type' => 'text/plain',
                'size_bytes' => strlen($content),
                'sha256' => hash('sha256', $content),
                'is_encrypted' => true,
                'security_status' => 'clean',
                'released_at' => now(),
                'uploaded_by_user_id' => 1,
            ]
        );

        \App\Models\MinorDocument::query()->updateOrCreate(
            [
                'minor_id' => $minor->id,
                'attachment_id' => $attachment->id,
            ],
            [
                'document_type_id' => $documentTypeId,
                'issued_by' => 'QA Seeder',
                'issue_date' => '2026-06-01',
                'expiry_date' => null,
                'classification' => $classification,
            ]
        );
    }
}
