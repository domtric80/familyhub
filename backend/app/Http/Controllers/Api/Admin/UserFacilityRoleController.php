<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignUserFacilityRoleRequest;
use App\Models\UserFacilityRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserFacilityRoleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            UserFacilityRole::query()
                ->with(['user', 'facility', 'role', 'assignedBy'])
                ->orderByDesc('valid_from')
                ->get()
        );
    }

    public function store(AssignUserFacilityRoleRequest $request): JsonResponse
    {
        $assignment = UserFacilityRole::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
            'assigned_by_user_id' => $request->integer('assigned_by_user_id') ?: $request->user()?->id,
        ]);

        return response()->json(
            $assignment->load(['user', 'facility', 'role', 'assignedBy']),
            201
        );
    }

    public function show(UserFacilityRole $assignment): JsonResponse
    {
        return response()->json(
            $assignment->load(['user', 'facility', 'role', 'assignedBy'])
        );
    }

    public function update(AssignUserFacilityRoleRequest $request, UserFacilityRole $assignment): JsonResponse
    {
        $assignment->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', $assignment->is_active),
        ]);

        return response()->json(
            $assignment->fresh()->load(['user', 'facility', 'role', 'assignedBy'])
        );
    }

    public function revoke(Request $request, UserFacilityRole $assignment): JsonResponse
    {
        if (! $assignment->is_active) {
            return response()->json([
                'message' => 'L’assegnazione è già revocata o inattiva.',
                'assignment' => $assignment->load(['user', 'facility', 'role', 'assignedBy']),
            ]);
        }

        $effectiveEnd = $request->input('valid_to') ?: now()->toDateString();

        if ($effectiveEnd < $assignment->valid_from->toDateString()) {
            return response()->json([
                'message' => 'La data di revoca non può essere precedente alla data di inizio validità.',
            ], 422);
        }

        $assignment->forceFill([
            'valid_to' => $effectiveEnd,
            'is_active' => false,
        ])->save();

        return response()->json([
            'message' => 'Assegnazione revocata.',
            'assignment' => $assignment->fresh()->load(['user', 'facility', 'role', 'assignedBy']),
        ]);
    }
}
