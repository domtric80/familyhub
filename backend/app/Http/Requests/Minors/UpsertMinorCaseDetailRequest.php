<?php

namespace App\Http\Requests\Minors;

use App\Models\Minor;
use App\Models\MinorDocument;
use App\Models\StaffMember;
use Illuminate\Foundation\Http\FormRequest;

class UpsertMinorCaseDetailRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $aliases = [
            'judicial_authority_id' => 'judicial_authority_document_issuer_id',
            'family_doctor_id' => 'general_practitioner_staff_member_id',
            'pediatrician_id' => 'pediatrician_staff_member_id',
            'asl_id' => 'health_authority_document_issuer_id',
            'vaccination_record_document_id' => 'vaccination_minor_document_id',
        ];

        $normalized = [];

        foreach ($aliases as $legacyField => $canonicalField) {
            if (! $this->filled($canonicalField) && $this->exists($legacyField)) {
                $normalized[$canonicalField] = $this->input($legacyField);
            }
        }

        if ($normalized !== []) {
            $this->merge($normalized);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entry_city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'origin_facility_id' => ['nullable', 'integer', 'exists:facilities,id'],
            'origin_structure_name' => ['nullable', 'string', 'max:150'],
            'placement_order_reference' => ['nullable', 'string', 'max:100'],
            'placement_order_minor_document_id' => ['nullable', 'integer', 'exists:minor_documents,id'],
            'judicial_authority_document_issuer_id' => ['nullable', 'integer', 'exists:document_issuers,id'],
            'proceeding_number' => ['nullable', 'string', 'max:100'],
            'next_hearing_at' => ['nullable', 'date'],
            'general_practitioner_staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'pediatrician_staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'health_authority_document_issuer_id' => ['nullable', 'integer', 'exists:document_issuers,id'],
            'vaccination_minor_document_id' => ['nullable', 'integer', 'exists:minor_documents,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $minor = $this->route('minor');

            if (! $minor instanceof Minor) {
                return;
            }

            foreach (['placement_order_minor_document_id', 'vaccination_minor_document_id'] as $field) {
                $documentId = $this->integer($field);

                if ($documentId > 0 && ! MinorDocument::query()->whereKey($documentId)->where('minor_id', $minor->id)->exists()) {
                    $validator->errors()->add($field, 'Il documento selezionato non appartiene a questo minore.');
                }
            }

            $doctorId = $this->integer('general_practitioner_staff_member_id');
            if ($doctorId > 0) {
                $doctor = StaffMember::query()->whereKey($doctorId)->first();

                if (! $doctor || $doctor->facility_id !== $minor->facility_id || ! in_array($doctor->qualification_code, ['MEDICO_BASE', 'PEDIATRA'], true)) {
                    $validator->errors()->add('general_practitioner_staff_member_id', 'Il medico di base selezionato non è valido per la struttura del minore.');
                }
            }

            $pediatricianId = $this->integer('pediatrician_staff_member_id');
            if ($pediatricianId > 0) {
                $pediatrician = StaffMember::query()->whereKey($pediatricianId)->first();

                if (! $pediatrician || $pediatrician->facility_id !== $minor->facility_id || $pediatrician->qualification_code !== 'PEDIATRA') {
                    $validator->errors()->add('pediatrician_staff_member_id', 'Il pediatra selezionato non è valido per la struttura del minore.');
                }
            }
        });
    }
}
