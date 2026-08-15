<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncStaffProfessionalProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $activeLevel = Rule::exists('staff_proficiency_levels', 'code')->where('is_active', true);

        return [
            'skills' => ['sometimes', 'array'],
            'skills.*.id' => ['required', 'integer', 'distinct', 'exists:staff_skills,id'],
            'skills.*.proficiency_level_code' => ['nullable', 'string', 'max:50', $activeLevel],
            'skills.*.acquired_at' => ['nullable', 'date'],
            'skills.*.notes' => ['nullable', 'string', 'max:2000'],
            'languages' => ['sometimes', 'array'],
            'languages.*.id' => ['required', 'integer', 'distinct', 'exists:staff_languages,id'],
            'languages.*.proficiency_level_code' => ['nullable', 'string', 'max:50', $activeLevel],
            'languages.*.notes' => ['nullable', 'string', 'max:2000'],
            'specializations' => ['sometimes', 'array'],
            'specializations.*.id' => ['required', 'integer', 'distinct', 'exists:staff_specializations,id'],
            'specializations.*.achieved_at' => ['nullable', 'date'],
            'specializations.*.notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $map = [
            'skills' => 'skill_id',
            'languages' => 'language_id',
            'specializations' => 'specialization_id',
        ];

        foreach ($map as $group => $legacyId) {
            if (! is_array($this->input($group))) {
                continue;
            }

            $this->merge([
                $group => collect($this->input($group))->map(function (array $item) use ($legacyId): array {
                    if (! array_key_exists('id', $item) && array_key_exists($legacyId, $item)) {
                        $item['id'] = $item[$legacyId];
                    }

                    return $item;
                })->all(),
            ]);
        }
    }
}
