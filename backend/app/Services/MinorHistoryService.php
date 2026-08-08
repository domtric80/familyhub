<?php

namespace App\Services;

use App\Models\Minor;
use App\Models\MinorHistoryEntry;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;

class MinorHistoryService
{
    public function record(Minor $minor, string $eventType, ?Authenticatable $actor = null, array $metadata = []): MinorHistoryEntry
    {
        $minor->loadMissing([
            'facility.organization',
            'birthCity.province.region.country',
            'genderIdentity',
            'minorStatus',
            'profile',
            'diagnoses',
            'peis.objectives.responsibleStaffMember',
            'needs.responsibleStaffMember',
            'needs.attachmentDocument.attachment',
            'contacts.contactType',
            'contacts.city.province.region.country',
            'documents.documentType',
            'documents.documentIssuer',
            'documents.documentClassification',
            'documents.attachment',
        ]);

        return MinorHistoryEntry::query()->create([
            'minor_id' => $minor->id,
            'facility_id' => $minor->facility_id,
            'event_type' => $eventType,
            'actor_user_id' => $actor?->getAuthIdentifier(),
            'snapshot' => $this->buildSnapshot($minor),
            'metadata' => $metadata ?: null,
        ]);
    }

    public function recordAccess(Minor $minor, string $eventType, ?Authenticatable $actor = null, array $metadata = []): MinorHistoryEntry
    {
        return $this->record($minor, $eventType, $actor, [
            'actor_display_name' => $this->resolveActorDisplayName($actor),
            'occurred_at_utc' => now()->utc()->toISOString(),
            ...$metadata,
        ]);
    }

    private function resolveActorDisplayName(?Authenticatable $actor): string
    {
        if ($actor instanceof User) {
            $displayName = trim("{$actor->first_name} {$actor->last_name}");

            return $displayName !== '' ? $displayName : $actor->email;
        }

        return 'system';
    }

    private function buildSnapshot(Minor $minor): array
    {
        return [
            'minor' => [
                'id' => $minor->id,
                'facility_id' => $minor->facility_id,
                'facility_name' => $minor->facility?->name,
                'organization_name' => $minor->facility?->organization?->name,
                'internal_code' => $minor->internal_code,
                'first_name' => $minor->first_name,
                'last_name' => $minor->last_name,
                'preferred_name' => $minor->preferred_name,
                'birth_date' => optional($minor->birth_date)->format('Y-m-d'),
                'birth_place' => [
                    'country' => $minor->birthCity?->province?->region?->country?->name,
                    'province' => $minor->birthCity?->province?->name,
                    'city' => $minor->birthCity?->name,
                ],
                'gender' => $minor->genderIdentity?->name,
                'tax_code' => $minor->tax_code,
                'entry_date' => optional($minor->entry_date)->format('Y-m-d'),
                'status' => $minor->minorStatus?->name,
            ],
            'profile' => [
                'family_background' => $minor->profile?->family_background,
                'life_history' => $minor->profile?->life_history,
                'learning_styles' => $minor->profile?->learning_styles,
                'interests' => $minor->profile?->interests,
                'hobbies' => $minor->profile?->hobbies,
                'strengths' => $minor->profile?->strengths,
                'risk_factors' => $minor->profile?->risk_factors,
                'crisis_indicators' => $minor->profile?->crisis_indicators,
            ],
            'diagnoses' => $minor->diagnoses->map(fn ($diagnosis) => [
                'id' => $diagnosis->id,
                'diagnosis_code' => $diagnosis->diagnosis_code,
                'diagnosis_label' => $diagnosis->diagnosis_label,
                'dsm_code' => $diagnosis->dsm_code,
                'diagnosed_at' => optional($diagnosis->diagnosed_at)->format('Y-m-d'),
                'review_due_at' => optional($diagnosis->review_due_at)->format('Y-m-d'),
                'is_primary' => (bool) $diagnosis->is_primary,
                'is_active' => (bool) $diagnosis->is_active,
            ])->values()->all(),
            'peis' => $minor->peis->map(fn ($pei) => [
                'id' => $pei->id,
                'title' => $pei->title,
                'status' => $pei->status,
                'digital_signature_status' => $pei->digital_signature_status,
                'start_date' => optional($pei->start_date)->format('Y-m-d'),
                'review_date' => optional($pei->review_date)->format('Y-m-d'),
                'end_date' => optional($pei->end_date)->format('Y-m-d'),
                'signed_at' => optional($pei->signed_at)?->toISOString(),
                'objectives' => $pei->objectives->map(fn ($objective) => [
                    'id' => $objective->id,
                    'code' => $objective->code,
                    'title' => $objective->title,
                    'status' => $objective->status,
                    'progress_percent' => $objective->progress_percent,
                    'due_date' => optional($objective->due_date)->format('Y-m-d'),
                    'responsible_staff_member' => $objective->responsibleStaffMember?->first_name
                        ? trim($objective->responsibleStaffMember->first_name.' '.$objective->responsibleStaffMember->last_name)
                        : null,
                ])->values()->all(),
            ])->values()->all(),
            'needs' => $minor->needs->map(fn ($need) => [
                'id' => $need->id,
                'category_code' => $need->category_code,
                'title' => $need->title,
                'priority' => $need->priority,
                'status' => $need->status,
                'responsible_staff_member' => $need->responsibleStaffMember?->first_name
                    ? trim($need->responsibleStaffMember->first_name.' '.$need->responsibleStaffMember->last_name)
                    : null,
                'attachment_document_name' => $need->attachmentDocument?->attachment?->original_name,
            ])->values()->all(),
            'contacts' => $minor->contacts->map(fn ($contact) => [
                'id' => $contact->id,
                'type' => $contact->contactType?->name,
                'first_name' => $contact->first_name,
                'last_name' => $contact->last_name,
                'phone' => $contact->phone,
                'email' => $contact->email,
                'city' => $contact->city?->name,
                'province' => $contact->city?->province?->name,
                'country' => $contact->city?->province?->region?->country?->name,
                'notes' => $contact->notes,
            ])->values()->all(),
            'documents' => $minor->documents->map(fn ($document) => [
                'id' => $document->id,
                'type' => $document->documentType?->name,
                'original_name' => $document->attachment?->original_name,
                'mime_type' => $document->attachment?->mime_type,
                'size_bytes' => $document->attachment?->size_bytes,
                'sha256' => $document->attachment?->sha256,
                'security_status' => $document->attachment?->security_status,
                'scanner_engine' => $document->attachment?->scanner_engine,
                'classification' => $document->classification_code ?: $document->classification,
                'classification_label' => $document->documentClassification?->name,
                'document_issuer_id' => $document->document_issuer_id,
                'issued_by' => $document->issued_by,
                'issuer_label' => $document->documentIssuer?->name,
                'issue_date' => optional($document->issue_date)->format('Y-m-d'),
                'expiry_date' => optional($document->expiry_date)->format('Y-m-d'),
            ])->values()->all(),
        ];
    }
}
