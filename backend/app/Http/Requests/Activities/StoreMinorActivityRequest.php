<?php

namespace App\Http\Requests\Activities;

use App\Models\Minor;
use App\Models\MinorPeiObjective;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMinorActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'minor_id' => ['required', 'integer', 'exists:minors,id'],
            'activity_type_id' => ['required', 'integer', 'exists:activity_types,id'],
            'responsible_staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:150'],
            'planned_start_at' => ['required', 'date'],
            'planned_end_at' => ['nullable', 'date', 'after_or_equal:planned_start_at'],
            'actual_start_at' => ['nullable', 'date'],
            'actual_end_at' => ['nullable', 'date', 'after_or_equal:actual_start_at'],
            'status' => ['nullable', 'in:planned,in_progress,completed,cancelled'],
            'attendance_status' => ['nullable', Rule::in(config('activities.attendance_statuses', []))],
            'support_level' => ['nullable', Rule::in(config('activities.support_levels', []))],
            'requires_transport' => ['nullable', 'boolean'],
            'materials_needed' => ['nullable', 'string'],
            'follow_up_required' => ['nullable', 'boolean'],
            'follow_up_notes' => ['nullable', 'string'],
            'pei_objective_id' => ['nullable', 'integer', 'exists:minor_pei_objectives,id'],
            'pei_objective_ref' => ['nullable', 'string', 'max:100'],
            'outcome_notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $minor = Minor::query()->with('facility')->find($this->integer('minor_id'));

            if (! $minor) {
                return;
            }

            $staffMemberId = $this->integer('responsible_staff_member_id');

            if ($staffMemberId > 0 && ! $minor->facility->staffMembers()->whereKey($staffMemberId)->exists()) {
                $validator->errors()->add('responsible_staff_member_id', "L'operatore responsabile non appartiene alla struttura del minore.");
            }

            if ($this->boolean('follow_up_required') && blank($this->input('follow_up_notes'))) {
                $validator->errors()->add('follow_up_notes', 'Le note follow-up sono obbligatorie quando il follow-up e richiesto.');
            }

            $peiObjectiveId = $this->integer('pei_objective_id');
            if ($peiObjectiveId > 0) {
                $objective = MinorPeiObjective::query()->with('pei')->find($peiObjectiveId);

                if (! $objective || ! $objective->pei || (int) $objective->pei->minor_id != (int) $minor->id) {
                    $validator->errors()->add('pei_objective_id', "L'obiettivo PEI selezionato non appartiene al minore indicato.");
                }
            }

            $this->merge(['facility_id' => $minor->facility_id]);
        });
    }
}
