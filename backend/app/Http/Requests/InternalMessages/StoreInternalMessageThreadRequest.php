<?php

namespace App\Http\Requests\InternalMessages;

use App\Models\Facility;
use App\Models\Minor;
use App\Models\MinorUserAssignment;
use App\Models\User;
use App\Services\InternalMessageAccessService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInternalMessageThreadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'minor_id' => ['nullable', 'integer', 'exists:minors,id'],
            'thread_type' => ['required', 'string', Rule::in(config('internal_messages.thread_types', []))],
            'subject' => ['required', 'string', 'max:150'],
            'topic' => ['nullable', 'string'],
            'classification_code' => ['nullable', 'string', 'exists:document_classifications,code'],
            'participant_user_ids' => ['required', 'array', 'min:1'],
            'participant_user_ids.*' => ['integer', 'exists:users,id'],
            'message_body' => ['required', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $facilityId = $this->integer('facility_id');
            $minorId = $this->integer('minor_id');
            $threadType = (string) $this->input('thread_type');
            $classificationCode = (string) ($this->input('classification_code') ?: 'internal');
            $minor = null;

            $facility = Facility::query()->find($facilityId);
            if (! $facility) {
                return;
            }

            if ($threadType === 'minor') {
                if (! $minorId) {
                    $validator->errors()->add('minor_id', 'Il minore è obbligatorio per un thread legato al minore.');
                } else {
                    $minor = Minor::query()->find($minorId);
                    if (! $minor || (int) $minor->facility_id !== $facilityId) {
                        $validator->errors()->add('minor_id', 'Il minore selezionato non appartiene alla struttura indicata.');
                    }
                }
            }

            if ($threadType === 'facility' && $minorId) {
                $validator->errors()->add('minor_id', 'Un thread di struttura non deve avere un minore associato.');
            }

            if (! app(InternalMessageAccessService::class)->canUseClassification($this->user(), $classificationCode, $facilityId, $minor)) {
                $validator->errors()->add('classification_code', 'La classificazione selezionata non è consentita per il tuo profilo o per il contesto scelto.');
            }

            $participantIds = collect((array) $this->input('participant_user_ids', []))
                ->push($this->user()?->id)
                ->filter()
                ->unique()
                ->values();

            $eligibleUserIds = User::query()
                ->whereIn('id', $participantIds)
                ->whereHas('userFacilityRoles', fn ($query) => $query
                    ->where('facility_id', $facilityId)
                    ->where('is_active', true)
                    ->where(function ($dateQuery): void {
                        $dateQuery->whereNull('valid_to')->orWhere('valid_to', '>=', now());
                    }))
                ->pluck('id')
                ->all();

            if (count($eligibleUserIds) !== $participantIds->count()) {
                $validator->errors()->add('participant_user_ids', 'Uno o più partecipanti non appartengono alla struttura selezionata.');
            }

            if ($threadType === 'minor' && $minorId) {
                $minorEligibleUserIds = MinorUserAssignment::query()
                    ->where('minor_id', $minorId)
                    ->where('facility_id', $facilityId)
                    ->whereIn('user_id', $participantIds)
                    ->where('is_active', true)
                    ->whereDate('valid_from', '<=', now()->toDateString())
                    ->where(function ($query): void {
                        $query->whereNull('valid_to')
                            ->orWhereDate('valid_to', '>=', now()->toDateString());
                    })
                    ->pluck('user_id')
                    ->all();

                if ($this->user()?->id) {
                    $minorEligibleUserIds[] = $this->user()?->id;
                }

                if (count(array_unique($minorEligibleUserIds)) !== $participantIds->count()) {
                    $validator->errors()->add('participant_user_ids', 'Uno o più partecipanti non hanno accesso attivo al minore selezionato.');
                }
            }

            $classificationEligibleIds = $participantIds
                ->filter(function ($participantId) use ($classificationCode, $facilityId, $minor): bool {
                    $candidate = User::query()->find($participantId);

                    return $candidate
                        ? app(InternalMessageAccessService::class)->canUseClassification($candidate, $classificationCode, $facilityId, $minor)
                        : false;
                })
                ->values()
                ->all();

            if (count($classificationEligibleIds) !== $participantIds->count()) {
                $validator->errors()->add('participant_user_ids', 'Uno o più partecipanti non sono autorizzati alla classificazione selezionata.');
            }
        });
    }
}
