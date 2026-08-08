<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreOrganizationRequest;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;

class OrganizationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Organization::query()
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreOrganizationRequest $request): JsonResponse
    {
        $organization = Organization::query()->create($request->validated());

        return response()->json($organization, 201);
    }
}
