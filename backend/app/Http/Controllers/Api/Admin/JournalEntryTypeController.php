<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreJournalEntryTypeRequest;
use App\Models\JournalEntryType;
use Illuminate\Http\JsonResponse;

class JournalEntryTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            JournalEntryType::query()->orderBy('sort_order')->orderBy('name')->get()
        );
    }

    public function store(StoreJournalEntryTypeRequest $request): JsonResponse
    {
        $entryType = JournalEntryType::query()->create([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($entryType, 201);
    }

    public function show(JournalEntryType $journalEntryType): JsonResponse
    {
        return response()->json($journalEntryType);
    }

    public function update(StoreJournalEntryTypeRequest $request, JournalEntryType $journalEntryType): JsonResponse
    {
        $journalEntryType->update([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', $journalEntryType->sort_order),
            'is_active' => $request->boolean('is_active', $journalEntryType->is_active),
        ]);

        return response()->json($journalEntryType->fresh());
    }

    public function destroy(JournalEntryType $journalEntryType): JsonResponse
    {
        $journalEntryType->delete();

        return response()->json(status: 204);
    }
}
