<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreContactTypeRequest;
use App\Models\ContactType;
use Illuminate\Http\JsonResponse;

class ContactTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            ContactType::query()
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreContactTypeRequest $request): JsonResponse
    {
        $contactType = ContactType::query()->create($request->validated());

        return response()->json($contactType, 201);
    }

    public function show(ContactType $contactType): JsonResponse
    {
        return response()->json($contactType);
    }

    public function update(StoreContactTypeRequest $request, ContactType $contactType): JsonResponse
    {
        $contactType->update($request->validated());

        return response()->json($contactType->fresh());
    }

    public function destroy(ContactType $contactType): JsonResponse
    {
        if ($contactType->minorContacts()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare il tipo contatto: esistono contatti minore collegati.',
            ], 409);
        }

        $contactType->delete();

        return response()->json(status: 204);
    }
}
