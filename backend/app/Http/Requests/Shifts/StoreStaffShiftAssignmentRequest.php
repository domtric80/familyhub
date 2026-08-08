<?php

namespace App\Http\Requests\Shifts;

use App\Models\StaffMember;
use App\Models\StaffShiftAssignment;
use App\Models\StaffShiftTemplate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffShiftAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'shift_template_id' => ['required', 'integer', 'exists:staff_shift_templates,id'],
            'staff_member_id' => ['required', 'integer', 'exists:staff_members,id'],
            'shift_date' => ['required', 'date'],
            'status' => ['nullable', Rule::in(['planned', 'confirmed', 'completed', 'cancelled'])],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $facilityId = $this->integer('facility_id');
            $template = StaffShiftTemplate::query()->find($this->integer('shift_template_id'));
            $staffMember = StaffMember::query()->find($this->integer('staff_member_id'));

            if ($template && (int) $template->facility_id !== $facilityId) {
                $validator->errors()->add('shift_template_id', 'Il turno selezionato appartiene a una struttura diversa.');
            }

            if ($staffMember && (int) $staffMember->facility_id !== $facilityId) {
                $validator->errors()->add('staff_member_id', 'L operatore selezionato appartiene a una struttura diversa.');
            }

            if (! $template || ! $staffMember || ! $this->filled('shift_date')) {
                return;
            }

            [$startsAt, $endsAt] = ShiftAssignmentWindow::fromTemplate($template, (string) $this->input('shift_date'));
            $assignmentId = $this->route('shift_assignment')?->id;

            $overlapExists = StaffShiftAssignment::query()
                ->when($assignmentId, fn ($query) => $query->whereKeyNot($assignmentId))
                ->where('staff_member_id', $staffMember->id)
                ->where('status', '!=', 'cancelled')
                ->where(function ($query) use ($startsAt, $endsAt): void {
                    $query
                        ->where('starts_at', '<', $endsAt)
                        ->where('ends_at', '>', $startsAt);
                })
                ->exists();

            if ($overlapExists) {
                $validator->errors()->add('staff_member_id', 'L operatore ha gia un turno sovrapposto nella fascia selezionata.');
            }
        });
    }
}
