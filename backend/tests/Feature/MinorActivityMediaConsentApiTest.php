<?php

namespace Tests\Feature;

use App\Models\ActivityType;
use App\Models\Attachment;
use App\Models\DocumentClassification;
use App\Models\DocumentType;
use App\Models\Facility;
use App\Models\Minor;
use App\Models\MinorActivity;
use App\Models\MinorDocument;
use App\Models\MinorStatus;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MinorActivityMediaConsentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_media_requires_clean_same_minor_documents_and_consent_can_be_revoked(): void
    {
        $this->seed(DatabaseSeeder::class);
        $token = (string) $this->postJson('/api/auth/login', [
            'email' => 'admin@familyhub.local',
            'password' => 'password',
            'device_name' => 'phpunit-activity-media',
        ])->assertOk()->json('access_token');
        $user = User::query()->where('email', 'admin@familyhub.local')->firstOrFail();
        $facility = Facility::query()->firstOrFail();
        $minor = $this->createMinor($facility, 'MIN-MEDIA-001');
        $otherMinor = $this->createMinor($facility, 'MIN-MEDIA-002');
        $activity = MinorActivity::query()->create([
            'facility_id' => $facility->id,
            'minor_id' => $minor->id,
            'activity_type_id' => ActivityType::query()->firstOrFail()->id,
            'title' => 'Laboratorio fotografico',
            'planned_start_at' => now()->subDay(),
            'status' => 'completed',
            'attendance_status' => 'present',
            'requires_transport' => false,
            'follow_up_required' => false,
        ]);
        $mediaDocument = $this->createDocument($minor, $facility, $user, 'foto.jpg', 'image/jpeg');
        $consentDocument = $this->createDocument($minor, $facility, $user, 'consenso.pdf', 'application/pdf', now()->addYear()->toDateString());
        $foreignDocument = $this->createDocument($otherMinor, $facility, $user, 'altra-foto.jpg', 'image/jpeg');

        $this->withToken($token)->postJson("/api/activities/{$activity->id}/media", [
            'media_document_id' => $foreignDocument->id,
            'consent_document_id' => $consentDocument->id,
        ])->assertStatus(422);

        $media = $this->withToken($token)->postJson("/api/activities/{$activity->id}/media", [
            'media_document_id' => $mediaDocument->id,
            'consent_document_id' => $consentDocument->id,
            'captured_at' => now()->subDay()->toIso8601String(),
        ])->assertCreated()
            ->assertJsonPath('consent_status', 'valid')
            ->assertJsonPath('can_preview', true)
            ->assertJsonMissingPath('media_document.path')
            ->assertJsonMissingPath('media_document.bucket')
            ->json();

        $this->withToken($token)->getJson("/api/activities/{$activity->id}/media")
            ->assertOk()
            ->assertJsonPath('0.id', $media['id'])
            ->assertJsonPath('0.can_preview', true);

        $reason = 'Revoca espressa del consenso da parte del tutore.';
        $this->withToken($token)->postJson("/api/activities/{$activity->id}/media/{$media['id']}/revoke-consent", ['reason' => $reason])
            ->assertOk()
            ->assertJsonPath('consent_status', 'revoked')
            ->assertJsonPath('can_preview', false)
            ->assertJsonPath('already_revoked', false);
        $this->withToken($token)->postJson("/api/activities/{$activity->id}/media/{$media['id']}/revoke-consent", ['reason' => $reason])
            ->assertOk()
            ->assertJsonPath('already_revoked', true);
        $this->withToken($token)->deleteJson("/api/activities/{$activity->id}/media/{$media['id']}")->assertStatus(409);

        $storedReason = (string) \DB::table('minor_activity_media')->where('id', $media['id'])->value('consent_revocation_reason_encrypted');
        $this->assertNotSame($reason, $storedReason);
        $this->assertDatabaseHas('audit_logs', ['resource_type' => 'minor_activity_media', 'action' => 'revoke']);
        $this->assertDatabaseHas('minor_history_entries', ['minor_id' => $minor->id, 'event_type' => 'minor_activity_media_revoke']);
    }

    private function createMinor(Facility $facility, string $code): Minor
    {
        return Minor::query()->create([
            'facility_id' => $facility->id,
            'internal_code' => $code,
            'first_name' => 'Elisa',
            'last_name' => $code,
            'birth_date' => '2012-01-01',
            'entry_date' => '2026-01-01',
            'minor_status_id' => MinorStatus::query()->firstOrFail()->id,
        ]);
    }

    private function createDocument(Minor $minor, Facility $facility, User $user, string $name, string $mimeType, ?string $expiryDate = null): MinorDocument
    {
        $documentType = DocumentType::query()->where('scope', 'minor')->firstOrFail();
        $classification = DocumentClassification::query()->where('is_active', true)->firstOrFail();
        $attachment = Attachment::query()->create([
            'facility_id' => $facility->id,
            'owner_type' => Minor::class,
            'owner_id' => $minor->id,
            'document_type_id' => $documentType->id,
            'disk' => 's3',
            'bucket' => 'test-private',
            'path' => 'released/test/'.uniqid('', true).'/'.$name,
            'original_name' => $name,
            'mime_type' => $mimeType,
            'size_bytes' => 1024,
            'sha256' => hash('sha256', $name.uniqid('', true)),
            'is_encrypted' => true,
            'security_status' => 'clean',
            'uploaded_by_user_id' => $user->id,
        ]);

        return MinorDocument::query()->create([
            'minor_id' => $minor->id,
            'document_type_id' => $documentType->id,
            'attachment_id' => $attachment->id,
            'label' => $name,
            'expiry_date' => $expiryDate,
            'classification_code' => $classification->code,
            'classification' => $classification->code,
        ]);
    }
}
