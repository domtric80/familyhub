<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Incidents\StoreMinorIncidentExternalNotificationRequest;
use App\Http\Requests\Incidents\StoreMinorIncidentRequest;
use App\Http\Requests\Incidents\TransitionMinorIncidentRequest;
use App\Http\Requests\Incidents\UpdateMinorIncidentRequest;
use App\Http\Requests\Incidents\UpsertMinorIncidentAnalysisRequest;
use App\Models\DocumentIssuer;
use App\Models\IncidentSeverityLevel;
use App\Models\IncidentStatus;
use App\Models\IncidentType;
use App\Models\Minor;
use App\Models\MinorIncident;
use App\Models\MinorIncidentExternalNotification;
use App\Models\StaffMember;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\MinorAccessService;
use App\Services\MinorHistoryService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MinorIncidentController extends Controller
{
    public function __construct(
        private readonly MinorAccessService $minorAccessService = new MinorAccessService(),
        private readonly MinorHistoryService $minorHistoryService = new MinorHistoryService(),
        private readonly AuditLogService $auditLogService = new AuditLogService(),
    ) {
    }

    public function options(): JsonResponse
    {
        return response()->json([
            'incident_types' => IncidentType::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get(),
            'severity_levels' => IncidentSeverityLevel::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'statuses' => IncidentStatus::query()->orderBy('sort_order')->get(),
            'document_issuers' => DocumentIssuer::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'facility_id' => ['nullable', 'integer', 'exists:facilities,id'],
            'minor_id' => ['nullable', 'integer', 'exists:minors,id'],
            'incident_type_id' => ['nullable', 'integer', 'exists:incident_types,id'],
            'severity_code' => ['nullable', 'string', 'exists:incident_severity_levels,code'],
            'status_code' => ['nullable', 'string', 'exists:incident_statuses,code'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = MinorIncident::query()->with($this->relations())
            ->when($request->filled('facility_id'), fn (Builder $q) => $q->where('facility_id', $request->integer('facility_id')))
            ->when($request->filled('minor_id'), fn (Builder $q) => $q->where('minor_id', $request->integer('minor_id')))
            ->when($request->filled('incident_type_id'), fn (Builder $q) => $q->where('incident_type_id', $request->integer('incident_type_id')))
            ->when($request->filled('severity_code'), fn (Builder $q) => $q->whereHas('severityLevel', fn (Builder $severity) => $severity->where('code', $request->string('severity_code'))))
            ->when($request->filled('status_code'), fn (Builder $q) => $q->whereHas('status', fn (Builder $status) => $status->where('code', $request->string('status_code'))))
            ->when($request->filled('date_from'), fn (Builder $q) => $q->whereDate('occurred_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn (Builder $q) => $q->whereDate('occurred_at', '<=', $request->date('date_to')))
            ->whereHas('minor', fn (Builder $minorQuery) => $this->minorAccessService->scopeVisibleMinorsForUser($minorQuery, $request->user()))
            ->orderByDesc('occurred_at')->orderByDesc('id');

        return response()->json($query->get()->map(fn (MinorIncident $incident) => $this->serialize($incident, $request->user())));
    }

    public function store(StoreMinorIncidentRequest $request): JsonResponse
    {
        $minor = Minor::query()->findOrFail($request->integer('minor_id'));
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $minor, 'minor_incidents.create'), 403, 'Creazione incidente non consentita per questo minore.');
        $severity = IncidentSeverityLevel::query()->where('code', $request->string('severity_code'))->firstOrFail();
        $reported = IncidentStatus::query()->where('code', 'REPORTED')->firstOrFail();

        $incident = DB::transaction(function () use ($request, $minor, $severity, $reported): MinorIncident {
            $incident = MinorIncident::query()->create([
                ...$request->safe()->except(['severity_code']),
                'facility_id' => $minor->facility_id,
                'severity_level_id' => $severity->id,
                'status_id' => $reported->id,
                'requires_external_notification' => $request->boolean('requires_external_notification', false),
                'reported_by_user_id' => $request->user()->id,
                'updated_by_user_id' => $request->user()->id,
            ]);
            $incident->transitions()->create(['from_status_id' => null, 'to_status_id' => $reported->id, 'performed_by_user_id' => $request->user()->id, 'performed_at' => now()]);
            return $incident;
        });
        $this->recordAudit($request, $incident, 'create', 'ha registrato un incidente');
        return response()->json($this->serialize($incident->load($this->relations()), $request->user()), 201);
    }

    public function show(Request $request, MinorIncident $incident): JsonResponse
    {
        $this->authorizeIncident($request, $incident, 'minor_incidents.read');
        return response()->json($this->serialize($incident->load($this->relations()), $request->user()));
    }

    public function update(UpdateMinorIncidentRequest $request, MinorIncident $incident): JsonResponse
    {
        $this->authorizeIncident($request, $incident, 'minor_incidents.update');
        abort_unless($incident->status()->where('code', 'REPORTED')->exists(), 409, 'L’incidente non è più modificabile dopo la revisione del coordinatore.');
        $before = $incident->toArray();
        $payload = $request->safe()->except(['severity_code']);
        if ($request->filled('severity_code')) {
            $payload['severity_level_id'] = IncidentSeverityLevel::query()->where('code', $request->string('severity_code'))->value('id');
        }
        $incident->update([...$payload, 'updated_by_user_id' => $request->user()->id]);
        $this->recordAudit($request, $incident, 'update', 'ha corretto i dati di un incidente', $before);
        return response()->json($this->serialize($incident->fresh()->load($this->relations()), $request->user()));
    }

    public function transition(TransitionMinorIncidentRequest $request, MinorIncident $incident): JsonResponse
    {
        $this->authorizeIncident($request, $incident, 'minor_incidents.update');
        $targetCode = (string) $request->validated('to_status_code');

        $incident = DB::transaction(function () use ($request, $incident, $targetCode): MinorIncident {
            $locked = MinorIncident::query()->with(['status', 'analysis', 'externalNotifications'])->lockForUpdate()->findOrFail($incident->id);
            $allowed = $this->allowedTransitions($locked, $request->user());
            abort_unless(in_array($targetCode, $allowed, true), 409, 'Transizione non ammessa per stato, ruolo o prerequisiti correnti.');
            $target = IncidentStatus::query()->where('code', $targetCode)->firstOrFail();
            $fromId = $locked->status_id;
            $locked->update(['status_id' => $target->id, 'updated_by_user_id' => $request->user()->id]);
            $locked->transitions()->create([
                'from_status_id' => $fromId,
                'to_status_id' => $target->id,
                'notes' => $request->validated('notes'),
                'performed_by_user_id' => $request->user()->id,
                'performed_at' => now(),
            ]);
            return $locked;
        });
        $this->recordAudit($request, $incident, 'transition', 'ha avanzato il workflow dell’incidente');
        return response()->json($this->serialize($incident->fresh()->load($this->relations()), $request->user()));
    }

    public function upsertAnalysis(UpsertMinorIncidentAnalysisRequest $request, MinorIncident $incident): JsonResponse
    {
        $this->authorizeIncident($request, $incident, 'minor_incidents.update');
        abort_unless($request->user()->hasRoleIn(['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA']), 403, 'Root cause analysis riservata a coordinamento e direzione.');
        abort_if(in_array($incident->status?->code, ['REPORTED', 'CLOSED'], true), 409, 'La RCA è disponibile dopo la revisione del coordinatore e prima della chiusura.');
        if ($request->filled('responsible_staff_member_id')) {
            abort_unless(StaffMember::query()->whereKey($request->integer('responsible_staff_member_id'))->where('facility_id', $incident->facility_id)->exists(), 422, 'Responsabile RCA non appartenente alla struttura dell’incidente.');
        }
        $analysis = $incident->analysis()->updateOrCreate(['minor_incident_id' => $incident->id], [...$request->validated(), 'updated_by_user_id' => $request->user()->id]);
        $this->recordAudit($request, $incident, 'analysis_update', 'ha aggiornato la root cause analysis');
        return response()->json($analysis->load(['responsibleStaffMember', 'updatedBy:id,first_name,last_name,email']));
    }

    public function storeExternalNotification(StoreMinorIncidentExternalNotificationRequest $request, MinorIncident $incident): JsonResponse
    {
        $this->authorizeIncident($request, $incident, 'minor_incidents.update');
        abort_unless($request->user()->hasRoleIn(['SUPER_ADMIN', 'DIRETTORE']), 403, 'La notifica esterna può essere registrata solo dalla direzione.');
        abort_unless(in_array($incident->status?->code, ['DIRECTOR_REVIEWED', 'EXTERNAL_NOTIFIED'], true), 409, 'La notifica esterna richiede la revisione preventiva del direttore.');
        $notification = $incident->externalNotifications()->create([...$request->validated(), 'sent_by_user_id' => $request->user()->id]);
        $this->recordAudit($request, $incident, 'external_notification', 'ha registrato una comunicazione verso un’autorità esterna');
        return response()->json($notification->load(['documentIssuer', 'sentBy:id,first_name,last_name,email']), 201);
    }

    public function authorityReport(Request $request, MinorIncident $incident): JsonResponse
    {
        $this->authorizeIncident($request, $incident, 'minor_incidents.export');
        abort_unless($request->user()->hasRoleIn(['SUPER_ADMIN', 'DIRETTORE']), 403, 'Precompilazione autorità riservata alla direzione.');
        $data = $request->validate(['document_issuer_id' => ['required', 'integer', 'exists:document_issuers,id']]);
        $issuer = DocumentIssuer::query()->where('is_active', true)->findOrFail($data['document_issuer_id']);
        $incident->load($this->relations());
        $this->recordAudit($request, $incident, 'export_preview', 'ha generato la precompilazione per un’autorità esterna');
        return response()->json([
            'automatic_delivery' => false,
            'authority' => $issuer,
            'facility' => ['id' => $incident->facility_id, 'name' => $incident->facility?->name],
            'minor' => ['id' => $incident->minor_id, 'internal_code' => $incident->minor?->internal_code, 'first_name' => $incident->minor?->first_name, 'last_name' => $incident->minor?->last_name, 'birth_date' => $incident->minor?->birth_date?->toDateString()],
            'incident' => ['id' => $incident->id, 'type' => $incident->incidentType, 'severity' => $incident->severityLevel, 'occurred_at' => $incident->occurred_at?->toIso8601String(), 'location' => $incident->location, 'description' => $incident->description, 'immediate_actions' => $incident->immediate_actions],
            'generated_at' => now()->toIso8601String(),
            'generated_by' => ['id' => $request->user()->id, 'name' => $this->auditLogService->resolveActorDisplayName($request->user())],
        ]);
    }

    private function authorizeIncident(Request $request, MinorIncident $incident, string $permission): void
    {
        abort_unless($this->minorAccessService->canAccessMinor($request->user(), $incident->minor, $permission), 403, 'Accesso all’incidente non consentito per questo minore.');
    }

    private function allowedTransitions(MinorIncident $incident, User $user): array
    {
        $status = $incident->status?->code;
        $coordination = $user->hasRoleIn(['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA']);
        $direction = $user->hasRoleIn(['SUPER_ADMIN', 'DIRETTORE']);

        if ($status === 'REPORTED' && $coordination) return ['COORDINATOR_REVIEWED'];
        if ($status === 'COORDINATOR_REVIEWED' && $direction) return ['DIRECTOR_REVIEWED'];
        if ($status === 'DIRECTOR_REVIEWED' && $direction) {
            $allowed = ['EXTERNAL_NOTIFIED'];
            if (! $incident->requires_external_notification && $incident->analysis) $allowed[] = 'CLOSED';
            if (! $incident->externalNotifications->isNotEmpty()) $allowed = array_values(array_diff($allowed, ['EXTERNAL_NOTIFIED']));
            return $allowed;
        }
        if ($status === 'EXTERNAL_NOTIFIED' && $direction && $incident->analysis && $incident->externalNotifications->isNotEmpty()) return ['CLOSED'];
        return [];
    }

    private function relations(): array
    {
        return ['facility.organization', 'minor.minorStatus', 'incidentType', 'severityLevel', 'status', 'reportedBy:id,first_name,last_name,email', 'updatedBy:id,first_name,last_name,email', 'transitions.fromStatus', 'transitions.toStatus', 'transitions.performedBy:id,first_name,last_name,email', 'analysis.responsibleStaffMember', 'analysis.updatedBy:id,first_name,last_name,email', 'externalNotifications.documentIssuer', 'externalNotifications.sentBy:id,first_name,last_name,email'];
    }

    private function serialize(MinorIncident $incident, User $user): array
    {
        $incident->loadMissing($this->relations());
        return [...$incident->toArray(), 'severity_code' => $incident->severityLevel?->code, 'status_code' => $incident->status?->code, 'allowed_transitions' => $this->allowedTransitions($incident, $user)];
    }

    private function recordAudit(Request $request, MinorIncident $incident, string $action, string $verb, ?array $oldValues = null): void
    {
        $incident->loadMissing(['minor', 'incidentType', 'severityLevel', 'status']);
        $summary = $this->auditLogService->resolveActorDisplayName($request->user()).' '.$verb.' #'.$incident->id.' del minore '.$incident->minor->publicDisplayName().'.';
        $values = ['incident_type_code' => $incident->incidentType?->code, 'severity_code' => $incident->severityLevel?->code, 'status_code' => $incident->status?->code, 'requires_external_notification' => $incident->requires_external_notification];
        $this->minorHistoryService->record($incident->minor, 'minor_incident_'.$action, $request->user(), ['minor_incident_id' => $incident->id, ...$values, 'operation_summary' => $summary]);
        $this->auditLogService->record($request, ['facility_id' => $incident->facility_id, 'minor_id' => $incident->minor_id, 'action' => $action, 'resource_type' => 'minor_incident', 'resource_id' => (string) $incident->id, 'resource_label' => $incident->incidentType?->name, 'operation_summary' => $summary, 'old_values_json' => $oldValues, 'new_values_json' => $values]);
        $this->auditLogService->markHandled($request);
    }
}
