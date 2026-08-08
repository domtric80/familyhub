<?php

namespace App\Http\Requests\Admin;

use App\Models\Minor;
use Illuminate\Foundation\Http\FormRequest;

class BulkSyncMinorUserAssignmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_ids' => ['required', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'valid_from' => ['required', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $minor = $this->route('minor');

            if (! $minor instanceof Minor) {
                return;
            }

            $userIds = collect($this->input('user_ids', []))
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();

            if ($userIds->isEmpty()) {
                return;
            }

            $invalidUserIds = \App\Models\User::query()
                ->whereIn('id', $userIds)
                ->whereDoesntHave('userFacilityRoles', function ($query) use ($minor): void {
                    $query
                        ->where('facility_id', $minor->facility_id)
                        ->where('is_active', true)
                        ->where(function ($dateQuery): void {
                            $dateQuery->whereNull('valid_to')->orWhereDate('valid_to', '>=', now()->toDateString());
                        });
                })
                ->pluck('id')
                ->all();

            if ($invalidUserIds !== []) {
                $validator->errors()->add('user_ids', 'Tutti gli utenti selezionati devono avere un ruolo attivo nella struttura del minore.');
            }
        });
    }
}
