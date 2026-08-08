<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class BulkSyncUserMinorAssignmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'minor_ids' => ['required', 'array'],
            'minor_ids.*' => ['integer', 'exists:minors,id'],
            'valid_from' => ['required', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->route('user');

            if (! $user instanceof User) {
                return;
            }

            $facilityId = $this->integer('facility_id');
            $minorIds = collect($this->input('minor_ids', []))
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();

            if ($minorIds->isEmpty()) {
                return;
            }

            $invalidMinorIds = \App\Models\Minor::query()
                ->whereIn('id', $minorIds)
                ->where('facility_id', '!=', $facilityId)
                ->pluck('id')
                ->all();

            if ($invalidMinorIds !== []) {
                $validator->errors()->add('minor_ids', 'Tutti i minori selezionati devono appartenere alla struttura scelta.');
            }

            $hasFacilityRole = $user->userFacilityRoles()
                ->where('facility_id', $facilityId)
                ->where('is_active', true)
                ->where(function ($query): void {
                    $query->whereNull('valid_to')->orWhereDate('valid_to', '>=', now()->toDateString());
                })
                ->exists();

            if (! $hasFacilityRole) {
                $validator->errors()->add('facility_id', 'L’utente non ha un ruolo attivo nella struttura selezionata.');
            }
        });
    }
}
