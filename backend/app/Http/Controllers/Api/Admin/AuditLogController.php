<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $this->baseQuery();

        $this->applyFilters($query, $request);

        $perPage = max(1, min(200, $request->integer('per_page', 50)));

        $paginator = $query->paginate($perPage);
        $paginator->setCollection(
            $paginator->getCollection()->map(fn (AuditLog $log): array => $this->serializeAuditLog($log))
        );

        return response()->json($paginator);
    }

    public function show(AuditLog $auditLog): JsonResponse
    {
        return response()->json(
            $this->serializeAuditLog($auditLog->load([
                'actorUser:id,first_name,last_name,email',
                'facility:id,name',
                'minor:id,internal_code,preferred_name,first_name,last_name',
            ]))
        );
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $query = $this->baseQuery();
        $this->applyFilters($query, $request);

        $filename = 'audit-logs-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'data_ora_utc',
                'indirizzo_ip',
                'utente',
                'ruolo',
                'operazione',
                'action',
                'resource_type',
                'resource_id',
                'resource_label',
                'struttura',
                'minore_codice',
                'minore_pseudonimo',
            ], ';');

            $query->chunk(500, function ($logs) use ($handle): void {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        optional($log->occurred_at_utc)?->toISOString(),
                        $log->ip_address,
                        $log->actor_display_name,
                        $log->actor_role_name,
                        $log->operation_summary,
                        $log->action,
                        $log->resource_type,
                        $log->resource_id,
                        $log->resource_label,
                        $log->facility?->name,
                        $log->minor?->internal_code,
                        $log->minor?->publicDisplayName(),
                    ], ';');
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function filters(): JsonResponse
    {
        return response()->json([
            'actions' => AuditLog::query()
                ->select('action')
                ->whereNotNull('action')
                ->distinct()
                ->orderBy('action')
                ->pluck('action')
                ->values(),
            'resource_types' => AuditLog::query()
                ->select('resource_type')
                ->whereNotNull('resource_type')
                ->distinct()
                ->orderBy('resource_type')
                ->pluck('resource_type')
                ->values(),
            'presets' => [
                [
                    'code' => 'today',
                    'label' => 'Oggi',
                    'query' => ['date_from' => now()->toDateString(), 'date_to' => now()->toDateString()],
                ],
                [
                    'code' => 'last_24h',
                    'label' => 'Ultime 24 ore',
                    'query' => ['date_from' => now()->subDay()->toDateString(), 'date_to' => now()->toDateString()],
                ],
                [
                    'code' => 'last_7d',
                    'label' => 'Ultimi 7 giorni',
                    'query' => ['date_from' => now()->subDays(7)->toDateString(), 'date_to' => now()->toDateString()],
                ],
                [
                    'code' => 'auth_only',
                    'label' => 'Solo autenticazione',
                    'resource_types' => ['auth_login', 'auth_logout', 'mfa_setup', 'mfa_confirm', 'mfa_disable', 'mfa_recovery_codes', 'auth_failed'],
                ],
                [
                    'code' => 'auth_failures_only',
                    'label' => 'Solo errori accesso',
                    'actions' => ['auth_failed', 'auth_blocked', 'mfa_failed'],
                ],
                [
                    'code' => 'minors_only',
                    'label' => 'Solo minori',
                    'resource_types' => ['minor', 'minor_history'],
                ],
                [
                    'code' => 'documents_only',
                    'label' => 'Solo documenti',
                    'resource_types' => ['minor_document_preview', 'minor_document_download', 'staff_document_preview', 'staff_document_download'],
                ],
                [
                    'code' => 'permissions_only',
                    'label' => 'Solo permessi',
                    'resource_types' => ['role_permissions'],
                ],
                [
                    'code' => 'sensitive_reads_only',
                    'label' => 'Solo letture sensibili',
                    'resource_types' => ['minor', 'minor_history', 'minor_document_preview', 'minor_document_download', 'staff_document_preview', 'staff_document_download'],
                ],
            ],
        ]);
    }

    public function kpis(Request $request): JsonResponse
    {
        $query = AuditLog::query();
        $this->applyFilters($query, $request);

        $loginFailures = (clone $query)->whereIn('action', ['auth_failed', 'auth_blocked', 'mfa_failed'])->count();
        $documentAccess = (clone $query)->whereIn('resource_type', [
            'minor_document_preview',
            'minor_document_download',
            'staff_document_preview',
            'staff_document_download',
        ])->count();
        $permissionChanges = (clone $query)->where('resource_type', 'role_permissions')->count();
        $minorReads = (clone $query)->whereIn('resource_type', ['minor', 'minor_history'])->where('action', 'read')->count();
        $totalEvents = (clone $query)->count();

        $topActors = (clone $query)
            ->selectRaw('actor_display_name, count(*) as total')
            ->whereNotNull('actor_display_name')
            ->groupBy('actor_display_name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $resourceBreakdown = (clone $query)
            ->selectRaw('resource_type, count(*) as total')
            ->whereNotNull('resource_type')
            ->groupBy('resource_type')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $dailySeries = (clone $query)
            ->selectRaw("DATE(occurred_at_utc) as day, count(*) as total")
            ->groupByRaw('DATE(occurred_at_utc)')
            ->orderByRaw('DATE(occurred_at_utc)')
            ->get();

        $actionBreakdown = (clone $query)
            ->selectRaw('action, count(*) as total')
            ->whereNotNull('action')
            ->groupBy('action')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'summary' => [
                'login_failures' => $loginFailures,
                'document_access_events' => $documentAccess,
                'permission_change_events' => $permissionChanges,
                'minor_read_events' => $minorReads,
                'total_events' => $totalEvents,
            ],
            'top_actors' => $topActors,
            'resource_breakdown' => $resourceBreakdown,
            'action_breakdown' => $actionBreakdown,
            'daily_series' => $dailySeries,
        ]);
    }

    private function baseQuery(): Builder
    {
        return AuditLog::query()
            ->with([
                'actorUser:id,first_name,last_name,email',
                'facility:id,name',
                'minor:id,internal_code,preferred_name,first_name,last_name',
            ])
            ->orderByDesc('occurred_at_utc')
            ->orderByDesc('id');
    }

    private function serializeAuditLog(AuditLog $log): array
    {
        return [
            'id' => $log->id,
            'facility_id' => $log->facility_id,
            'minor_id' => $log->minor_id,
            'actor_user_id' => $log->actor_user_id,
            'actor_display_name' => $log->actor_display_name,
            'actor_role_name' => $log->actor_role_name,
            'action' => $log->action,
            'resource_type' => $log->resource_type,
            'resource_id' => $log->resource_id,
            'resource_label' => $log->resource_label,
            'operation_summary' => $log->operation_summary,
            'ip_address' => $log->ip_address,
            'user_agent' => $log->user_agent,
            'old_values_json' => $log->old_values_json,
            'new_values_json' => $log->new_values_json,
            'occurred_at_utc' => optional($log->occurred_at_utc)?->toISOString(),
            'actor_user' => $log->actorUser,
            'facility' => $log->facility,
            'minor' => $log->minor ? [
                'id' => $log->minor->id,
                'internal_code' => $log->minor->internal_code,
                'public_display_name' => $log->minor->publicDisplayName(),
            ] : null,
        ];
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('q')) {
            $search = (string) $request->input('q');

            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('actor_display_name', 'like', "%{$search}%")
                    ->orWhere('actor_role_name', 'like', "%{$search}%")
                    ->orWhere('resource_type', 'like', "%{$search}%")
                    ->orWhere('resource_label', 'like', "%{$search}%")
                    ->orWhere('operation_summary', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->integer('facility_id'));
        }

        if ($request->filled('minor_id')) {
            $query->where('minor_id', $request->integer('minor_id'));
        }

        if ($request->filled('actor_user_id')) {
            $query->where('actor_user_id', $request->integer('actor_user_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', (string) $request->input('action'));
        }

        if ($request->filled('actions')) {
            $actions = collect((array) $request->input('actions'))
                ->filter(fn ($value) => is_string($value) && $value !== '')
                ->values()
                ->all();

            if ($actions !== []) {
                $query->whereIn('action', $actions);
            }
        }

        if ($request->filled('resource_type')) {
            $query->where('resource_type', (string) $request->input('resource_type'));
        }

        if ($request->filled('resource_types')) {
            $resourceTypes = collect((array) $request->input('resource_types'))
                ->filter(fn ($value) => is_string($value) && $value !== '')
                ->values()
                ->all();

            if ($resourceTypes !== []) {
                $query->whereIn('resource_type', $resourceTypes);
            }
        }

        if ($request->filled('resource_id')) {
            $query->where('resource_id', (string) $request->input('resource_id'));
        }

        if ($request->filled('date_from')) {
            $query->where('occurred_at_utc', '>=', $request->date('date_from')?->startOfDay());
        }

        if ($request->filled('date_to')) {
            $query->where('occurred_at_utc', '<=', $request->date('date_to')?->endOfDay());
        }
    }
}
