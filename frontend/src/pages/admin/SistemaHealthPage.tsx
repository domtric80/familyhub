import { useCallback, useEffect, useState } from 'react'
import { Card, CardBody, Button, Alert, Badge } from 'reactstrap'
import { RefreshCw, ChevronDown, ChevronRight } from 'react-feather'
import { toast } from 'react-toastify'
import { systemHealthApi } from '../../services/api'
import type { SystemHealthService, SystemHealthSummary } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

type ServiceStatus = 'ok' | 'warning' | 'error' | 'not_configured'

const STATUS_CONFIG: Record<ServiceStatus, { color: string; label: string; badgeColor: string }> = {
  ok:             { color: '#28a745', label: 'Operativo',      badgeColor: 'success' },
  warning:        { color: '#ff9f43', label: 'Degradato',      badgeColor: 'warning' },
  error:          { color: '#e74c3c', label: 'Non disponibile', badgeColor: 'danger' },
  not_configured: { color: '#adb5bd', label: 'Non configurato', badgeColor: 'secondary' },
}

function StatusDot({ status }: { status: ServiceStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_configured
  return (
    <span className='d-inline-flex align-items-center gap-2'>
      <span style={{
        display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
        background: cfg.color,
        boxShadow: status !== 'not_configured' ? `0 0 6px ${cfg.color}88` : undefined,
        flexShrink: 0,
      }} />
      <span className='small' style={{ color: cfg.color }}>{cfg.label}</span>
    </span>
  )
}

function MetaTable({ meta }: { meta: Record<string, unknown> }) {
  const entries = Object.entries(meta)
  if (entries.length === 0) return <span className='text-muted small fst-italic'>Nessun metadato disponibile.</span>
  return (
    <table className='table table-sm mb-0' style={{ fontSize: 11 }}>
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k}>
            <td className='text-muted fw-semibold' style={{ whiteSpace: 'nowrap', width: 1 }}>{k}</td>
            <td><code>{String(v)}</code></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ServiceRow({ svc }: { svc: SystemHealthService }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = !!svc.error || Object.keys(svc.meta ?? {}).length > 0
  const status = (svc.status as ServiceStatus) in STATUS_CONFIG
    ? svc.status as ServiceStatus
    : 'not_configured'

  return (
    <>
      <tr
        style={{ cursor: hasDetail ? 'pointer' : 'default' }}
        onClick={() => hasDetail && setExpanded((p) => !p)}
      >
        <td>
          <span className='d-flex align-items-center gap-2'>
            {hasDetail
              ? (expanded
                  ? <ChevronDown size={13} className='text-muted' />
                  : <ChevronRight size={13} className='text-muted' />)
              : <span style={{ width: 13 }} />}
            <span className='fw-semibold small'>{svc.label || svc.service}</span>
          </span>
        </td>
        <td><StatusDot status={status} /></td>
        <td className='small text-muted'>
          {svc.checked_at ? new Date(svc.checked_at).toLocaleString('it-IT') : '—'}
        </td>
        <td className='text-center small text-muted'>
          {svc.latency_ms != null ? `${svc.latency_ms} ms` : '—'}
        </td>
        <td className='small text-muted'>{svc.message ?? '—'}</td>
      </tr>
      {expanded && hasDetail && (
        <tr style={{ background: '#f8f9ff' }}>
          <td colSpan={5} className='px-4 py-2'>
            <div className='small'>
              <div className='text-muted mb-1'>
                <strong>Servizio:</strong> <code>{svc.service}</code>
              </div>
              {svc.error && (
                <div className='text-danger mb-2'>
                  <strong>Errore:</strong> {svc.error}
                </div>
              )}
              {Object.keys(svc.meta ?? {}).length > 0 && (
                <div className='mt-1'>
                  <strong className='text-muted d-block mb-1'>Dettagli tecnici:</strong>
                  <MetaTable meta={svc.meta} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

const EMPTY_SUMMARY: SystemHealthSummary = { ok: 0, warning: 0, error: 0, not_configured: 0 }

export default function SistemaHealthPage() {
  const { hasPermission } = useAuth()
  const canRun = hasPermission('system_health.run')

  const [services, setServices] = useState<SystemHealthService[]>([])
  const [summary, setSummary] = useState<SystemHealthSummary>(EMPTY_SUMMARY)
  const [storageSource, setStorageSource] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const applyResponse = useCallback((data: Awaited<ReturnType<typeof systemHealthApi.snapshot>>) => {
    setServices(data.services ?? [])
    setSummary(data.summary ?? EMPTY_SUMMARY)
    setStorageSource(data.storage_config_source ?? null)
    setGeneratedAt(data.generated_at ?? null)
  }, [])

  useEffect(() => {
    setLoading(true)
    systemHealthApi.snapshot()
      .then(applyResponse)
      .catch((err) => {
        if (err?.response?.status === 403) setForbidden(true)
        else setLoadError(true)
      })
      .finally(() => setLoading(false))
  }, [applyResponse])

  const handleRun = async () => {
    setRunning(true)
    try {
      const data = await systemHealthApi.run()
      applyResponse(data)
      toast.success('Controllo servizi completato.')
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error('Permesso insufficiente per eseguire il controllo.')
      } else {
        toast.error('Errore durante il controllo. I dati mostrati potrebbero non essere aggiornati.')
      }
    } finally {
      setRunning(false)
    }
  }

  if (forbidden) {
    return (
      <div className='container-fluid py-3'>
        <Alert color='danger'>
          <strong>Accesso negato.</strong> Non hai il permesso <code>system_health.read</code> per visualizzare questa pagina.
        </Alert>
      </div>
    )
  }

  return (
    <div className='container-fluid py-3'>
      {/* Header */}
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <div>
          <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Health Servizi</h5>
          {storageSource && (
            <span className='text-muted small'>
              Configurazione storage attuale: <strong>{storageSource}</strong>
            </span>
          )}
        </div>
        <div className='d-flex align-items-center gap-2'>
          {generatedAt && (
            <span className='text-muted small'>
              Aggiornato: {new Date(generatedAt).toLocaleString('it-IT')}
            </span>
          )}
          {canRun && (
            <Button
              size='sm' color='primary' disabled={running || loading}
              onClick={handleRun}
              className='d-flex align-items-center gap-1'
            >
              <RefreshCw size={13} className={running ? 'spin' : ''} />
              {running ? 'Controllo in corso…' : 'Esegui controllo'}
            </Button>
          )}
        </div>
      </div>

      {/* Errore caricamento */}
      {loadError && (
        <Alert color='danger' className='small mb-3'>
          Errore nel caricamento dello stato servizi. Riprovare più tardi.
        </Alert>
      )}

      {/* KPI summary */}
      <div className='d-flex gap-3 mb-3 flex-wrap'>
        <span className='badge badge-light-success px-3 py-2' style={{ fontSize: 13 }}>
          {summary.ok} <span className='fw-normal'>operativi</span>
        </span>
        <span className='badge badge-light-warning px-3 py-2' style={{ fontSize: 13 }}>
          {summary.warning} <span className='fw-normal'>warning</span>
        </span>
        <span className='badge badge-light-danger px-3 py-2' style={{ fontSize: 13 }}>
          {summary.error} <span className='fw-normal'>errori</span>
        </span>
        <span className='badge badge-light-secondary px-3 py-2' style={{ fontSize: 13 }}>
          {summary.not_configured} <span className='fw-normal'>non configurati</span>
        </span>
      </div>

      {/* Tabella servizi */}
      <Card>
        <CardBody className='p-0'>
          <div className='table-responsive'>
            <table className='table table-hover table-sm mb-0 align-middle'>
              <thead className='table-light'>
                <tr>
                  <th style={{ minWidth: 200 }}>Servizio</th>
                  <th style={{ minWidth: 160 }}>Stato</th>
                  <th>Ultimo check</th>
                  <th className='text-center'>Latenza</th>
                  <th>Messaggio</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className='text-center text-muted py-4 small'>Caricamento…</td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='text-center text-muted py-4 small'>
                      Nessun servizio disponibile.
                    </td>
                  </tr>
                ) : (
                  services.map((svc) => <ServiceRow key={svc.service} svc={svc} />)
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Legenda */}
      <div className='mt-3 small text-muted d-flex align-items-center gap-3 flex-wrap'>
        {(Object.entries(STATUS_CONFIG) as [ServiceStatus, typeof STATUS_CONFIG[ServiceStatus]][]).map(([s, cfg]) => (
          <span key={s} className='d-flex align-items-center gap-1'>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
            {cfg.label}
          </span>
        ))}
        <span className='ms-3 fst-italic'>I dettagli non espongono password, token o chiavi.</span>
      </div>
    </div>
  )
}
