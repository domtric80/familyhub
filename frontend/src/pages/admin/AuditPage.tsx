import { useEffect, useState, useCallback } from 'react'
import {
  Container, Row, Col, Card, CardHeader, CardBody,
  FormGroup, Label, Input, Button,
  Modal, ModalHeader, ModalBody, Badge,
} from 'reactstrap'
import { Home, Search, RefreshCw, Eye, Download, X, Info } from 'react-feather'
import InfoDrawer from '../../components/common/InfoDrawer'
import { adminAuditApi, facilityApi, adminUserApi, apiError } from '../../services/api'
import type { AuditLog, AuditLogFilters, AuditPreset, Facility, AdminUser } from '../../types'

export default function AuditPage() {
  const [infoOpen, setInfoOpen] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 50 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiMissing, setApiMissing] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [filters, setFilters] = useState<AuditLogFilters | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])

  // preset state
  const [presets, setPresets] = useState<AuditPreset[]>([])
  const [activePreset, setActivePreset] = useState<string>('')

  // filter params
  const [q, setQ] = useState('')
  const [facilityId, setFacilityId] = useState(0)
  const [minorId, setMinorId] = useState(0)
  const [actorUserId, setActorUserId] = useState(0)
  const [action, setAction] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [actionsFilter, setActionsFilter] = useState<string[]>([])
  const [resourceTypesFilter, setResourceTypesFilter] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const [detailLog, setDetailLog] = useState<AuditLog | null>(null)
  const [detailFresh, setDetailFresh] = useState<AuditLog | null>(null)
  const [detailRefreshing, setDetailRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)

  // load lookup data on mount
  useEffect(() => {
    facilityApi.list().then(setFacilities).catch(() => {})
    adminUserApi.list().then(setUsers).catch(() => {})
    adminAuditApi.filters()
      .then((f) => {
        setFilters(f)
        if (f.presets) setPresets(f.presets)
      })
      .catch((e) => {
        const err = apiError(e)
        if (err.status === 403) setForbidden(true)
        else if (err.status === 404) setApiMissing(true)
      })
  }, [])

  const applyPreset = (preset: AuditPreset) => {
    setActivePreset(preset.code)
    setQ(''); setFacilityId(0); setMinorId(0); setActorUserId(0)
    setAction(''); setResourceType('')
    setActionsFilter([]); setResourceTypesFilter([])
    setDateFrom(''); setDateTo('')
    if (preset.query?.date_from) setDateFrom(preset.query.date_from)
    if (preset.query?.date_to) setDateTo(preset.query.date_to)
    if (preset.actions) setActionsFilter(preset.actions)
    if (preset.resource_types) setResourceTypesFilter(preset.resource_types)
    setPage(1)
  }

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params: Record<string, unknown> = {
      q: q || undefined,
      facility_id: facilityId || undefined,
      minor_id: minorId || undefined,
      actor_user_id: actorUserId || undefined,
      action: action || undefined,
      resource_type: resourceType || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      per_page: 50,
      page,
    }
    if (actionsFilter.length > 0) params['actions[]'] = actionsFilter
    if (resourceTypesFilter.length > 0) params['resource_types[]'] = resourceTypesFilter

    adminAuditApi.list(params as Parameters<typeof adminAuditApi.list>[0])
      .then((res) => {
        setLogs(res.data)
        setPagination({
          current_page: res.current_page ?? 1,
          last_page: res.last_page ?? 1,
          total: res.total ?? res.data.length,
          per_page: res.per_page ?? res.data.length,
        })
      })
      .catch((e) => {
        const err = apiError(e)
        if (err.status === 403) {
          setForbidden(true)
        } else if (err.status === 404) {
          setApiMissing(true)
        } else {
          setError(err.message ?? 'Errore caricamento audit log')
        }
      })
      .finally(() => setLoading(false))
  }, [q, facilityId, minorId, actorUserId, action, resourceType, actionsFilter, resourceTypesFilter, dateFrom, dateTo, page])

  useEffect(() => { load() }, [load])

  const handleSearch = () => { setPage(1); load() }

  const handleReset = () => {
    setActivePreset('')
    setQ('')
    setFacilityId(0); setMinorId(0); setActorUserId(0)
    setAction(''); setResourceType('')
    setActionsFilter([]); setResourceTypesFilter([])
    setDateFrom(''); setDateTo('')
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await adminAuditApi.exportCsv({
        q: q || undefined,
        facility_id: facilityId || undefined,
        minor_id: minorId || undefined,
        actor_user_id: actorUserId || undefined,
        action: action || undefined,
        resource_type: resourceType || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(apiError(e).message ?? 'Errore export')
    } finally {
      setExporting(false)
    }
  }

  const openDetail = (log: AuditLog) => {
    setDetailLog(log)
    setDetailFresh(null)
  }

  const refreshDetail = async () => {
    if (!detailLog) return
    setDetailRefreshing(true)
    try {
      const fresh = await adminAuditApi.get(detailLog.id)
      setDetailFresh(fresh)
    } catch (e) {
      alert(apiError(e).message ?? 'Errore aggiornamento')
    } finally {
      setDetailRefreshing(false)
    }
  }

  const displayLog = detailFresh ?? detailLog

  return (
    <Container fluid className='p-4'>
      {/* Breadcrumb */}
      <div className='d-flex align-items-center gap-2 mb-4' style={{ fontSize: 13, color: '#8d8d8d' }}>
        <Home size={14} />
        <span>/</span>
        <span>Amministrazione</span>
        <span>/</span>
        <span style={{ color: '#7366ff', fontWeight: 500 }}>Audit log</span>
      </div>

      <div className='d-flex align-items-center gap-2 mb-4'>
        <h4 className='mb-0' style={{ color: '#3d3d3d' }}>Audit log</h4>
        <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
          <Info size={13} /> Informazioni
        </button>
      </div>

      {forbidden && (
        <div className='alert alert-danger mb-4' role='alert'>
          <strong>Permesso insufficiente:</strong> audit_logs.read — Non disponi del permesso necessario per consultare l&apos;audit log. Contatta un amministratore.
        </div>
      )}

      {apiMissing && (
        <div className='alert alert-warning mb-4'>
          Il modulo Audit non è ancora disponibile sul backend. La pagina sarà operativa non appena l'API sarà attiva.
        </div>
      )}

      {/* Filters + Table: nascosti se 403 */}
      {!forbidden && <>
      <Card className='mb-4'>
        <CardHeader className='d-flex align-items-center justify-content-between'>
          <h6 className='mb-0'>Filtri</h6>
          <Button size='sm' color='outline-secondary' onClick={handleExport} disabled={exporting}>
            <Download size={14} className='me-1' />
            {exporting ? 'Esportazione…' : 'Esporta CSV'}
          </Button>
        </CardHeader>
        <CardBody>
          {/* Preset pills */}
          {presets.length > 0 && (
            <div className='d-flex flex-wrap gap-2 mb-3'>
              <Button size='sm' color={activePreset === '' ? 'primary' : 'light'}
                onClick={() => { setActivePreset(''); setActionsFilter([]); setResourceTypesFilter([]) }}>
                Tutti
              </Button>
              {presets.map((p) => (
                <Button key={p.code} size='sm'
                  color={activePreset === p.code ? 'primary' : 'light'}
                  onClick={() => applyPreset(p)}>
                  {p.label}
                </Button>
              ))}
            </div>
          )}

          <Row>
            <Col md={3}>
              <FormGroup>
                <Label className='col-form-label'>Ricerca testo</Label>
                <Input
                  type='text'
                  placeholder='Cerca...'
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label className='col-form-label'>Struttura</Label>
                <Input type='select' value={facilityId || ''} onChange={(e) => setFacilityId(e.target.value === '' ? 0 : Number(e.target.value))}>
                  <option value=''>Tutte le strutture</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label className='col-form-label'>Utente</Label>
                <Input type='select' value={actorUserId || ''} onChange={(e) => setActorUserId(e.target.value === '' ? 0 : Number(e.target.value))}>
                  <option value=''>Tutti gli utenti</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label className='col-form-label'>Azione</Label>
                <Input type='select' value={action} onChange={(e) => setAction(e.target.value)}>
                  <option value=''>Tutte le azioni</option>
                  {(filters?.actions ?? []).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label className='col-form-label'>Tipo risorsa</Label>
                <Input type='select' value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                  <option value=''>Tutti i tipi</option>
                  {(filters?.resource_types ?? []).map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label className='col-form-label'>Data da</Label>
                <Input type='date' value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label className='col-form-label'>Data a</Label>
                <Input type='date' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </FormGroup>
            </Col>
            <Col md={3} className='d-flex align-items-end gap-2 pb-3'>
              <Button color='primary' onClick={handleSearch} disabled={loading}>
                <Search size={14} className='me-1' />
                Cerca
              </Button>
              <Button color='light' onClick={handleReset} disabled={loading}>
                <RefreshCw size={14} className='me-1' />
                Reset
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {error && <div className='alert alert-danger mb-4'>{error}</div>}

      {/* Table */}
      <Card>
        <CardHeader className='d-flex align-items-center justify-content-between'>
          <h6 className='mb-0'>Log ({pagination.total} voci)</h6>
          {loading && <span className='spinner-border spinner-border-sm text-primary' />}
        </CardHeader>
        <CardBody className='p-0'>
          <div className='table-responsive'>
            <table className='table table-hover mb-0'>
              <thead className='table-light'>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Data/Ora</th>
                  <th>IP</th>
                  <th>Utente</th>
                  <th>Ruolo</th>
                  <th>Operazione</th>
                  <th>Risorsa</th>
                  <th>Minore</th>
                  <th>Struttura</th>
                  <th style={{ width: 60 }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {!loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className='text-center py-5 text-muted'>
                      {apiMissing ? 'API non disponibile' : 'Nessun log trovato'}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                        {new Date(log.occurred_at_utc).toLocaleString('it-IT')}
                      </td>
                      <td style={{ fontSize: 12 }}>{log.ip_address ?? '—'}</td>
                      <td style={{ fontSize: 13 }}>{log.actor_display_name ?? '—'}</td>
                      <td style={{ fontSize: 12 }}>{log.actor_role_name ?? '—'}</td>
                      <td style={{ fontSize: 13 }}>{log.operation_summary ?? log.action ?? '—'}</td>
                      <td style={{ fontSize: 12 }}>
                        {log.resource_label
                          ? `${log.resource_type}: ${log.resource_label}`
                          : (log.resource_type ?? '—')}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {log.minor
                          ? (log.minor.public_display_name ?? log.minor.internal_code ?? 'â€”')
                          : '—'}
                      </td>
                      <td style={{ fontSize: 12 }}>{log.facility?.name ?? '—'}</td>
                      <td>
                        <button
                          className='btn btn-sm btn-light'
                          title='Dettaglio'
                          onClick={() => openDetail(log)}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className='d-flex align-items-center justify-content-center gap-3 mt-3'>
          <Button color='light' size='sm'
            disabled={pagination.current_page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}>
            ← Precedente
          </Button>
          <span style={{ fontSize: 13, color: '#555' }}>
            Pagina {pagination.current_page} di {pagination.last_page}
          </span>
          <Button color='light' size='sm'
            disabled={pagination.current_page >= pagination.last_page || loading}
            onClick={() => setPage((p) => p + 1)}>
            Successiva →
          </Button>
        </div>
      )}
      </>}

      {/* Detail Modal */}
      <Modal isOpen={detailLog !== null} toggle={() => { setDetailLog(null); setDetailFresh(null) }} size='lg'>
        <ModalHeader toggle={() => { setDetailLog(null); setDetailFresh(null) }}>
          Dettaglio evento audit
          <Button size='sm' color='link' className='ms-2' onClick={refreshDetail} disabled={detailRefreshing}>
            <RefreshCw size={13} />
            {detailRefreshing ? ' Caricamento…' : ' Aggiorna'}
          </Button>
        </ModalHeader>
        <ModalBody>
          {displayLog && (
            <div style={{ fontSize: 14 }}>
              <Row className='mb-2'>
                <Col sm={4} style={{ color: '#8d8d8d' }}>Data/Ora</Col>
                <Col sm={8}>{new Date(displayLog.occurred_at_utc).toLocaleString('it-IT')}</Col>
              </Row>
              <Row className='mb-2'>
                <Col sm={4} style={{ color: '#8d8d8d' }}>Utente</Col>
                <Col sm={8}>{displayLog.actor_display_name ?? '—'}</Col>
              </Row>
              <Row className='mb-2'>
                <Col sm={4} style={{ color: '#8d8d8d' }}>Ruolo</Col>
                <Col sm={8}>{displayLog.actor_role_name ?? '—'}</Col>
              </Row>
              <Row className='mb-2'>
                <Col sm={4} style={{ color: '#8d8d8d' }}>IP</Col>
                <Col sm={8}>{displayLog.ip_address ?? '—'}</Col>
              </Row>
              {displayLog.operation_summary && (
                <Row className='mb-2'>
                  <Col sm={4} style={{ color: '#8d8d8d' }}>Operazione</Col>
                  <Col sm={8} style={{ color: '#555', fontStyle: 'italic' }}>{displayLog.operation_summary}</Col>
                </Row>
              )}
              <Row className='mb-2'>
                <Col sm={4} style={{ color: '#8d8d8d' }}>Azione</Col>
                <Col sm={8}>
                  {displayLog.action
                    ? <Badge color='secondary' className='text-uppercase' style={{ fontSize: 11 }}>{displayLog.action}</Badge>
                    : '—'}
                </Col>
              </Row>
              <Row className='mb-2'>
                <Col sm={4} style={{ color: '#8d8d8d' }}>Tipo risorsa</Col>
                <Col sm={8}>{displayLog.resource_type ?? '—'}</Col>
              </Row>
              <Row className='mb-2'>
                <Col sm={4} style={{ color: '#8d8d8d' }}>Etichetta risorsa</Col>
                <Col sm={8}>{displayLog.resource_label ?? '—'}</Col>
              </Row>
              <Row className='mb-2'>
                <Col sm={4} style={{ color: '#8d8d8d' }}>ID risorsa</Col>
                <Col sm={8}>{displayLog.resource_id ?? '—'}</Col>
              </Row>
              {displayLog.minor && (
                <Row className='mb-2'>
                  <Col sm={4} style={{ color: '#8d8d8d' }}>Minore</Col>
                  <Col sm={8}>
                    {displayLog.minor.public_display_name ?? displayLog.minor.internal_code ?? 'â€”'}
                  </Col>
                </Row>
              )}
              {displayLog.facility && (
                <Row className='mb-2'>
                  <Col sm={4} style={{ color: '#8d8d8d' }}>Struttura</Col>
                  <Col sm={8}>{displayLog.facility.name}</Col>
                </Row>
              )}
              {/* Accompagnatori — visualizzazione strutturata per eventi minor_exit */}
              {displayLog.resource_type === 'minor_exit' && (() => {
                type AccEntry = { person_type?: string; display_name?: string; external_name?: string; staff_member_id?: number; minor_contact_id?: number }
                const oldAcc = (displayLog.old_values_json as Record<string, AccEntry[]> | null)?.accompaniers_before
                            ?? (displayLog.old_values_json as Record<string, AccEntry[]> | null)?.accompaniers
                const newAcc = (displayLog.new_values_json as Record<string, AccEntry[]> | null)?.accompaniers_after
                            ?? (displayLog.new_values_json as Record<string, AccEntry[]> | null)?.accompaniers
                if (!oldAcc && !newAcc) return null
                const renderList = (list: AccEntry[], color: string, label: string) => (
                  <div className='mb-2'>
                    <div style={{ fontWeight: 600, color, fontSize: 12, marginBottom: 2 }}>{label}</div>
                    {list.length === 0
                      ? <span className='text-muted' style={{ fontSize: 12 }}>Nessuno</span>
                      : (
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                          {list.map((a, i) => (
                            <li key={i}>
                              <span className='badge badge-light-secondary me-1' style={{ fontSize: 10 }}>
                                {a.person_type === 'staff_member' ? 'personale' : a.person_type === 'minor_contact' ? 'contatto' : 'esterno'}
                              </span>
                              {a.display_name ?? a.external_name ?? `ID ${a.staff_member_id ?? a.minor_contact_id ?? '?'}`}
                            </li>
                          ))}
                        </ul>
                      )
                    }
                  </div>
                )
                return (
                  <div className='mt-3 border rounded p-3' style={{ background: '#f9f9f9' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Accompagnatori</div>
                    {oldAcc && renderList(oldAcc, '#c0392b', 'Prima')}
                    {newAcc && renderList(newAcc, '#27ae60', 'Dopo')}
                  </div>
                )
              })()}

              {/* Prima / Dopo */}
              {displayLog.old_values_json && (
                <div className='mt-3'>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#c0392b' }}>Prima (old_values)</div>
                  <pre style={{
                    fontSize: 11, background: '#fff5f5', border: '1px solid #fdd',
                    borderRadius: 6, padding: '8px 12px', overflowX: 'auto', maxHeight: 300,
                  }}>
                    {JSON.stringify(displayLog.old_values_json, null, 2)}
                  </pre>
                </div>
              )}
              {displayLog.new_values_json && (
                <div className='mt-3'>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#27ae60' }}>Dopo (new_values)</div>
                  <pre style={{
                    fontSize: 11, background: '#f5fff8', border: '1px solid #dfd',
                    borderRadius: 6, padding: '8px 12px', overflowX: 'auto', maxHeight: 300,
                  }}>
                    {JSON.stringify(displayLog.new_values_json, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </ModalBody>
      </Modal>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Audit Log'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Scopo</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            L'<strong>Audit Log</strong> registra automaticamente ogni operazione significativa sul sistema:
            creazioni, modifiche, eliminazioni e accessi a dati sensibili. Non è modificabile dagli utenti.
          </p>
        </section>

        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Cosa viene tracciato</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            Ogni evento registra: l'utente che ha eseguito l'azione, l'entità coinvolta (minore, documento,
            assegnazione…), il tipo di operazione, i valori prima e dopo la modifica, e il timestamp.
          </p>
        </section>

        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Formato evento</h6>
          <table className='table table-sm table-bordered' style={{ fontSize: 13 }}>
            <thead className='table-light'>
              <tr><th>Campo</th><th>Contenuto</th></tr>
            </thead>
            <tbody>
              <tr><td>entity_type</td><td>Tipo di entità (minor, document, user…)</td></tr>
              <tr><td>action</td><td>Operazione: create, update, delete, view</td></tr>
              <tr><td>old_values</td><td>Stato prima della modifica</td></tr>
              <tr><td>new_values</td><td>Stato dopo la modifica</td></tr>
              <tr><td>performed_by</td><td>Utente che ha eseguito l'azione</td></tr>
            </tbody>
          </table>
        </section>

        <section className='mb-3'>
          <h6 className='fw-bold mb-2'>Audit generale vs storico minore</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            Questa pagina mostra il log globale di sistema. Lo storico specifico di un minore si trova
            nella tab <strong>Storico</strong> nella scheda del minore.
          </p>
        </section>
      </InfoDrawer>
    </Container>
  )
}
