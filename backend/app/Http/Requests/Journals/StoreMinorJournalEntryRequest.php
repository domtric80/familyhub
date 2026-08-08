<?php

namespace App\Http\Requests\Journals;

use App\Models\Minor;
use App\Models\MinorPeiObjective;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMinorJournalEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'minor_id' => ['required', 'integer', 'exists:minors,id'],
            'journal_entry_type_id' => ['required', 'integer', 'exists:journal_entry_types,id'],
            'observed_at' => ['required', 'date'],
            'title' => ['required', 'string', 'max:150'],
            'content' => ['required', 'string'],
            'priority_level' => ['nullable', Rule::in(config('journals.priority_levels', []))],
            'mood_level' => ['nullable', Rule::in(array_keys(config('journals.mood_levels', [])))],
            'nutrition_summary' => ['nullable', 'string'],
            'hygiene_summary' => ['nullable', 'string'],
            'sleep_summary' => ['nullable', 'string'],
            'follow_up_required' => ['nullable', 'boolean'],
            'follow_up_notes' => ['nullable', 'string'],
            'pei_objective_id' => ['nullable', 'integer', 'exists:minor_pei_objectives,id'],
            'handover_required' => ['nullable', 'boolean'],
            'handover_notes' => ['nullable', 'string'],
            'handover_read_at' => ['nullable', 'date'],
            'handover_read_by_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $minor = Minor::query()->find($this->integer('minor_id'));

            if ($this->boolean('follow_up_required') && blank($this->input('follow_up_notes'))) {
                $validator->errors()->add('follow_up_notes', 'Le note follow-up sono obbligatorie quando il follow-up e richiesto.');
            }

            if ($this->boolean('handover_required') && blank($this->input('handover_notes'))) {
                $validator->errors()->add('handover_notes', 'Le note di passaggio consegne sono obbligatorie quando la presa visione e richiesta.');
            }

            if ($this->filled('handover_read_at') && ! $this->filled('handover_read_by_user_id')) {
                $validator->errors()->add('handover_read_by_user_id', "L'utente di presa visione e obbligatorio se la presa visione e registrata.");
            }

            $peiObjectiveId = $this->integer('pei_objective_id');
            if ($minor && $peiObjectiveId > 0) {
                $objective = MinorPeiObjective::query()->with('pei')->find($peiObjectiveId);

                if (! $objective || ! $objective->pei || (int) $objective->pei->minor_id != (int) $minor->id) {
                    $validator->errors()->add('pei_objective_id', "L'obiettivo PEI selezionato non appartiene al minore indicato.");
                }
            }
        });
    }
}
