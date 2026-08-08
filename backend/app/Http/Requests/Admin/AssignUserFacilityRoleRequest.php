<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AssignUserFacilityRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'valid_from' => ['required', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'is_active' => ['sometimes', 'boolean'],
            'assigned_by_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $assignment = $this->route('assignment');
            $assignmentId = $assignment?->id;

            $userId = (int) $this->input('user_id');
            $facilityId = (int) $this->input('facility_id');
            $roleId = (int) $this->input('role_id');
            $validFrom = $this->input('valid_from');
            $validTo = $this->input('valid_to');

            if (! $userId || ! $facilityId || ! $roleId || ! $validFrom) {
                return;
            }

            $isActive = $this->has('is_active')
                ? $this->boolean('is_active')
                : ($assignment?->is_active ?? true);

            if ($isActive) {
                $hasAnotherActiveAssignment = \App\Models\UserFacilityRole::query()
                    ->when($assignmentId, fn ($query) => $query->whereKeyNot($assignmentId))
                    ->where('user_id', $userId)
                    ->where('facility_id', $facilityId)
                    ->where('is_active', true)
                    ->exists();

                if ($hasAnotherActiveAssignment) {
                    $validator->errors()->add(
                        'facility_id',
                        'Esiste già un ruolo attivo per questo utente nella struttura selezionata. Revoca o aggiorna quello esistente invece di crearne un secondo.'
                    );
                }
            }

            $hasOverlap = \App\Models\UserFacilityRole::query()
                ->when($assignmentId, fn ($query) => $query->whereKeyNot($assignmentId))
                ->where('user_id', $userId)
                ->where('facility_id', $facilityId)
                ->where('role_id', $roleId)
                ->where(function ($query) use ($validFrom, $validTo) {
                    $query
                        ->where(function ($inner) use ($validFrom, $validTo) {
                            $inner
                                ->where('valid_from', '<=', $validTo ?: '9999-12-31 23:59:59')
                                ->where(function ($window) use ($validFrom) {
                                    $window
                                        ->whereNull('valid_to')
                                        ->orWhere('valid_to', '>=', $validFrom);
                                });
                        });
                })
                ->exists();

            if ($hasOverlap) {
                $validator->errors()->add(
                    'role_id',
                    'Esiste già un’assegnazione sovrapposta per utente, struttura e ruolo nel periodo selezionato.'
                );
            }
        });
    }
}
