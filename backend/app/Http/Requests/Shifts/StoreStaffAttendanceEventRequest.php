<?php

namespace App\Http\Requests\Shifts;

use App\Models\StaffAttendanceEvent;
use App\Models\StaffMember;
use App\Models\StaffShiftAssignment;
use App\Models\StaffShiftSubstitution;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffAttendanceEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'shift_assignment_id' => ['nullable', 'integer', 'exists:staff_shift_assignments,id'],
            'event_type' => ['required', Rule::in([
                StaffAttendanceEvent::TYPE_CLOCK_IN,
                StaffAttendanceEvent::TYPE_CLOCK_OUT,
                StaffAttendanceEvent::TYPE_BREAK_START,
                StaffAttendanceEvent::TYPE_BREAK_END,
                StaffAttendanceEvent::TYPE_MANUAL_ADJUSTMENT,
            ])],
            'occurred_at' => ['required', 'date'],
            'source_type' => ['nullable', Rule::in(['web', 'mobile', 'manual', 'system'])],
            'geo_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'geo_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'geo_accuracy_meters' => ['nullable', 'integer', 'min:0'],
            'device_fingerprint' => ['nullable', 'string', 'max:191'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->user();
            $facilityId = $this->integer('facility_id');
            $staffMember = StaffMember::query()->where('user_id', $user?->id)->first();

            if (! $staffMember) {
                $validator->errors()->add('facility_id', 'Nessun operatore collegato all utente autenticato.');

                return;
            }

            if ((int) $staffMember->facility_id !== $facilityId) {
                $validator->errors()->add('facility_id', 'La struttura selezionata non corrisponde all operatore autenticato.');
            }

            $assignmentId = $this->integer('shift_assignment_id');
            if ($assignmentId > 0) {
                $assignment = StaffShiftAssignment::query()->find($assignmentId);

                if ($assignment && (int) $assignment->facility_id !== $facilityId) {
                    $validator->errors()->add('shift_assignment_id', 'Il turno selezionato appartiene a una struttura diversa.');
                }

                if ($assignment) {
                    $activeSubstitution = $assignment->activeSubstitution()->first();
                    $matchesOriginalAssignment = (int) $assignment->staff_member_id === (int) $staffMember->id && ! $activeSubstitution;
                    $matchesReplacementAssignment = $activeSubstitution
                        && $activeSubstitution->status === StaffShiftSubstitution::STATUS_ACTIVE
                        && (int) $activeSubstitution->replacement_staff_member_id === (int) $staffMember->id;

                    if (! $matchesOriginalAssignment && ! $matchesReplacementAssignment) {
                        $validator->errors()->add('shift_assignment_id', 'Il turno selezionato non appartiene all operatore autenticato o è già assegnato a un sostituto diverso.');
                    }
                }
            }
        });
    }
}
