<?php

namespace App\Http\Requests\Shifts;

use App\Models\StaffMember;
use App\Models\StaffShiftAssignment;
use App\Models\StaffShiftSubstitution;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffShiftSubstitutionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'replacement_staff_member_id' => ['required', 'integer', 'exists:staff_members,id'],
            'reason_code' => ['required', Rule::in(['illness', 'vacation', 'leave', 'emergency', 'coverage'])],
            'reason_notes' => ['nullable', 'string'],
            'effective_starts_at' => ['nullable', 'date'],
            'effective_ends_at' => ['nullable', 'date', 'after_or_equal:effective_starts_at'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            /** @var StaffShiftAssignment|null $assignment */
            $assignment = $this->route('shift_assignment');

            if (! $assignment instanceof StaffShiftAssignment) {
                return;
            }

            $replacementStaffMember = StaffMember::query()->find($this->integer('replacement_staff_member_id'));
            if (! $replacementStaffMember) {
                return;
            }

            if ((int) $replacementStaffMember->facility_id !== (int) $assignment->facility_id) {
                $validator->errors()->add('replacement_staff_member_id', 'Il sostituto appartiene a una struttura diversa.');
            }

            if ((int) $replacementStaffMember->id === (int) $assignment->staff_member_id) {
                $validator->errors()->add('replacement_staff_member_id', 'Il sostituto non può coincidere con l operatore già assegnato al turno.');
            }

            $hasActiveSubstitution = StaffShiftSubstitution::query()
                ->where('shift_assignment_id', $assignment->id)
                ->where('status', StaffShiftSubstitution::STATUS_ACTIVE)
                ->exists();

            if ($hasActiveSubstitution) {
                $validator->errors()->add('replacement_staff_member_id', 'Esiste già una sostituzione attiva per questo turno.');
            }

            $overlappingAssignments = StaffShiftAssignment::query()
                ->where('facility_id', $assignment->facility_id)
                ->where('id', '!=', $assignment->id)
                ->where(function ($query) use ($replacementStaffMember): void {
                    $query
                        ->where(function ($staffQuery) use ($replacementStaffMember): void {
                            $staffQuery
                                ->where('staff_member_id', $replacementStaffMember->id)
                                ->whereDoesntHave('activeSubstitution');
                        })
                        ->orWhereHas('substitutions', function ($substitutionQuery) use ($replacementStaffMember): void {
                            $substitutionQuery
                                ->where('status', StaffShiftSubstitution::STATUS_ACTIVE)
                                ->where('replacement_staff_member_id', $replacementStaffMember->id);
                        });
                })
                ->where(function ($query) use ($assignment): void {
                    $query
                        ->whereBetween('starts_at', [$assignment->starts_at, $assignment->ends_at])
                        ->orWhereBetween('ends_at', [$assignment->starts_at, $assignment->ends_at])
                        ->orWhere(function ($coverQuery) use ($assignment): void {
                            $coverQuery
                                ->where('starts_at', '<=', $assignment->starts_at)
                                ->where('ends_at', '>=', $assignment->ends_at);
                        });
                })
                ->exists();

            if ($overlappingAssignments) {
                $validator->errors()->add('replacement_staff_member_id', 'Il sostituto ha già un turno sovrapposto nella stessa finestra oraria.');
            }
        });
    }
}
