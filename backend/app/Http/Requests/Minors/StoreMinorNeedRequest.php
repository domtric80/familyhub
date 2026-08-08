<?php

namespace App\Http\Requests\Minors;

use App\Models\MinorDocument;
use App\Models\StaffMember;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMinorNeedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $minor = $this->route('minor');
        $facilityId = $minor?->facility_id;
        $minorId = $minor?->id;

        return [
            'category_code' => ['required', 'string', Rule::in(['physical', 'emotional', 'cognitive', 'relational', 'spiritual'])],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['sometimes', 'string', Rule::in(['high', 'medium', 'low'])],
            'status' => ['sometimes', 'string', Rule::in(['open', 'in_progress', 'satisfied'])],
            'responsible_staff_member_id' => [
                'nullable',
                'integer',
                Rule::exists(StaffMember::class, 'id')->where(fn ($query) => $facilityId ? $query->where('facility_id', $facilityId) : $query),
            ],
            'attachment_minor_document_id' => [
                'nullable',
                'integer',
                Rule::exists(MinorDocument::class, 'id')->where(fn ($query) => $minorId ? $query->where('minor_id', $minorId) : $query),
            ],
        ];
    }
}
