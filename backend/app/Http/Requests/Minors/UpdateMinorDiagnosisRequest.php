<?php

namespace App\Http\Requests\Minors;

class UpdateMinorDiagnosisRequest extends StoreMinorDiagnosisRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['diagnosis_label'][0] = 'sometimes';

        return $rules;
    }
}
