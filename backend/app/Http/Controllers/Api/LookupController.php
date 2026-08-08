<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityType;
use App\Models\ApproachType;
use App\Models\BiologicalSex;
use App\Models\City;
use App\Models\ContactType;
use App\Models\DocumentClassification;
use App\Models\DocumentScope;
use App\Models\DocumentIssuer;
use App\Models\Country;
use App\Models\DocumentType;
use App\Models\ExitType;
use App\Models\FacilityStatus;
use App\Models\GenderIdentity;
use App\Models\JournalEntryType;
use App\Models\MinorStatus;
use App\Models\Role;
use App\Models\StaffQualification;
use App\Models\StaffDocumentStatus;
use App\Models\StaffStatus;
use Illuminate\Http\JsonResponse;

class LookupController extends Controller
{
    public function geography(): JsonResponse
    {
        return response()->json(
            Country::query()
                ->with('regions.provinces.cities')
                ->orderBy('name')
                ->get()
        );
    }

    public function roles(): JsonResponse
    {
        return response()->json(Role::query()->orderBy('name')->get());
    }

    public function documentTypes(): JsonResponse
    {
        return response()->json(
            DocumentType::query()
                ->with('documentScope')
                ->orderBy('scope')
                ->orderBy('name')
                ->get()
                ->each->makeHidden('scope')
        );
    }

    public function documentClassifications(): JsonResponse
    {
        $items = DocumentClassification::query()->where('is_active', true)->orderBy('name')->get();

        if ($items->isNotEmpty()) {
            return response()->json($items->map(fn (DocumentClassification $classification): array => [
                'code' => $classification->code,
                'name' => $classification->name,
                'description' => $classification->description,
                'allowed_roles' => $classification->allowed_role_codes ?? [],
            ]));
        }

        return response()->json(config('document_classifications', []));
    }

    public function documentScopes(): JsonResponse
    {
        return response()->json(DocumentScope::query()->where('is_active', true)->orderBy('name')->get());
    }

    public function documentIssuers(): JsonResponse
    {
        return response()->json(
            DocumentIssuer::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function contactTypes(): JsonResponse
    {
        return response()->json(ContactType::query()->orderBy('name')->get());
    }

    public function staffQualifications(): JsonResponse
    {
        return response()->json(
            StaffQualification::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function staffStatuses(): JsonResponse
    {
        return response()->json(
            StaffStatus::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function facilityStatuses(): JsonResponse
    {
        return response()->json(
            FacilityStatus::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function staffDocumentStatuses(): JsonResponse
    {
        return response()->json(
            StaffDocumentStatus::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function minorStatuses(): JsonResponse
    {
        return response()->json(MinorStatus::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get());
    }

    public function biologicalSexes(): JsonResponse
    {
        return response()->json(BiologicalSex::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get());
    }

    public function exitTypes(): JsonResponse
    {
        return response()->json(ExitType::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get());
    }

    public function activityTypes(): JsonResponse
    {
        return response()->json(ActivityType::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get());
    }

    public function approachTypes(): JsonResponse
    {
        return response()->json(ApproachType::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get());
    }

    public function journalEntryTypes(): JsonResponse
    {
        return response()->json(JournalEntryType::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get());
    }

    public function genderIdentities(): JsonResponse
    {
        return response()->json(GenderIdentity::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get());
    }

    public function cities(): JsonResponse
    {
        return response()->json(
            City::query()
                ->with('province.region.country')
                ->when(
                    request()->filled('province_id'),
                    fn ($query) => $query->where('province_id', request()->integer('province_id'))
                )
                ->orderBy('name')
                ->get()
        );
    }
}
