import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardHeader, CardBody,
  Nav, NavItem, NavLink, TabContent, TabPane,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, RefreshCw, Upload, ExternalLink, AlertTriangle } from 'react-feather'
import { toast } from 'react-toastify'
import { adminGeoSyncApi, apiError, errorMessage } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { SyncRun, SyncRunStatus, SyncIssue, SyncDecision, IssueSeverity, DecisionAction, SyncRunRequest } from '../../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

type BadgeColor = 'secondary' | 'info' | 'success' | 'warning' | 'danger' | 'dark'

function runStatusBadge(status: SyncRunStatus): { color: BadgeColor; label: string } {
  switch (status) {
    case 'queued':                  return { color: 'secondary', label: 'In coda' }
    case 'running':                 return { color: 'info',      label: 'In esecuzione' }
    case 'completed':               return { color: 'success',   label: 'Completato' }
    case 'completed_with_warnings': return { color: 'warning',   label: 'Completato (warning)' }
    case 'failed':                  return { color: 'danger',    label: 'Fallito' }
    case 'rolled_back':             return { color: 'dark',      label: 'Ripristinato' }
    default:                        return { color: 'secondary', label: status }
  }
}

function severityBadge(severity: IssueSeverity): { color: BadgeColor; label: string } {
  switch (severity) {
    case 'critical': return { color: 'danger',    label: 'Critico' }
    case 'error':    return { color: 'danger',    label: 'Errore' }
    case 'warning':  return { color: 'warning',   label: 'Warning' }
    case 'info':     return { color: 'info',      label: 'Info' }
    default:         return { color: 'secondary', label: severity }
  }
}

function actionBadge(action: DecisionAction): { color: BadgeColor; label: string } {
  switch (action) {
    case 'create':        return { color: 'success',   label: 'Crea' }
    case 'update':        return { color: 'info',      label: 'Aggiorna' }
    case 'deactivate':    return { color: 'warning',   label: 'Disattiva' }
    case 'skip':          return { color: 'secondary', label: 'Salta' }
    case 'manual_review': return { color: 'dark',      label: 'Revisione manuale' }
    default:              return { color: 'secondary', label: action }
  }
}

function formatDate(d?: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

function formatDuration(s?: number | null): string {
  if (s == null) return '—'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

// ── Stato ultimo run ─────────────────────────────────────────────────────────

function LatestRunSection({
  canRun, canPublish, onAvviaClick, onPublishClick, onOpenDetail,
}: {
  canRun: boolean; canPublish: boolean
  onAvviaClick: () => void; onPublishClick: (run: SyncRun) => void
  onOpenDetail: (run: SyncRun) => void
}) {
  const [run, setRun] = useState<SyncRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null); setNotAvailable(false)
    try {
      setRun(await adminGeoSyncApi.latestRun())
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 404 || ae.status === 503) setNotAvailable(true)
      else setError(ae.message ?? 'Errore caricamento')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className='text-center py-5'><div className='loader' /></div>
  if (notAvailable) return (
    <Alert color='warning' className='d-flex align-items-center gap-2'>
      <AlertTriangle size={16} />
      API di sincronizzazione non ancora disponibile — il backend è in fase di sviluppo.
    </Alert>
  )
  if (error) return <Alert color='danger'>{error}</Alert>

  return (
    <>
      <div className='d-flex gap-2 mb-3'>
        {canRun && (
          <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={onAvviaClick}>
            <RefreshCw size={13} /> Avvia verifica
          </Button>
        )}
        {canPublish && run && (
          <Button color='success' size='sm' className='d-flex align-items-center gap-1' onClick={() => onPublishClick(run)}>
            <Upload size={13} /> Pubblica modifiche sicure
          </Button>
        )}
        {run && (
          <Button color='secondary' size='sm' className='d-flex align-items-center gap-1' onClick={() => onOpenDetail(run)}>
            <ExternalLink size={13} /> Apri dettaglio run
          </Button>
        )}
        <Button color='light' size='sm' onClick={load}><RefreshCw size={13} /></Button>
      </div>

      {!run
        ? <p className='text-muted'>Nessun run effettuato.</p>
        : (() => {
            const badge = runStatusBadge(run.status)
            return (
              <Row>
                <Col md='6'>
                  <Card className='border'>
                    <CardBody>
                      <Row className='g-2'>
                        <Col xs='6'><small className='text-muted d-block'>Stato</small><Badge color={badge.color}>{badge.label}</Badge></Col>
                        <Col xs='6'><small className='text-muted d-block'>Run ID</small><code>#{run.id}</code></Col>
                        <Col xs='6'><small className='text-muted d-block'>Inizio</small>{formatDate(run.started_at)}</Col>
                        <Col xs='6'><small className='text-muted d-block'>Fine</small>{formatDate(run.finished_at)}</Col>
                        <Col xs='6'><small className='text-muted d-block'>Durata</small>{formatDuration(run.duration_seconds)}</Col>
                        <Col xs='6'><small className='text-muted d-block'>Scope</small>{run.scope ?? '—'}</Col>
                        <Col xs='12'><small className='text-muted d-block'>Sorgenti</small>{run.sources?.join(', ') ?? '—'}</Col>
                      </Row>
                    </CardBody>
                  </Card>
                </Col>
                <Col md='6'>
                  <Card className='border'>
                    <CardBody>
                      <Row className='g-2'>
                        <Col xs='6'><small className='text-muted d-block'>File sorgente</small>{run.source_file_count ?? '—'}</Col>
                        <Col xs='6'><small className='text-muted d-block'>Record raw</small>{run.raw_record_count ?? '—'}</Col>
                        <Col xs='6'><small className='text-muted d-block'>Normalizzati</small>{run.normalized_record_count ?? '—'}</Col>
                        <Col xs='6'><small className='text-muted d-block'>Pubblicati</small><span className='text-success fw-semibold'>{run.published_record_count ?? '—'}</span></Col>
                        <Col xs='6'><small className='text-muted d-block'>Issue</small>{run.issue_count ?? '—'}</Col>
                        <Col xs='6'><small className='text-muted d-block'>Decisioni</small>{run.decision_count ?? '—'}</Col>
                        <Col xs='6'><small className='text-muted d-block'>Warning</small><span className={run.warning_count ? 'text-warning fw-semibold' : ''}>{run.warning_count ?? '—'}</span></Col>
                        <Col xs='6'><small className='text-muted d-block'>Errori</small><span className={run.error_count ? 'text-danger fw-semibold' : ''}>{run.error_count ?? '—'}</span></Col>
                      </Row>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            )
          })()}
    </>
  )
}

// ── Storico run ───────────────────────────────────────────────────────────────

function StoricoRunSection({ onSelectRun, onSelectDecisioni }: { onSelectRun: (run: SyncRun) => void; onSelectDecisioni: (run: SyncRun) => void }) {
  const [runs, setRuns] = useState<SyncRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    adminGeoSyncApi.runs()
      .then(setRuns)
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 404 || ae.status === 503) setNotAvailable(true)
        else setError(ae.message ?? 'Errore caricamento')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className='text-center py-5'><div className='loader' /></div>
  if (notAvailable) return <Alert color='warning'>API non ancora disponibile.</Alert>
  if (error) return <Alert color='danger'>{error}</Alert>
  if (runs.length === 0) return <p className='text-muted'>Nessun run nello storico.</p>

  return (
    <div className='table-responsive'>
      <table className='table table-hover'>
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Avvio</th>
            <th>Fine</th>
            <th>Scope</th>
            <th>Sorgenti</th>
            <th>Stato</th>
            <th>Issue</th>
            <th>Raw</th>
            <th>Pubblicati</th>
            <th>Warning</th>
            <th>Decisioni</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const badge = runStatusBadge(r.status)
            return (
              <tr key={r.id}>
                <td><code>#{r.id}</code></td>
                <td>{formatDate(r.started_at)}</td>
                <td>{formatDate(r.finished_at)}</td>
                <td>{r.scope ?? '—'}</td>
                <td>{r.sources?.join(', ') ?? '—'}</td>
                <td><Badge color={badge.color}>{badge.label}</Badge></td>
                <td>{r.issue_count ?? '—'}</td>
                <td>{r.raw_record_count ?? '—'}</td>
                <td>{r.published_record_count ?? '—'}</td>
                <td>{r.warning_count ?? '—'}</td>
                <td>{r.decision_count ?? '—'}</td>
                <td className='d-flex gap-2'>
                  <button className='btn btn-sm btn-outline-secondary d-flex align-items-center gap-1' onClick={() => onSelectRun(r)}>
                    <ExternalLink size={11} /> Issue
                  </button>
                  <button className='btn btn-sm btn-outline-primary d-flex align-items-center gap-1' onClick={() => onSelectDecisioni(r)}>
                    <ExternalLink size={11} /> Decisioni
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Issue qualità ─────────────────────────────────────────────────────────────

function IssueSection({ runId }: { runId: number | null }) {
  const [issues, setIssues] = useState<SyncIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)

  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterBlocking, setFilterBlocking] = useState(false)

  useEffect(() => {
    if (!runId) return
    setLoading(true); setError(null); setNotAvailable(false)
    adminGeoSyncApi.issues(runId)
      .then(setIssues)
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 404 || ae.status === 503) setNotAvailable(true)
        else setError(ae.message ?? 'Errore caricamento')
      })
      .finally(() => setLoading(false))
  }, [runId])

  if (!runId) return <p className='text-muted'>Seleziona un run dallo storico per vedere le issue.</p>
  if (loading) return <div className='text-center py-5'><div className='loader' /></div>
  if (notAvailable) return <Alert color='warning'>API non ancora disponibile.</Alert>
  if (error) return <Alert color='danger'>{error}</Alert>

  const filtered = issues.filter((iss) =>
    (!filterSeverity || iss.severity === filterSeverity) &&
    (!filterType || iss.issue_type === filterType) &&
    (!filterLevel || iss.entity_level === filterLevel) &&
    (!filterSource || iss.source_system === filterSource) &&
    (!filterBlocking || iss.is_blocking)
  )

  return (
    <>
      <Row className='g-2 mb-3'>
        <Col xs='6' md='2'>
          <Input type='select' bsSize='sm' value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value=''>Severità</option>
            <option value='critical'>Critico</option>
            <option value='error'>Errore</option>
            <option value='warning'>Warning</option>
            <option value='info'>Info</option>
          </Input>
        </Col>
        <Col xs='6' md='2'>
          <Input type='text' bsSize='sm' placeholder='Tipo issue' value={filterType} onChange={(e) => setFilterType(e.target.value)} />
        </Col>
        <Col xs='6' md='2'>
          <Input type='text' bsSize='sm' placeholder='Livello entità' value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} />
        </Col>
        <Col xs='6' md='2'>
          <Input type='text' bsSize='sm' placeholder='Sorgente' value={filterSource} onChange={(e) => setFilterSource(e.target.value)} />
        </Col>
        <Col xs='auto' className='d-flex align-items-center gap-2'>
          <Input type='checkbox' id='filter-blocking' checked={filterBlocking} onChange={(e) => setFilterBlocking(e.target.checked)} />
          <Label check for='filter-blocking' className='mb-0 small'>Solo bloccanti</Label>
        </Col>
      </Row>

      {filtered.length === 0
        ? <p className='text-muted'>Nessuna issue corrispondente ai filtri.</p>
        : (
          <div className='table-responsive'>
            <table className='table table-hover'>
              <thead>
                <tr>
                  <th>Severità</th>
                  <th>Tipo</th>
                  <th>Livello</th>
                  <th>Sorgente</th>
                  <th>Chiave sorgente</th>
                  <th>Messaggio</th>
                  <th>Bloccante</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((iss) => {
                  const sb = severityBadge(iss.severity)
                  const rowClass = iss.severity === 'critical' || iss.severity === 'error' ? 'table-danger'
                    : iss.severity === 'warning' ? 'table-warning' : ''
                  return (
                    <tr key={iss.id} className={rowClass}>
                      <td><Badge color={sb.color}>{sb.label}</Badge></td>
                      <td><code>{iss.issue_type ?? '—'}</code></td>
                      <td>{iss.entity_level ?? '—'}</td>
                      <td>{iss.source_system ?? '—'}</td>
                      <td><code>{iss.source_record_key ?? '—'}</code></td>
                      <td>{iss.message}</td>
                      <td>{iss.is_blocking ? <Badge color='danger'>Sì</Badge> : <span className='text-muted'>No</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
    </>
  )
}

// ── Decisioni ─────────────────────────────────────────────────────────────────

function DecisioniSection({ runId }: { runId: number | null }) {
  const [decisions, setDecisions] = useState<SyncDecision[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    if (!runId) return
    setLoading(true); setError(null); setNotAvailable(false)
    adminGeoSyncApi.decisions(runId)
      .then(setDecisions)
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 404 || ae.status === 503) setNotAvailable(true)
        else setError(ae.message ?? 'Errore caricamento')
      })
      .finally(() => setLoading(false))
  }, [runId])

  if (!runId) return <p className='text-muted'>Seleziona un run dallo storico per vedere le decisioni.</p>
  if (loading) return <div className='text-center py-5'><div className='loader' /></div>
  if (notAvailable) return <Alert color='warning'>API non ancora disponibile.</Alert>
  if (error) return <Alert color='danger'>{error}</Alert>
  if (decisions.length === 0) return <p className='text-muted'>Nessuna decisione di publish disponibile per questo run.</p>

  return (
    <div className='table-responsive'>
      <table className='table table-hover'>
        <thead>
          <tr>
            <th>Azione</th>
            <th>Livello entità</th>
            <th>Tabella target</th>
            <th>Record target</th>
            <th>Sorgente</th>
            <th>Chiave sorgente</th>
            <th>Motivo</th>
            <th>Eseguita</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => {
            const ab = actionBadge(d.action)
            return (
              <tr key={d.id}>
                <td><Badge color={ab.color}>{ab.label}</Badge></td>
                <td>{d.entity_level ?? '—'}</td>
                <td><code>{d.target_table ?? '—'}</code></td>
                <td>{d.target_record_id ?? '—'}</td>
                <td>{d.source_system ?? '—'}</td>
                <td><code>{d.source_record_key ?? '—'}</code></td>
                <td className='text-muted small'>{d.reason_code ?? '—'}</td>
                <td>{d.executed ? <Badge color='success'>Sì</Badge> : <Badge color='secondary'>No</Badge>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Pagina principale ─────────────────────────────────────────────────────────

type Tab = 'latest' | 'storico' | 'issue' | 'decisioni'

export default function GeografiaSyncPage() {
  const { hasPermission } = useAuth()
  const canRead    = hasPermission('geography_sync.read')
  const canRun     = hasPermission('geography_sync.run')
  const canPublish = hasPermission('geography_sync.publish')

  const [activeTab, setActiveTab] = useState<Tab>('latest')
  const [selectedRun, setSelectedRun] = useState<SyncRun | null>(null)

  // Modal avvia verifica
  const [avviaOpen, setAvviaOpen] = useState(false)
  const [avviaForm, setAvviaForm] = useState<SyncRunRequest>({ scope: '', source: '', dry_run: true })
  const [avviaMsg, setAvviaMsg] = useState<string | null>(null)
  const [avviaSaving, setAvviaSaving] = useState(false)

  // Modal pubblica
  const [publishRun, setPublishRun] = useState<SyncRun | null>(null)
  const [publishSaving, setPublishSaving] = useState(false)
  const [publishMsg, setPublishMsg] = useState<string | null>(null)

  const handleAvvia = async () => {
    setAvviaSaving(true); setAvviaMsg(null)
    try {
      const res = await adminGeoSyncApi.startRun(avviaForm)
      toast.success(res.message ?? 'Run avviato')
      setAvviaOpen(false)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setAvviaMsg(errorMessage(ae))
      else if (ae.status === 409) setAvviaMsg('Un run è già in esecuzione — attendere il completamento')
      else setAvviaMsg(ae.message ?? 'Errore avvio run')
    } finally { setAvviaSaving(false) }
  }

  const handlePublish = async () => {
    if (!publishRun) return
    setPublishSaving(true); setPublishMsg(null)
    try {
      const res = await adminGeoSyncApi.publish(publishRun.id)
      toast.success(res.message ?? 'Modifiche pubblicate')
      setPublishRun(null)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) {
        toast.error(errorMessage(ae))
        setPublishRun(null)
      } else if (ae.status === 409) {
        // Stato previsto: publish non ancora disponibile in questa fase
        setPublishMsg(ae.message ?? 'Pubblicazione automatica non ancora disponibile in questa fase.')
      } else {
        toast.error(ae.message ?? 'Errore pubblicazione')
        setPublishRun(null)
      }
    } finally { setPublishSaving(false) }
  }

  if (!canRead) {
    return (
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Sincronizzazione geografia</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Sincronizzazione geografia</li>
              </ol>
            </Col>
          </Row>
        </div>
        <Row><Col><Alert color='warning'>Permesso insufficiente — contatta l'amministratore per richiedere l'accesso.</Alert></Col></Row>
      </Container>
    )
  }

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Sincronizzazione geografia</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/anagrafiche/geografia'>Geografia</Link></li>
                <li className='breadcrumb-item active'>Sincronizzazione</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Row>
          <Col sm='12'>
            <Card>
              <CardHeader className='p-0'>
                <Nav tabs className='border-tab nav-primary px-3 pt-2'>
                  <NavItem>
                    <NavLink className={activeTab === 'latest' ? 'active' : ''} onClick={() => setActiveTab('latest')} style={{ cursor: 'pointer' }}>
                      Stato ultimo run
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink className={activeTab === 'storico' ? 'active' : ''} onClick={() => setActiveTab('storico')} style={{ cursor: 'pointer' }}>
                      Storico run
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === 'issue' ? 'active' : ''}
                      onClick={() => setActiveTab('issue')}
                      style={{ cursor: 'pointer' }}
                    >
                      Issue qualità{selectedRun && <Badge color='secondary' className='ms-1' style={{ fontSize: 10 }}>#{selectedRun.id}</Badge>}
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === 'decisioni' ? 'active' : ''}
                      onClick={() => setActiveTab('decisioni')}
                      style={{ cursor: 'pointer' }}
                    >
                      Decisioni{selectedRun && <Badge color='secondary' className='ms-1' style={{ fontSize: 10 }}>#{selectedRun.id}</Badge>}
                    </NavLink>
                  </NavItem>
                </Nav>
              </CardHeader>
              <CardBody>
                <TabContent activeTab={activeTab}>
                  <TabPane tabId='latest'>
                    {activeTab === 'latest' && (
                      <LatestRunSection
                        canRun={canRun}
                        canPublish={canPublish}
                        onAvviaClick={() => { setAvviaMsg(null); setAvviaOpen(true) }}
                        onPublishClick={(run) => { setPublishMsg(null); setPublishRun(run) }}
                        onOpenDetail={(run) => { setSelectedRun(run); setActiveTab('issue') }}
                      />
                    )}
                  </TabPane>
                  <TabPane tabId='storico'>
                    {activeTab === 'storico' && (
                      <StoricoRunSection
                        onSelectRun={(run) => {
                          setSelectedRun(run)
                          setActiveTab('issue')
                        }}
                        onSelectDecisioni={(run) => {
                          setSelectedRun(run)
                          setActiveTab('decisioni')
                        }}
                      />
                    )}
                  </TabPane>
                  <TabPane tabId='issue'>
                    {activeTab === 'issue' && <IssueSection runId={selectedRun?.id ?? null} />}
                  </TabPane>
                  <TabPane tabId='decisioni'>
                    {activeTab === 'decisioni' && <DecisioniSection runId={selectedRun?.id ?? null} />}
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal avvia verifica */}
      <Modal isOpen={avviaOpen} toggle={() => setAvviaOpen(false)}>
        <ModalHeader toggle={() => setAvviaOpen(false)}>Avvia verifica</ModalHeader>
        <ModalBody>
          {avviaMsg && <Alert color='danger'>{avviaMsg}</Alert>}
          <FormGroup>
            <Label>Scope</Label>
            <Input
              type='select'
              value={avviaForm.scope ?? ''}
              onChange={(e) => setAvviaForm((p) => ({ ...p, scope: e.target.value || null }))}
            >
              <option value=''>Tutti (default)</option>
              <option value='full'>full</option>
              <option value='italy_admin_seed'>italy_admin_seed</option>
              <option value='italy_admin_csv'>italy_admin_csv</option>
              <option value='history_only'>history_only</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Sorgente</Label>
            <Input
              type='select'
              value={avviaForm.source ?? ''}
              onChange={(e) => {
                const src = e.target.value || null
                setAvviaForm((p) => ({
                  ...p,
                  source: src,
                  scope: src === 'anpr_history' ? 'history_only' : p.scope,
                }))
              }}
            >
              <option value=''>Tutte (default)</option>
              <option value='geonames'>geonames</option>
              <option value='seed'>seed</option>
              <option value='istat'>istat</option>
              <option value='anpr_history'>Storico ANPR</option>
            </Input>
          </FormGroup>
          <FormGroup check>
            <Input
              type='checkbox'
              id='dry-run'
              checked={avviaForm.dry_run ?? true}
              onChange={(e) => setAvviaForm((p) => ({ ...p, dry_run: e.target.checked }))}
            />
            <Label check for='dry-run'>Dry run (solo simulazione, nessuna modifica)</Label>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleAvvia} disabled={avviaSaving}>
            {avviaSaving ? 'Avvio…' : 'Avvia'}
          </Button>
          <Button color='light' onClick={() => setAvviaOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal pubblica */}
      <Modal isOpen={!!publishRun} toggle={() => setPublishRun(null)}>
        <ModalHeader toggle={() => setPublishRun(null)}>Pubblica modifiche sicure</ModalHeader>
        <ModalBody>
          {publishMsg
            ? <Alert color='info'>{publishMsg}</Alert>
            : (
              <Alert color='warning'>
                Saranno pubblicate <strong>solo</strong> le decisioni non bloccate da issue critiche o errori.
                Le decisioni con issue bloccanti rimarranno in stato <em>non eseguita</em> fino a risoluzione manuale.
              </Alert>
            )}
          {!publishMsg && <p>Confermare la pubblicazione per il run <code>#{publishRun?.id}</code>?</p>}
        </ModalBody>
        <ModalFooter>
          {!publishMsg && (
            <Button color='success' onClick={handlePublish} disabled={publishSaving}>
              {publishSaving ? 'Pubblicazione…' : 'Pubblica'}
            </Button>
          )}
          <Button color='light' onClick={() => setPublishRun(null)}>
            {publishMsg ? 'Chiudi' : 'Annulla'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
