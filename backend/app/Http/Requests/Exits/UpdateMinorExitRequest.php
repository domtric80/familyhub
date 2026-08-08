<?php

namespace App\Http\Requests\Exits;

use App\Models\MinorExit;
use App\Models\MinorExitAccompanier;
use App\Models\MinorContact;
use App\Models\StaffMember;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateMinorExitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'exit_type_id' => ['required', 'integer', 'exists:exit_types,id'],
            'destination' => ['required', 'string', 'max:255'],
            'reason' => ['nullable', 'string'],
            'accompanied_by' => ['nullable', 'string', 'max:255'],
            'accompaniers' => ['nullable', 'array'],
            'accompaniers.*.person_type' => ['required_with:accompaniers', 'string', Rule::in(MinorExitAccompanier::personTypes())],
            'accompaniers.*.staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'accompaniers.*.minor_contact_id' => ['nullable', 'integer', 'exists:minor_contacts,id'],
            'accompaniers.*.external_name' => ['nullable', 'string', 'max:255'],
            'accompaniers.*.notes' => ['nullable', 'string'],
            'authorized_by_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'planned_exit_at' => ['required', 'date'],
            'expected_return_at' => ['nullable', 'date', 'after_or_equal:planned_exit_at'],
            'status' => ['required', 'string', Rule::in(MinorExit::statuses())],
            'return_condition' => ['nullable', 'string', Rule::in(config('exits.return_conditions', []))],
            'follow_up_required' => ['nullable', 'boolean'],
            'follow_up_notes' => ['nullable', 'string'],
            'outcome_notes' => ['nullable', 'string'],
            'cancellation_reason' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var MinorExit|null $exit */
            $exit = $this->route('exit');
            $minor = $exit?->minor;

            if (! $minor) {
                return;
            }

            if ($this->boolean('follow_up_required') && ! $this->filled('follow_up_notes')) {
                $validator->errors()->add('follow_up_notes', 'Le note follow-up sono obbligatorie quando il follow-up è richiesto.');
            }

            foreach ((array) $this->input('accompaniers', []) as $index => $accompanier) {
                $personType = data_get($accompanier, 'person_type');
                $staffMemberId = data_get($accompanier, 'staff_member_id');
                $minorContactId = data_get($accompanier, 'minor_contact_id');
                $externalName = trim((string) data_get($accompanier, 'external_name', ''));

                if ($personType === MinorExitAccompanier::TYPE_STAFF_MEMBER) {
                    $staffMember = $staffMemberId ? StaffMember::query()->find($staffMemberId) : null;
                    if (! $staffMember || (int) $staffMember->facility_id !== (int) $minor->facility_id) {
                        $validator->errors()->add("accompaniers.$index.staff_member_id", 'Lo staff member selezionato non appartiene alla stessa struttura del minore.');
                    }
                }

                if ($personType === MinorExitAccompanier::TYPE_MINOR_CONTACT) {
                    $minorContact = $minorContactId ? MinorContact::query()->find($minorContactId) : null;
                    if (! $minorContact || (int) $minorContact->minor_id !== (int) $minor->id) {
                        $validator->errors()->add("accompaniers.$index.minor_contact_id", 'Il contatto selezionato non appartiene al minore corrente.');
                    }
                }

                if ($personType === MinorExitAccompanier::TYPE_EXTERNAL && $externalName === '') {
                    $validator->errors()->add("accompaniers.$index.external_name", 'Se il tipo è external devi indicare il nome esterno.');
                }
            }
        });
    }
}
