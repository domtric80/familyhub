<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkSyncMinorUserAssignmentsRequest;
use App\Http\Requests\Admin\BulkSyncUserMinorAssignmentsRequest;
use App\Http\Requests\Admin\StoreMinorUserAssignmentRequest;
use App\Models\Minor;
use App\Models\MinorUserAssignment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MinorUserAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MinorUserAssignment::query()
            ->with([
                'minor.minorStatus',
                'facility.organization',
                'user.userFacilityRoles.role',
                'assignedBy:id,first_name,last_name,email',
            ])
            ->orderByDesc('valid_from')
            ->orderByDesc('id');

        foreach (['facility_id', 'minor_id', 'user_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return response()->json($query->get());
    }

    public function store(StoreMinorUserAssignmentRequest $request): JsonResponse
    {
        $assignment = MinorUserAssignment::query()->updateOrCreate(
            [
                'minor_id' => $request->integer('minor_id'),
                'user_id' => $request->integer('user_id'),
                'facility_id' => $request->integer('facility_id'),
                'valid_from' => $request->input('valid_from'),
            ],
            [
                'valid_to' => $request->input('valid_to'),
                'is_active' => $request->boolean('is_active', true),
                'assigned_by_user_id' => $request->user()?->id,
                'notes' => $request->input('notes'),
            ]
        );

        return response()->json($this->loadAssignment($assignment), 201);
    }

    public function show(MinorUserAssignment $minorAssignment): JsonResponse
    {
        return response()->json($this->loadAssignment($minorAssignment));
    }

    public function assignedUsers(Minor $minor): JsonResponse
    {
        $assignments = MinorUserAssignment::query()
            ->with([
                'user.userFacilityRoles.role',
                'facility.organization',
                'assignedBy:id,first_name,last_name,email',
            ])
            ->where('minor_id', $minor->id)
            ->orderByDesc('is_active')
            ->orderByDesc('valid_from')
            ->get();

        return response()->json([
            'minor' => $minor->load('minorStatus', 'facility.organization'),
            'assignments' => $assignments,
        ]);
    }

    public function update(StoreMinorUserAssignmentRequest $request, MinorUserAssignment $minorAssignment): JsonResponse
    {
        $minorAssignment->update([
            'minor_id' => $request->integer('minor_id'),
            'user_id' => $request->integer('user_id'),
            'facility_id' => $request->integer('facility_id'),
            'valid_from' => $request->input('valid_from'),
            'valid_to' => $request->input('valid_to'),
            'notes' => $request->input('notes'),
            'is_active' => $request->boolean('is_active', $minorAssignment->is_active),
        ]);

        return response()->json($this->loadAssignment($minorAssignment->fresh()));
    }

    public function revoke(Request $request, MinorUserAssignment $minorAssignment): JsonResponse
    {
        if (! $minorAssignment->is_active) {
            return response()->json([
                'message' => 'Assegnazione minore già revocata.',
                'assignment' => $this->loadAssignment($minorAssignment),
            ]);
        }

        $validTo = $request->input('valid_to') ?: now()->toDateString();

        if ($validTo < $minorAssignment->valid_from->toDateString()) {
            return response()->json([
                'message' => 'La data di revoca non può precedere la data di inizio.',
            ], 422);
        }

        $minorAssignment->forceFill([
            'valid_to' => $validTo,
            'is_active' => false,
        ])->save();

        return response()->json([
            'message' => 'Assegnazione minore revocata.',
            'assignment' => $this->loadAssignment($minorAssignment->fresh()),
        ]);
    }

    public function bulkSyncForUser(BulkSyncUserMinorAssignmentsRequest $request, User $user): JsonResponse
    {
        $facilityId = $request->integer('facility_id');
        $minorIds = collect($request->input('minor_ids', []))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();
        $validFrom = $request->input('valid_from');
        $validTo = $request->input('valid_to');
        $notes = $request->input('notes');
        $isActive = $request->boolean('is_active', true);

        $result = DB::transaction(function () use ($user, $facilityId, $minorIds, $validFrom, $validTo, $notes, $isActive, $request): array {
            $currentAssignments = MinorUserAssignment::query()
                ->where('user_id', $user->id)
                ->where('facility_id', $facilityId)
                ->where('is_active', true)
                ->get()
                ->keyBy('minor_id');

            $createdOrUpdated = [];

            foreach ($minorIds as $minorId) {
                $assignment = MinorUserAssignment::query()->updateOrCreate(
                    [
                        'minor_id' => $minorId,
                        'user_id' => $user->id,
                        'facility_id' => $facilityId,
                    ],
                    [
                        'valid_from' => $validFrom,
                        'valid_to' => $validTo,
                        'is_active' => $isActive,
                        'assigned_by_user_id' => $request->user()?->id,
                        'notes' => $notes,
                    ]
                );

                $createdOrUpdated[] = $this->loadAssignment($assignment);
                $currentAssignments->forget($minorId);
            }

            foreach ($currentAssignments as $assignment) {
                $assignment->forceFill([
                    'valid_to' => $validTo ?: now()->toDateString(),
                    'is_active' => false,
                ])->save();
            }

            return [
                'synced_minor_ids' => $minorIds->all(),
                'revoked_assignment_ids' => $currentAssignments->pluck('id')->values()->all(),
                'assignments' => $createdOrUpdated,
            ];
        });

        return response()->json([
            'message' => 'Assegnazioni minori aggiornate con successo.',
            'user' => $user->only(['id', 'uuid', 'email', 'first_name', 'last_name', 'is_active']),
            ...$result,
        ]);
    }

    public function bulkSyncForMinor(BulkSyncMinorUserAssignmentsRequest $request, Minor $minor): JsonResponse
    {
        $userIds = collect($request->input('user_ids', []))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();
        $validFrom = $request->input('valid_from');
        $validTo = $request->input('valid_to');
        $notes = $request->input('notes');
        $isActive = $request->boolean('is_active', true);

        $result = DB::transaction(function () use ($minor, $userIds, $validFrom, $validTo, $notes, $isActive, $request): array {
            $currentAssignments = MinorUserAssignment::query()
                ->where('minor_id', $minor->id)
                ->where('facility_id', $minor->facility_id)
                ->where('is_active', true)
                ->get()
                ->keyBy('user_id');

            $createdOrUpdated = [];

            foreach ($userIds as $userId) {
                $assignment = MinorUserAssignment::query()->updateOrCreate(
                    [
                        'minor_id' => $minor->id,
                        'user_id' => $userId,
                        'facility_id' => $minor->facility_id,
                    ],
                    [
                        'valid_from' => $validFrom,
                        'valid_to' => $validTo,
                        'is_active' => $isActive,
                        'assigned_by_user_id' => $request->user()?->id,
                        'notes' => $notes,
                    ]
                );

                $createdOrUpdated[] = $this->loadAssignment($assignment);
                $currentAssignments->forget($userId);
            }

            foreach ($currentAssignments as $assignment) {
                $assignment->forceFill([
                    'valid_to' => $validTo ?: now()->toDateString(),
                    'is_active' => false,
                ])->save();
            }

            return [
                'synced_user_ids' => $userIds->all(),
                'revoked_assignment_ids' => $currentAssignments->pluck('id')->values()->all(),
                'assignments' => $createdOrUpdated,
            ];
        });

        return response()->json([
            'message' => 'Accessi al minore aggiornati con successo.',
            'minor' => $minor->load('minorStatus', 'facility.organization'),
            ...$result,
        ]);
    }

    private function loadAssignment(MinorUserAssignment $assignment): MinorUserAssignment
    {
        $loaded = $assignment->load([
            'minor.minorStatus',
            'facility.organization',
            'user.userFacilityRoles.role',
            'assignedBy:id,first_name,last_name,email',
        ]);

        $loaded->append([
            'effective_role_code',
            'effective_role_name',
        ]);

        return $loaded->makeHidden([
            'assignment_role_code',
            'access_level',
        ]);
    }
}
