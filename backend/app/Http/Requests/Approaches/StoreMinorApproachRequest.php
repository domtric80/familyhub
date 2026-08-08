<?php

namespace App\Http\Requests\Approaches;

use App\Models\Minor;
use App\Models\MinorApproach;
use App\Models\MinorDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMinorApproachRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $reactionLevels = array_keys(config('approaches.reaction_levels', []));

        return [
            'minor_id' => ['required', 'integer', 'exists:minors,id'],
            'approach_type_id' => ['required', 'integer', 'exists:approach_types,id'],
            'minor_contact_id' => ['nullable', 'integer', 'exists:minor_contacts,id'],
            'minor_contact_ids' => ['nullable', 'array'],
            'minor_contact_ids.*' => ['integer', 'distinct', 'exists:minor_contacts,id'],
            'participants' => ['nullable', 'array'],
            'participants.*.minor_contact_id' => ['required', 'integer', 'exists:minor_contacts,id'],
            'participants.*.contact_type_id' => ['nullable', 'integer', 'exists:contact_types,id'],
            'staff_participants' => ['nullable', 'array'],
            'staff_participants.*.staff_member_id' => ['required', 'integer', 'exists:staff_members,id'],
            'staff_participants.*.qualification_code' => ['nullable', 'string', 'max:50', 'exists:staff_qualifications,code'],
            'supervising_staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'title' => ['required', 'string', 'max:150'],
            'objective' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:150'],
            'authorization_reference' => ['nullable', 'string', 'max:100'],
            'authorization_minor_document_id' => ['nullable', 'integer', 'exists:minor_documents,id'],
            'authorization_issued_at' => ['nullable', 'date'],
            'authorization_expires_at' => ['nullable', 'date', 'after_or_equal:authorization_issued_at'],
            'authorization_renewal_alert_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'planned_start_at' => ['required', 'date'],
            'planned_end_at' => ['nullable', 'date', 'after_or_equal:planned_start_at'],
            'actual_start_at' => ['nullable', 'date'],
            'actual_end_at' => ['nullable', 'date', 'after_or_equal:actual_start_at'],
            'status' => ['nullable', Rule::in([
                MinorApproach::STATUS_PLANNED,
                MinorApproach::STATUS_IN_PROGRESS,
                MinorApproach::STATUS_COMPLETED,
                MinorApproach::STATUS_SUSPENDED,
                MinorApproach::STATUS_CANCELLED,
            ])],
            'pre_reaction_level' => ['nullable', Rule::in($reactionLevels)],
            'pre_reaction_notes' => ['nullable', 'string'],
            'during_reaction_level' => ['nullable', Rule::in($reactionLevels)],
            'during_reaction_notes' => ['nullable', 'string'],
            'post_reaction_level' => ['nullable', Rule::in($reactionLevels)],
            'post_reaction_notes' => ['nullable', 'string'],
            'outcome_notes' => ['nullable', 'string'],
            'next_steps' => ['nullable', 'string'],
            'reserved_psychologist_notes' => ['nullable', 'string'],
            'reserved_coordinator_notes' => ['nullable', 'string'],
            'suspension_reason' => ['nullable', 'string'],
            'suspended_at' => ['nullable', 'date'],
            'suspended_by_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'suspension_signed_at' => ['nullable', 'date', 'after_or_equal:suspended_at'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $minor = Minor::query()->find($this->integer('minor_id'));

            if (! $minor) {
                return;
            }

            $participants = collect($this->input('participants', []))
                ->map(function ($row): array {
                    return [
                        'minor_contact_id' => (int) ($row['minor_contact_id'] ?? 0),
                        'contact_type_id' => isset($row['contact_type_id']) ? (int) $row['contact_type_id'] : null,
                    ];
                })
                ->filter(fn (array $row) => $row['minor_contact_id'] > 0)
                ->values();

            foreach ($participants as $participant) {
                $contactId = $participant['minor_contact_id'];

                if (! $minor->contacts()->whereKey($contactId)->exists()) {
                    $validator->errors()->add('participants', 'Uno o più contatti selezionati non appartengono a questo minore.');
                    break;
                }
            }

            $staffMemberId = $this->integer('supervising_staff_member_id');

            if ($staffMemberId > 0 && ! $minor->facility->staffMembers()->whereKey($staffMemberId)->exists()) {
                $validator->errors()->add('supervising_staff_member_id', "L'operatore selezionato non appartiene alla struttura del minore.");
            }

            $staffParticipants = collect($this->input('staff_participants', []))
                ->map(fn ($row) => [
                    'staff_member_id' => (int) ($row['staff_member_id'] ?? 0),
                    'qualification_code' => isset($row['qualification_code']) ? (string) $row['qualification_code'] : null,
                ])
                ->filter(fn (array $row) => $row['staff_member_id'] > 0)
                ->values();

            foreach ($staffParticipants as $staffParticipant) {
                if (! $minor->facility->staffMembers()->whereKey($staffParticipant['staff_member_id'])->exists()) {
                    $validator->errors()->add('staff_participants', "Uno o più operatori selezionati non appartengono alla struttura del minore.");
                    break;
                }
            }

            $authorizationMinorDocumentId = $this->integer('authorization_minor_document_id');

            if ($authorizationMinorDocumentId > 0) {
                $documentBelongsToMinor = MinorDocument::query()
                    ->whereKey($authorizationMinorDocumentId)
                    ->where('minor_id', $minor->id)
                    ->exists();

                if (! $documentBelongsToMinor) {
                    $validator->errors()->add('authorization_minor_document_id', 'Il documento autorizzativo selezionato non appartiene a questo minore.');
                }
            }

            $status = (string) $this->input('status');

            if ($status === MinorApproach::STATUS_SUSPENDED && blank($this->input('suspension_reason'))) {
                $validator->errors()->add('suspension_reason', 'La motivazione della sospensione è obbligatoria quando lo stato è sospeso.');
            }

            if (filled($this->input('suspension_reason')) && blank($this->input('suspended_at'))) {
                $validator->errors()->add('suspended_at', 'La data/ora di sospensione è obbligatoria quando è presente una motivazione di sospensione.');
            }

            if ($this->filled('reserved_psychologist_notes') && ! $this->user()?->hasRoleIn(config('approaches.reserved_psychologist_roles', []))) {
                $validator->errors()->add('reserved_psychologist_notes', 'Non sei autorizzato a compilare note riservate psicologo.');
            }

            if ($this->filled('reserved_coordinator_notes') && ! $this->user()?->hasRoleIn(config('approaches.reserved_coordinator_roles', []))) {
                $validator->errors()->add('reserved_coordinator_notes', 'Non sei autorizzato a compilare note riservate coordinatore.');
            }

            $this->merge(['facility_id' => $minor->facility_id]);
        });
    }

    protected function prepareForValidation(): void
    {
        $participants = $this->normalizeParticipantsInput();

        if ($participants !== []) {
            $this->merge([
                'participants' => $participants,
                'minor_contact_ids' => collect($participants)->pluck('minor_contact_id')->values()->all(),
                'minor_contact_id' => $participants[0]['minor_contact_id'],
            ]);
        } elseif ($this->exists('minor_contact_ids') || $this->exists('participants')) {
            $this->merge([
                'participants' => [],
                'minor_contact_ids' => [],
                'minor_contact_id' => null,
            ]);
        }

        $this->merge([
            'staff_participants' => $this->normalizeStaffParticipantsInput(),
        ]);
    }

    private function normalizeParticipantsInput(): array
    {
        $participants = $this->input('participants');

        if (! is_array($participants)) {
            $participants = [];
        }

        $normalizedParticipants = collect($participants)
            ->map(function ($row): array {
                return [
                    'minor_contact_id' => (int) ($row['minor_contact_id'] ?? 0),
                    'contact_type_id' => isset($row['contact_type_id']) ? (int) $row['contact_type_id'] : null,
                ];
            })
            ->filter(fn (array $row) => $row['minor_contact_id'] > 0)
            ->values()
            ->all();

        $contactIds = $this->input('minor_contact_ids');

        if (! is_array($contactIds)) {
            $contactIds = [];
        }

        if ($this->filled('minor_contact_id')) {
            array_unshift($contactIds, (int) $this->input('minor_contact_id'));
        }

        foreach ($contactIds as $contactId) {
            $contactId = (int) $contactId;

            if ($contactId <= 0) {
                continue;
            }

            $alreadyPresent = collect($normalizedParticipants)->contains(fn (array $row) => $row['minor_contact_id'] === $contactId);

            if (! $alreadyPresent) {
                $normalizedParticipants[] = [
                    'minor_contact_id' => $contactId,
                    'contact_type_id' => null,
                ];
            }
        }

        return collect($normalizedParticipants)
            ->unique(fn (array $row) => (string) $row['minor_contact_id'])
            ->values()
            ->all();
    }

    private function normalizeStaffParticipantsInput(): array
    {
        $staffParticipants = $this->input('staff_participants');

        if (! is_array($staffParticipants)) {
            $staffParticipants = [];
        }

        $normalized = collect($staffParticipants)
            ->map(fn ($row) => [
                'staff_member_id' => (int) ($row['staff_member_id'] ?? 0),
                'qualification_code' => isset($row['qualification_code']) ? (string) $row['qualification_code'] : null,
            ])
            ->filter(fn (array $row) => $row['staff_member_id'] > 0)
            ->values()
            ->all();

        if ($this->filled('supervising_staff_member_id')) {
            $supervisingId = (int) $this->input('supervising_staff_member_id');
            $alreadyPresent = collect($normalized)->contains(fn (array $row) => $row['staff_member_id'] === $supervisingId);

            if ($supervisingId > 0 && ! $alreadyPresent) {
                $normalized[] = [
                    'staff_member_id' => $supervisingId,
                    'qualification_code' => null,
                ];
            }
        }

        return collect($normalized)
            ->unique(fn (array $row) => (string) $row['staff_member_id'])
            ->values()
            ->all();
    }
}
