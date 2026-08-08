<?php

namespace App\Http\Requests\Minors;

class UpdateMinorPeiRequest extends StoreMinorPeiRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['title'][0] = 'sometimes';

        return $rules;
    }
}
