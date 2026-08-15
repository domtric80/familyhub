<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SyncStaffProfessionalProfileRequest;
use App\Models\StaffLanguage;
use App\Models\StaffCertificationType;
use App\Models\StaffMember;
use App\Models\StaffProficiencyLevel;
use App\Models\StaffSkill;
use App\Models\StaffSpecialization;
use App\Services\AuditLogService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\HttpException;

class StaffProfessionalProfileController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService = new AuditLogService())
    {
    }

    public function indexLookup(string $lookup): JsonResponse
    {
        [$modelClass] = $this->lookupDefinition($lookup);

        return response()->json($modelClass::query()->orderBy('sort_order')->orderBy('name')->get());
    }

    public function storeLookup(Request $request, string $lookup): JsonResponse
    {
        [$modelClass, $label] = $this->lookupDefinition($lookup);
        $data = $this->validateLookup($request, $modelClass, defaults: [
            'is_active' => true,
            'sort_order' => 100,
        ]);
        $item = $modelClass::query()->create($data);
        $this->recordLookupAudit($request, 'create', $lookup, $label, $item);

        return response()->json($item, 201);
    }

    public function showLookup(string $lookup, int $item): JsonResponse
    {
        [$modelClass] = $this->lookupDefinition($lookup);

        return response()->json($modelClass::query()->findOrFail($item));
    }

    public function updateLookup(Request $request, string $lookup, int $item): JsonResponse
    {
        [$modelClass, $label] = $this->lookupDefinition($lookup);
        $record = $modelClass::query()->findOrFail($item);
        $before = $record->only(['code', 'name', 'description', 'is_active', 'sort_order']);
        abort_unless(! $request->has('code') || $request->input('code') === $record->code, 422, 'Il codice dell’anagrafica professionale non è modificabile.');

        $record->update($this->validateLookup($request, $modelClass, $record->id, [
            'is_active' => $record->is_active,
            'sort_order' => $record->sort_order,
        ], false));
        $this->recordLookupAudit($request, 'update', $lookup, $label, $record->fresh(), $before);

        return response()->json($record->fresh());
    }

    public function destroyLookup(Request $request, string $lookup, int $item): JsonResponse
    {
        [$modelClass, $label] = $this->lookupDefinition($lookup);
        $record = $modelClass::query()->findOrFail($item);

        if (
            (method_exists($record, 'staffMembers') && $record->staffMembers()->exists())
            || (method_exists($record, 'certifications') && $record->certifications()->exists())
            || (method_exists($record, 'facilityRequirements') && $record->facilityRequirements()->exists())
        ) {
            return response()->json([
                'message' => "Impossibile eliminare {$label}: esistono professionisti collegati.",
            ], 409);
        }

        $before = $record->only(['code', 'name', 'description', 'is_active', 'sort_order']);
        $record->delete();
        $this->recordLookupAudit($request, 'delete', $lookup, $label, $record, $before);

        return response()->json(status: 204);
    }

    public function showProfile(StaffMember $staffMember): JsonResponse
    {
        return response()->json($this->serializeProfile($staffMember));
    }

    public function syncProfile(SyncStaffProfessionalProfileRequest $request, StaffMember $staffMember): JsonResponse
    {
        $before = $this->profileAuditSnapshot($staffMember);
        $data = $request->validated();

        DB::transaction(function () use ($staffMember, $data): void {
            if (array_key_exists('skills', $data)) {
                $staffMember->skills()->sync($this->buildSyncPayload($data['skills'], ['proficiency_level_code', 'acquired_at', 'notes']));
            }

            if (array_key_exists('languages', $data)) {
                $staffMember->languages()->sync($this->buildSyncPayload($data['languages'], ['proficiency_level_code', 'notes']));
            }

            if (array_key_exists('specializations', $data)) {
                $staffMember->specializations()->sync($this->buildSyncPayload($data['specializations'], ['achieved_at', 'notes']));
            }
        });

        $profile = $this->serializeProfile($staffMember->fresh());
        $this->auditLogService->record($request, [
            'facility_id' => $staffMember->facility_id,
            'action' => 'update',
            'resource_type' => 'staff_member_professional_profile',
            'resource_id' => (string) $staffMember->id,
            'resource_label' => trim($staffMember->first_name.' '.$staffMember->last_name),
            'operation_summary' => sprintf(
                '%s ha aggiornato competenze, lingue e specializzazioni del professionista %s %s (%s).',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                $staffMember->first_name,
                $staffMember->last_name,
                $staffMember->employee_code,
            ),
            'old_values_json' => $before,
            'new_values_json' => $this->profileAuditSnapshot($staffMember->fresh()),
        ]);
        $this->auditLogService->markHandled($request);

        return response()->json($profile);
    }

    private function lookupDefinition(string $lookup): array
    {
        return match ($lookup) {
            'skills' => [StaffSkill::class, 'la competenza'],
            'languages' => [StaffLanguage::class, 'la lingua'],
            'specializations' => [StaffSpecialization::class, 'la specializzazione'],
            'proficiency-levels' => [StaffProficiencyLevel::class, 'il livello di padronanza'],
            'certification-types' => [StaffCertificationType::class, 'il tipo di certificazione'],
            default => throw new HttpException(404, 'Anagrafica professionale non disponibile.'),
        };
    }

    private function validateLookup(Request $request, string $modelClass, ?int $ignoreId = null, array $defaults = [], bool $requireCode = true): array
    {
        $table = (new $modelClass())->getTable();

        $data = Validator::make($request->all(), [
            'code' => [$requireCode ? 'required' : 'sometimes', 'string', 'max:50', Rule::unique($table, 'code')->ignore($ignoreId)],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ])->validate();

        $data['is_active'] = $request->has('is_active') ? $request->boolean('is_active') : ($defaults['is_active'] ?? true);
        $data['sort_order'] = $request->has('sort_order') ? $request->integer('sort_order') : ($defaults['sort_order'] ?? 100);

        return $data;
    }

    private function buildSyncPayload(array $items, array $pivotFields): array
    {
        return collect($items)->mapWithKeys(function (array $item) use ($pivotFields): array {
            $values = [];

            foreach ($pivotFields as $field) {
                $values[$field] = $item[$field] ?? null;
            }

            return [(int) $item['id'] => $values];
        })->all();
    }

    private function serializeProfile(StaffMember $staffMember): array
    {
        $staffMember->load(['skills', 'languages', 'specializations']);
        $levelNames = StaffProficiencyLevel::query()->pluck('name', 'code');

        return [
            'staff_member_id' => $staffMember->id,
            'skills' => $staffMember->skills->map(fn (StaffSkill $item) => [...$this->serializePivotItem($item, $levelNames, ['acquired_at', 'notes']), 'skill_id' => $item->id, 'skill' => $item->only(['id', 'code', 'name'])])->values(),
            'languages' => $staffMember->languages->map(fn (StaffLanguage $item) => [...$this->serializePivotItem($item, $levelNames, ['notes']), 'language_id' => $item->id, 'language' => $item->only(['id', 'code', 'name'])])->values(),
            'specializations' => $staffMember->specializations->map(fn (StaffSpecialization $item) => [...$this->serializePivotItem($item, $levelNames, ['achieved_at', 'notes']), 'specialization_id' => $item->id, 'specialization' => $item->only(['id', 'code', 'name'])])->values(),
        ];
    }

    private function serializePivotItem(Model $item, $levelNames, array $extraFields): array
    {
        $data = [
            'id' => $item->id,
            'code' => $item->code,
            'name' => $item->name,
        ];

        if (array_key_exists('proficiency_level_code', $item->pivot->getAttributes())) {
            $data['proficiency_level_code'] = $item->pivot->proficiency_level_code;
            $data['proficiency_level_label'] = $levelNames->get($item->pivot->proficiency_level_code);
        }

        foreach ($extraFields as $field) {
            $data[$field] = $item->pivot->{$field};
        }

        return $data;
    }

    private function profileAuditSnapshot(StaffMember $staffMember): array
    {
        return $this->serializeProfile($staffMember);
    }

    private function recordLookupAudit(Request $request, string $action, string $lookup, string $label, Model $item, ?array $oldValues = null): void
    {
        $this->auditLogService->record($request, [
            'action' => $action,
            'resource_type' => 'staff_profile_lookup_'.$lookup,
            'resource_id' => (string) $item->id,
            'resource_label' => $item->name,
            'operation_summary' => sprintf(
                '%s ha %s %s "%s".',
                $this->auditLogService->resolveActorDisplayName($request->user()),
                match ($action) {
                    'create' => 'creato',
                    'update' => 'modificato',
                    default => 'eliminato',
                },
                $label,
                $item->name,
            ),
            'old_values_json' => $oldValues,
            'new_values_json' => $action === 'delete' ? null : $item->only(['code', 'name', 'description', 'is_active', 'sort_order']),
        ]);
        $this->auditLogService->markHandled($request);
    }
}
