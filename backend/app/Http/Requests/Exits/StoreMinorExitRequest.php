<?php

namespace App\Http\Requests\Exits;

use App\Models\Minor;
use App\Models\MinorExitAccompanier;
use App\Models\MinorContact;
use App\Models\StaffMember;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Illuminate\Validation\Rule;

class StoreMinorExitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'minor_id' => ['required', 'integer', 'exists:minors,id'],
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
            'return_condition' => ['nullable', 'string', Rule::in(config('exits.return_conditions', []))],
            'follow_up_required' => ['nullable', 'boolean'],
            'follow_up_notes' => ['nullable', 'string'],
            'outcome_notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->filled('minor_id') || ! $this->filled('facility_id')) {
                return;
            }

            $minor = Minor::query()->find($this->integer('minor_id'));

            if (! $minor) {
                return;
            }

            if ($this->boolean('follow_up_required') && ! $this->filled('follow_up_notes')) {
                $validator->errors()->add('follow_up_notes', 'Le note follow-up sono obbligatorie quando il follow-up è richiesto.');
            }

            if ((int) $minor->facility_id !== $this->integer('facility_id')) {
                $validator->errors()->add('facility_id', 'La struttura selezionata non coincide con la struttura del minore.');
            }

            foreach ((array) $this->input('accompaniers', []) as $index => $accompanier) {
                $personType = data_get($accompanier, 'person_type');
                $staffMemberId = data_get($accompanier, 'staff_member_id');
                $minorContactId = data_get($accompanier, 'minor_contact_id');
                $externalName = trim((string) data_get($accompanier, 'external_name', ''));

                if ($personType === MinorExitAccompanier::TYPE_STAFF_MEMBER) {
                    if (! $staffMemberId) {
                        $validator->errors()->add("accompaniers.$index.staff_member_id", 'Se il tipo è staff_member devi selezionare uno staff member.');
                        continue;
                    }

                    $staffMember = StaffMember::query()->find($staffMemberId);
                    if (! $staffMember || (int) $staffMember->facility_id !== (int) $minor->facility_id) {
                        $validator->errors()->add("accompaniers.$index.staff_member_id", 'Lo staff member selezionato non appartiene alla stessa struttura del minore.');
                    }
                }

                if ($personType === MinorExitAccompanier::TYPE_MINOR_CONTACT) {
                    if (! $minorContactId) {
                        $validator->errors()->add("accompaniers.$index.minor_contact_id", 'Se il tipo è minor_contact devi selezionare un contatto del minore.');
                        continue;
                    }

                    $minorContact = MinorContact::query()->find($minorContactId);
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
