<?php

namespace App\Services;

use App\Models\MinorPei;
use App\Models\MinorPeiHistoryEntry;
use App\Models\MinorPeiObjective;
use App\Models\MinorPeiObjectiveProgressLog;
use Illuminate\Contracts\Auth\Authenticatable;

class MinorPeiHistoryService
{
    public function recordPeiEvent(MinorPei $pei, string $eventType, ?Authenticatable $actor = null, array $metadata = []): MinorPeiHistoryEntry
    {
        $pei->loadMissing([
            'minor',
            'signedBy:id,first_name,last_name,email',
            'updatedBy:id,first_name,last_name,email',
            'objectives.responsibleStaffMember.qualificationLookup',
        ]);

        $nextVersion = ((int) $pei->historyEntries()->max('version_number')) + 1;

        return MinorPeiHistoryEntry::query()->create([
            'minor_id' => $pei->minor_id,
            'minor_pei_id' => $pei->id,
            'event_type' => $eventType,
            'version_number' => $nextVersion,
            'snapshot' => $this->buildPeiSnapshot($pei),
            'metadata' => $metadata ?: null,
            'actor_user_id' => $actor?->getAuthIdentifier(),
            'created_at' => now(),
        ]);
    }

    public function recordObjectiveProgress(
        MinorPeiObjective $objective,
        ?Authenticatable $actor = null,
        ?string $notes = null,
        ?string $sourceType = null,
        ?string $sourceId = null,
        ?string $sourceLabel = null,
    ): MinorPeiObjectiveProgressLog
    {
        $objective->loadMissing([
            'pei.minor',
        ]);

        return MinorPeiObjectiveProgressLog::query()->create([
            'minor_id' => $objective->pei->minor_id,
            'minor_pei_id' => $objective->minor_pei_id,
            'minor_pei_objective_id' => $objective->id,
            'progress_percent' => (int) $objective->progress_percent,
            'status' => $objective->status,
            'notes' => $notes,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'source_label' => $sourceLabel,
            'actor_user_id' => $actor?->getAuthIdentifier(),
            'created_at' => now(),
        ]);
    }

    private function buildPeiSnapshot(MinorPei $pei): array
    {
        return [
            'pei' => [
                'id' => $pei->id,
                'minor_id' => $pei->minor_id,
                'title' => $pei->title,
                'summary' => $pei->summary,
                'start_date' => optional($pei->start_date)->format('Y-m-d'),
                'review_date' => optional($pei->review_date)->format('Y-m-d'),
                'end_date' => optional($pei->end_date)->format('Y-m-d'),
                'status' => $pei->status,
                'digital_signature_status' => $pei->digital_signature_status,
                'signed_at' => optional($pei->signed_at)?->toISOString(),
                'signed_by' => $pei->signedBy ? [
                    'id' => $pei->signedBy->id,
                    'display_name' => trim($pei->signedBy->first_name.' '.$pei->signedBy->last_name) ?: $pei->signedBy->email,
                    'email' => $pei->signedBy->email,
                ] : null,
            ],
            'objectives' => $pei->objectives->map(fn (MinorPeiObjective $objective) => [
                'id' => $objective->id,
                'code' => $objective->code,
                'title' => $objective->title,
                'description' => $objective->description,
                'due_date' => optional($objective->due_date)->format('Y-m-d'),
                'status' => $objective->status,
                'progress_percent' => $objective->progress_percent,
                'responsible_staff_member' => $objective->responsibleStaffMember ? [
                    'id' => $objective->responsibleStaffMember->id,
                    'display_name' => trim($objective->responsibleStaffMember->first_name.' '.$objective->responsibleStaffMember->last_name),
                    'qualification_code' => $objective->responsibleStaffMember->qualification_code,
                    'qualification_name' => $objective->responsibleStaffMember->qualificationLookup?->name,
                ] : null,
            ])->values()->all(),
        ];
    }
}
