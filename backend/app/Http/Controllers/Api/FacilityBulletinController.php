<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFacilityBulletinRequest;
use App\Models\FacilityBulletin;
use App\Services\AuditLogService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FacilityBulletinController extends Controller
{
    public function __construct(private readonly AuditLogService $audit = new AuditLogService()) {}

    public function visibleIndex(Request $request): JsonResponse
    {
        $facilityId = $request->validate(['facility_id' => ['required', 'integer', 'exists:facilities,id']])['facility_id'];
        $items = $this->visibleQuery($request, (int) $facilityId)->with(['targetRoles:id,code,name', 'acknowledgements' => fn ($query) => $query->where('user_id', $request->user()->id)])->latest('published_at')->get();
        return response()->json($items->map(fn (FacilityBulletin $item) => $this->serialize($item, $request)));
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $facilityId = (int) $request->validate(['facility_id' => ['required', 'integer', 'exists:facilities,id']])['facility_id'];
        $count = $this->visibleQuery($request, $facilityId)->whereDoesntHave('acknowledgements', fn ($query) => $query->where('user_id', $request->user()->id))->count();
        return response()->json(['facility_id' => $facilityId, 'unread_count' => $count]);
    }

    public function visibleShow(Request $request, FacilityBulletin $bulletin): JsonResponse
    {
        abort_unless($this->visibleQuery($request, $bulletin->facility_id)->whereKey($bulletin->id)->exists(), 404);
        $bulletin->load(['targetRoles:id,code,name', 'acknowledgements' => fn ($query) => $query->where('user_id', $request->user()->id)]);
        $this->record($request, 'read', $bulletin, 'ha letto una circolare di struttura');
        return response()->json($this->serialize($bulletin, $request));
    }

    public function acknowledge(Request $request, FacilityBulletin $bulletin): JsonResponse
    {
        abort_unless($this->visibleQuery($request, $bulletin->facility_id)->whereKey($bulletin->id)->exists(), 404);
        abort_if($bulletin->expires_at?->isPast(), 409, 'La circolare è scaduta e non può essere presa in visione.');
        $ack = $bulletin->acknowledgements()->firstOrCreate(['user_id' => $request->user()->id], ['acknowledged_at' => now()]);
        if ($ack->wasRecentlyCreated) $this->record($request, 'acknowledge', $bulletin, 'ha confermato la presa visione della circolare');
        return response()->json(['bulletin_id' => $bulletin->id, 'acknowledged_at' => $ack->acknowledged_at, 'already_acknowledged' => ! $ack->wasRecentlyCreated]);
    }

    public function managedIndex(Request $request): JsonResponse
    {
        $data = $request->validate(['facility_id' => ['required', 'integer', 'exists:facilities,id'], 'status' => ['nullable', 'in:DRAFT,PUBLISHED,ARCHIVED']]);
        $items = FacilityBulletin::query()->where('facility_id', $data['facility_id'])->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))->with(['targetRoles:id,code,name'])->withCount('acknowledgements')->latest('id')->get();
        return response()->json($items->map(fn (FacilityBulletin $item) => $this->serialize($item, $request, true)));
    }

    public function store(StoreFacilityBulletinRequest $request): JsonResponse
    {
        $data = $request->validated();
        abort_unless($request->user()->hasPermission('facility_bulletins.manage', (int) $data['facility_id']), 403, 'Permesso insufficiente: facility_bulletins.manage.');
        $item = DB::transaction(function () use ($request, $data): FacilityBulletin {
            $item = FacilityBulletin::query()->create([...$data, 'status' => 'DRAFT', 'created_by_user_id' => $request->user()->id]);
            $item->targetRoles()->sync($data['target_role_ids'] ?? []);
            return $item;
        });
        $this->record($request, 'create', $item, 'ha creato una bozza di circolare');
        return response()->json($this->serialize($item->load('targetRoles:id,code,name'), $request, true), 201);
    }

    public function managedShow(Request $request, FacilityBulletin $bulletin): JsonResponse
    {
        $bulletin->load(['targetRoles:id,code,name', 'createdBy:id,first_name,last_name', 'publishedBy:id,first_name,last_name'])->loadCount('acknowledgements');
        $this->record($request, 'read', $bulletin, 'ha consultato la circolare in gestione');
        return response()->json($this->serialize($bulletin, $request, true));
    }

    public function update(StoreFacilityBulletinRequest $request, FacilityBulletin $bulletin): JsonResponse
    {
        abort_if($bulletin->status !== 'DRAFT', 409, 'Una circolare pubblicata o archiviata è immutabile.');
        $data = $request->validated();
        abort_unless($request->user()->hasPermission('facility_bulletins.manage', (int) $data['facility_id']), 403, 'Permesso insufficiente sulla struttura di destinazione.');
        DB::transaction(function () use ($bulletin, $data): void { $bulletin->update($data); $bulletin->targetRoles()->sync($data['target_role_ids'] ?? []); });
        $this->record($request, 'update', $bulletin, 'ha aggiornato una bozza di circolare');
        return response()->json($this->serialize($bulletin->fresh()->load('targetRoles:id,code,name'), $request, true));
    }

    public function publish(Request $request, FacilityBulletin $bulletin): JsonResponse
    {
        abort_if($bulletin->status !== 'DRAFT', 409, 'Solo una bozza può essere pubblicata.');
        $bulletin->update(['status' => 'PUBLISHED', 'published_at' => now(), 'published_by_user_id' => $request->user()->id]);
        $this->record($request, 'publish', $bulletin, 'ha pubblicato una circolare');
        return response()->json($this->serialize($bulletin->fresh()->load('targetRoles:id,code,name'), $request, true));
    }

    public function archive(Request $request, FacilityBulletin $bulletin): JsonResponse
    {
        abort_if($bulletin->status === 'ARCHIVED', 409, 'La circolare è già archiviata.');
        $bulletin->update(['status' => 'ARCHIVED']);
        $this->record($request, 'archive', $bulletin, 'ha archiviato una circolare');
        return response()->json($this->serialize($bulletin->fresh()->load('targetRoles:id,code,name'), $request, true));
    }

    private function visibleQuery(Request $request, int $facilityId): Builder
    {
        $roleIds = $request->user()->userFacilityRoles()->where('facility_id', $facilityId)->where('is_active', true)->where(fn ($query) => $query->whereNull('valid_to')->orWhere('valid_to', '>=', now()))->pluck('role_id');
        abort_if($roleIds->isEmpty(), 403, 'Nessun ruolo attivo nella struttura richiesta.');
        return FacilityBulletin::query()->where('facility_id', $facilityId)->where('status', 'PUBLISHED')->whereNotNull('published_at')->where('published_at', '<=', now())->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))->where(fn ($query) => $query->whereDoesntHave('targetRoles')->orWhereHas('targetRoles', fn ($target) => $target->whereIn('roles.id', $roleIds)));
    }

    private function serialize(FacilityBulletin $item, Request $request, bool $managed = false): array
    {
        $ack = $item->acknowledgements->firstWhere('user_id', $request->user()->id);
        return ['id' => $item->id, 'facility_id' => $item->facility_id, 'title' => $item->title, 'body' => $item->body, 'status' => $item->status, 'expires_at' => $item->expires_at?->toIso8601String(), 'published_at' => $item->published_at?->toIso8601String(), 'target_roles' => $item->targetRoles->map->only(['id', 'code', 'name'])->values(), 'is_acknowledged' => (bool) $ack, 'acknowledged_at' => $ack?->acknowledged_at?->toIso8601String(), 'acknowledgement_count' => $managed ? ($item->acknowledgements_count ?? $item->acknowledgements()->count()) : null];
    }

    private function record(Request $request, string $action, FacilityBulletin $item, string $verb): void
    {
        $this->audit->record($request, ['facility_id' => $item->facility_id, 'action' => $action, 'resource_type' => 'facility_bulletin', 'resource_id' => (string) $item->id, 'resource_label' => 'Circolare #'.$item->id, 'operation_summary' => $this->audit->resolveActorDisplayName($request->user()).' '.$verb.' nella struttura #'.$item->facility_id.'.', 'new_values_json' => ['status' => $item->status, 'expires_at' => $item->expires_at?->toIso8601String(), 'target_role_ids' => $item->targetRoles()->pluck('roles.id')->all()]]);
        $this->audit->markHandled($request);
    }
}
