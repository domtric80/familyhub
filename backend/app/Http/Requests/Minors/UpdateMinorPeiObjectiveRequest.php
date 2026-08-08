<?php

namespace App\Http\Requests\Minors;

class UpdateMinorPeiObjectiveRequest extends StoreMinorPeiObjectiveRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['title'][0] = 'sometimes';

        return $rules;
    }
}
