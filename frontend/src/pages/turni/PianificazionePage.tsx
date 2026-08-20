import { useEffect, useState } from 'react'
import {
  Card, CardBody, Button, Badge,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input, Alert,
  Row, Col, Nav, NavItem, NavLink, TabContent, TabPane,
} from 'reactstrap'
import { ChevronLeft, ChevronRight, Plus, Trash2, Info, AlertTriangle, RefreshCw } from 'react-feather'
import { toast } from 'react-toastify'
import {
  shiftAssignmentsApi, shiftTemplatesApi, staffMemberApi, facilityApi,
  shiftEligibilityApi, apiError,
} from '../../services/api'
import type {
  StaffShiftWeekView, ShiftWeekBlock, StaffShiftTemplate,
  StaffShiftAssignmentWrite, ShiftAssignmentStatus, Facility,
  ShiftExceptionsResponse, ShiftExceptionItem, ShiftExceptionSeverity,
  FacilityShiftEligibility, StaffShiftEligibility,
} from '../../types'
import InfoDrawer from '../../components/common/InfoDrawer'

const STATUS_LABELS: Record<ShiftAssignmentStatus, string> = {
  planned: 'Pianificato',
  confirmed: 'Confermato',
  completed: 'Completato',
  cancelled: 'Annullato',
}

/** Lunedì della settimana che contiene `date` */
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number) {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + n)
  return nd
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function staffName(s?: { first_name: string; last_name: string; display_name?: string | null } | null) {
  if (!s) return '—'
  return s.display_name?.trim() || `${s.last_name} ${s.first_name}`
}

function coverageColor(block: ShiftWeekBlock): { bg: string; border: string; text: string } {
  if (block.assigned_count === 0 && block.minimum_staff_required > 0)
    return { bg: '#ffeaea', border: '#e74c3c', text: '#c0392b' }
  if (block.coverage_gap > 0)
    return { bg: '#fff8e1', border: '#ff9f43', text: '#b76e00' }
  return { bg: '#e8f8f0', border: '#28a745', text: '#1a7a33' }
}

const EMPTY_FORM: StaffShiftAssignmentWrite = {
  facility_id: 0,
  shift_template_id: 0,
  staff_member_id: 0,
  shift_date: '',
  status: 'planned',
  notes: '',
}

const SEVERITY_CLS: Record<ShiftExceptionSeverity, string> = {
  info:     'badge-light-info',
  warning:  'badge-light-warning',
  critical: 'badge-light-danger',
}
const SEVERITY_ORDER: Record<ShiftExceptionSeverity, number> = { critical: 0, warning: 1, info: 2 }
const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  planned_gap:        'Gap pianificato',
  actual_gap:         'Gap effettivo',
  timesheet_anomaly:  'Anomalia timesheet',
  active_substitution:'Sostituzione attiva',
}

function ScostamentiPanel({ facilityId }: { facilityId: number }) {
  const [exceptions, setExceptions] = useState<ShiftExceptionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10)
  })
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  const load = () => {
    if (!facilityId) return
    setLoading(true); setError(null)
    shiftAssignmentsApi.exceptions({ facility_id: facilityId, date_from: dateFrom, date_to: dateTo })
      .then(setExceptions)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento eccezioni'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [facilityId]) // eslint-disable-line react-hooks/exhaustive-deps

  const s = exceptions?.summary
  const items = (exceptions?.items ?? [])
    .filter((i: ShiftExceptionItem) => !filterSeverity || i.severity === filterSeverity)
    .filter((i: ShiftExceptionItem) => !filterType || i.type === filterType)
    .sort((a: ShiftExceptionItem, b: ShiftExceptionItem) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      (a.shift_date ?? '').localeCompare(b.shift_date ?? '')
    )

  return (
    <div>
      {/* KPI riepilogo */}
      {s && (
        <Row className='g-2 mb-3'>
          <Col sm='6' md='2'>
            <div className='card mb-0'><div className='card-body py-2 text-center'>
              <div className='small text-muted'>Totale</div>
              <div className='fw-bold h5 mb-0'>{s.items_total}</div>
            </div></div>
          </Col>
          <Col sm='6' md='2'>
            <div className='card mb-0'><div className='card-body py-2 text-center'>
              <div className='small text-muted'>Gap pianif.</div>
              <div className='fw-bold h5 mb-0' style={{ color: s.planned_gap_count > 0 ? '#ff9f43' : '#333' }}>{s.planned_gap_count}</div>
            </div></div>
          </Col>
          <Col sm='6' md='2'>
            <div className='card mb-0'><div className='card-body py-2 text-center'>
              <div className='small text-muted'>Gap effett.</div>
              <div className='fw-bold h5 mb-0' style={{ color: s.actual_gap_count > 0 ? '#e74c3c' : '#333' }}>{s.actual_gap_count}</div>
            </div></div>
          </Col>
          <Col sm='6' md='2'>
            <div className='card mb-0'><div className='card-body py-2 text-center'>
              <div className='small text-muted'>Anomalie</div>
              <div className='fw-bold h5 mb-0' style={{ color: s.timesheet_anomaly_count > 0 ? '#e74c3c' : '#333' }}>{s.timesheet_anomaly_count}</div>
            </div></div>
          </Col>
          <Col sm='6' md='2'>
            <div className='card mb-0'><div className='card-body py-2 text-center'>
              <div className='small text-muted'>Sostituzioni</div>
              <div className='fw-bold h5 mb-0'>{s.active_substitution_count}</div>
            </div></div>
          </Col>
        </Row>
      )}

      {/* Filtri */}
      <Row className='g-2 mb-3 align-items-end'>
        <Col md='3'>
          <label className='small fw-semibold'>Da</label>
          <Input type='date' bsSize='sm' value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </Col>
        <Col md='3'>
          <label className='small fw-semibold'>A</label>
          <Input type='date' bsSize='sm' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </Col>
        <Col md='2'>
          <label className='small fw-semibold'>Severità</label>
          <Input type='select' bsSize='sm' value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value=''>Tutte</option>
            <option value='critical'>Critica</option>
            <option value='warning'>Warning</option>
            <option value='info'>Info</option>
          </Input>
        </Col>
        <Col md='2'>
          <label className='small fw-semibold'>Tipo</label>
          <Input type='select' bsSize='sm' value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value=''>Tutti</option>
            <option value='planned_gap'>Gap pianificato</option>
            <option value='actual_gap'>Gap effettivo</option>
            <option value='timesheet_anomaly'>Anomalia</option>
            <option value='active_substitution'>Sostituzione</option>
          </Input>
        </Col>
        <Col md='2'>
          <Button size='sm' color='primary' className='d-flex align-items-center gap-1' onClick={load} disabled={loading}>
            <RefreshCw size={13} /> Aggiorna
          </Button>
        </Col>
      </Row>

      {error && <div className='alert alert-danger'>{error}</div>}
      {loading && <div className='text-center py-5'><div className='loader' /></div>}

      {!loading && items.length === 0 && (
        <div className='text-center py-5 text-muted'>
          <AlertTriangle size={32} className='mb-2' />
          <p>Nessuna eccezione trovata per il periodo selezionato.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className='table-responsive'>
          <table className='table table-hover mb-0'>
            <thead className='table-light'>
              <tr>
                <th style={{ width: 90 }}>Severità</th>
                <th>Data</th>
                <th>Turno</th>
                <th>Tipo</th>
                <th>Messaggio</th>
                <th>Copertura</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: ShiftExceptionItem, i: number) => (
                <tr key={i}>
                  <td>
                    <span className={`badge ${SEVERITY_CLS[item.severity]}`}>
                      {item.severity === 'critical' ? '🔴' : item.severity === 'warning' ? '🟡' : '🔵'} {item.severity}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {item.shift_date ? new Date(item.shift_date + 'T12:00:00').toLocaleDateString('it-IT') : '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>{item.shift_template?.name ?? '—'}</td>
                  <td>
                    <span className='badge badge-light-secondary' style={{ fontSize: 11 }}>
                      {EXCEPTION_TYPE_LABELS[item.type] ?? item.type}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{item.message}</td>
                  <td style={{ fontSize: 11 }}>
                    {item.coverage ? (
                      <div>
                        <div>Pianif.: {item.coverage.assigned_count}/{item.coverage.minimum_staff_required}</div>
                        {item.coverage.planned_gap > 0 && (
                          <div className='text-warning'>Gap pian.: −{item.coverage.planned_gap}</div>
                        )}
                        {item.coverage.actual_gap > 0 && (
                          <div className='text-danger'>Gap eff.: −{item.coverage.actual_gap}</div>
                        )}
                      </div>
                    ) : item.active_substitution ? (
                      <span className='badge badge-light-warning'>Sostituzione</span>
                    ) : '—'}
                    {item.anomaly_flags?.length > 0 && (
                      <div className='mt-1'>
                        {item.anomaly_flags.map((f) => (
                          <span key={f} className='badge badge-light-danger me-1' style={{ fontSize: 9 }}>{f}</span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function PianificazionePage() {
  const [activeTab, setActiveTab] = useState<'week' | 'exceptions'>('week')
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [facilityId, setFacilityId] = useState<number>(0)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [weekView, setWeekView]     = useState<StaffShiftWeekView | null>(null)
  const [loading, setLoading]       = useState(false)
  const [infoOpen, setInfoOpen]     = useState(false)
  const [eligibility, setEligibility] = useState<FacilityShiftEligibility | null>(null)

  // Modal nuova assegnazione
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState<StaffShiftAssignmentWrite>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formErr, setFormErr]     = useState<string | null>(null)
  const [templates, setTemplates] = useState<StaffShiftTemplate[]>([])
  const [staffMembers, setStaffMembers] = useState<{ id: number; first_name: string; last_name: string; display_name?: string | null }[]>([])

  useEffect(() => {
    facilityApi.list().then((list) => {
      setFacilities(list)
      if (list.length > 0 && !facilityId) setFacilityId(list[0].id)
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadWeek = () => {
    if (!facilityId) return
    setLoading(true)
    shiftAssignmentsApi.weekView({ facility_id: facilityId, week_start: toISO(weekStart) })
      .then(setWeekView)
      .catch(() => toast.error('Errore caricamento pianificazione'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadWeek() }, [facilityId, weekStart]) // eslint-disable-line react-hooks/exhaustive-deps

  // Idoneità personale (advisory — handoff 190)
  useEffect(() => {
    if (!facilityId) { setEligibility(null); return }
    shiftEligibilityApi.get(facilityId)
      .then(setEligibility)
      .catch(() => setEligibility(null)) // permesso staff_shift_assignments.read non garantito
  }, [facilityId]) // eslint-disable-line react-hooks/exhaustive-deps

  const getEligibility = (staffMemberId?: number | null): StaffShiftEligibility | undefined => {
    if (!staffMemberId || !eligibility) return undefined
    return eligibility.staff.find((s) => s.staff_member_id === staffMemberId)
  }

  const prevWeek = () => setWeekStart((d) => addDays(d, -7))
  const nextWeek = () => setWeekStart((d) => addDays(d, 7))
  const goToday  = () => setWeekStart(getMonday(new Date()))

  const setF = (k: keyof StaffShiftAssignmentWrite, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const openCreate = async (date: string, template?: StaffShiftTemplate) => {
    setFormErr(null)
    setForm({
      ...EMPTY_FORM,
      facility_id: facilityId,
      shift_date: date,
      shift_template_id: template?.id ?? 0,
      status: 'planned',
    })
    // Carica template e staff se non già caricati
    if (templates.length === 0 || templates[0]?.facility_id !== facilityId) {
      shiftTemplatesApi.list({ facility_id: facilityId, is_active: true }).then(setTemplates).catch(() => {})
    }
    if (staffMembers.length === 0) {
      staffMemberApi.list({ facility_id: facilityId }).then(setStaffMembers).catch(() => {})
    }
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.shift_template_id) { setFormErr('Seleziona il modello turno.'); return }
    if (!form.staff_member_id)   { setFormErr('Seleziona l\'operatore.'); return }
    if (!form.shift_date)        { setFormErr('Data obbligatoria.'); return }

    setSaving(true); setFormErr(null)
    try {
      await shiftAssignmentsApi.create(form)
      toast.success('Assegnazione creata.')
      setModal(false)
      loadWeek()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 422) setFormErr('Turno sovrapposto o dati non validi. Verificare le sovrapposizioni.')
      else setFormErr(ae.message ?? 'Errore durante il salvataggio.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (assignmentId: number) => {
    if (!confirm('Rimuovere questa assegnazione?')) return
    try {
      await shiftAssignmentsApi.delete(assignmentId)
      toast.success('Assegnazione rimossa.')
      loadWeek()
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore durante l\'eliminazione.')
    }
  }

  const weekLabel = weekView
    ? `${new Date(weekView.week_start).toLocaleDateString('it-IT')} – ${new Date(weekView.week_end).toLocaleDateString('it-IT')}`
    : `${weekStart.toLocaleDateString('it-IT')} – ${addDays(weekStart, 6).toLocaleDateString('it-IT')}`

  return (
    <div className='container-fluid py-3'>
      {/* Intestazione */}
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Pianificazione</h5>
        <div className='d-flex gap-2'>
          <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1'
            onClick={() => setInfoOpen(true)}>
            <Info size={13} /> Info
          </Button>
        </div>
      </div>

      {/* Tab navigazione */}
      <Nav tabs className='mb-3'>
        <NavItem>
          <NavLink active={activeTab === 'week'} onClick={() => setActiveTab('week')} style={{ cursor: 'pointer' }}>
            Vista settimanale
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink active={activeTab === 'exceptions'} onClick={() => setActiveTab('exceptions')} style={{ cursor: 'pointer' }}>
            Scostamenti e anomalie
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={activeTab}>
      {/* ── Tab: Vista settimanale ── */}
      <TabPane tabId='week'>

      {/* Controlli */}
      <Card className='mb-3'>
        <CardBody className='py-2'>
          <Row className='g-2 align-items-center'>
            <Col md='3'>
              <Input type='select' bsSize='sm' value={facilityId}
                onChange={(e) => setFacilityId(Number(e.target.value))}>
                <option value='0'>Seleziona struttura…</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Input>
            </Col>
            <Col md='auto' className='ms-auto d-flex gap-2 align-items-center'>
              <Button size='sm' color='outline-secondary' onClick={prevWeek}><ChevronLeft size={14} /></Button>
              <span className='small fw-semibold px-2'>{weekLabel}</span>
              <Button size='sm' color='outline-secondary' onClick={nextWeek}><ChevronRight size={14} /></Button>
              <Button size='sm' color='outline-primary' onClick={goToday}>Oggi</Button>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Box idoneità consultivo */}
      {eligibility && eligibility.staff.some((s) => s.requires_attention) && (
        <Alert color='warning' className='py-2 px-3 mb-3 d-flex gap-2 align-items-start' style={{ fontSize: 13 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Controllo idoneità personale (consultivo):</strong>{' '}
            {eligibility.staff.filter((s) => s.requires_attention).length} operatore/i richiedono attenzione.
            Il controllo è consultivo: valuta documenti e certificazioni ma non blocca i turni.
            I badge <span className='badge bg-warning text-dark mx-1' style={{ fontSize: 10 }}>⚠ Attenzione</span> indicano le situazioni da verificare.
          </span>
        </Alert>
      )}

      {/* Legenda copertura */}
      <div className='d-flex gap-3 mb-3 small'>
        <span><span className='badge' style={{ background: '#e8f8f0', color: '#1a7a33' }}>● Coperto</span></span>
        <span><span className='badge' style={{ background: '#fff8e1', color: '#b76e00' }}>● Parziale</span></span>
        <span><span className='badge' style={{ background: '#ffeaea', color: '#c0392b' }}>● Scoperto</span></span>
      </div>

      {/* Griglia settimanale */}
      {!facilityId ? (
        <Card><CardBody className='text-center py-5 text-muted'>Seleziona una struttura per visualizzare la pianificazione.</CardBody></Card>
      ) : loading ? (
        <div className='text-center py-5'><div className='loader' /></div>
      ) : !weekView || weekView.days.length === 0 ? (
        <Card><CardBody className='text-center py-5 text-muted'>
          <AlertTriangle size={32} className='mb-2' />
          <p>Nessun dato per questa settimana. Configura prima i modelli turno.</p>
        </CardBody></Card>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weekView.days.length}, 1fr)`, gap: 8, minWidth: 700 }}>
            {/* Intestazioni giorni */}
            {weekView.days.map((day, idx) => {
              const d = new Date(day.date)
              const isToday = day.date === toISO(new Date())
              return (
                <div key={day.date} style={{
                  textAlign: 'center', padding: '6px 4px',
                  background: isToday ? '#7366ff' : '#f4f5f7',
                  color: isToday ? '#fff' : '#333',
                  borderRadius: 6, fontWeight: 600, fontSize: 13,
                }}>
                  <div>{DAY_NAMES[idx]}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</div>
                </div>
              )
            })}

            {/* Blocchi turno per giorno */}
            {weekView.days.map((day) => (
              <div key={day.date} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {day.shifts.map((block) => {
                  const colors = coverageColor(block)
                  return (
                    <div key={block.shift_template.id} style={{
                      background: colors.bg, border: `1.5px solid ${colors.border}`,
                      borderRadius: 6, padding: '8px 10px',
                    }}>
                      {/* Header blocco */}
                      <div className='d-flex justify-content-between align-items-start mb-1'>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: colors.text }}>
                            {block.shift_template.name}
                          </div>
                          <div style={{ fontSize: 10, color: '#666' }}>
                            {block.shift_template.start_time} – {block.shift_template.end_time}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Badge style={{ background: colors.border, fontSize: 9 }}>
                            {block.assigned_count}/{block.minimum_staff_required}
                          </Badge>
                          {block.coverage_gap > 0 && (
                            <div style={{ fontSize: 9, color: colors.text, marginTop: 2 }}>
                              −{block.coverage_gap}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Operatori assegnati */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {block.assignments.map((a) => (
                          <div key={a.id} style={{
                            background: a.has_active_substitution ? '#fff8e1' : 'rgba(255,255,255,0.7)',
                            borderRadius: 4, padding: '3px 6px', fontSize: 11,
                            border: a.has_active_substitution ? '1px solid #ff9f43' : 'none',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                {/* Operatore pianificato */}
                                <span style={{ color: a.has_active_substitution ? '#888' : 'inherit' }}>
                                  {staffName(a.staff_member)}
                                </span>
                                {/* Badge idoneità consultivo */}
                                {getEligibility(a.staff_member?.id)?.requires_attention && (
                                  <span
                                    className='badge bg-warning text-dark ms-1'
                                    style={{ fontSize: 9, cursor: 'help' }}
                                    title={getEligibility(a.staff_member?.id)?.alerts.map((al) => al.message).join('\n') || 'Richiede attenzione'}
                                  >
                                    ⚠ Attenzione
                                  </span>
                                )}
                                {/* Operatore effettivo (sostituto) */}
                                {a.has_active_substitution && a.effective_staff_member && (
                                  <div style={{ color: '#b76e00', fontWeight: 600 }}>
                                    ↳ {staffName(a.effective_staff_member)}
                                    <span className='badge badge-light-warning ms-1' style={{ fontSize: 9 }}>Sostituito</span>
                                  </div>
                                )}
                                {/* Anomalia */}
                                {a.actual?.has_anomaly && (
                                  <span className='badge badge-light-danger ms-1' style={{ fontSize: 9 }}>
                                    <AlertTriangle size={8} /> Anomalia
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDelete(a.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#e74c3c' }}
                                title='Rimuovi assegnazione'
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Aggiungi operatore */}
                      <button
                        onClick={() => openCreate(day.date, block.shift_template)}
                        style={{
                          marginTop: 6, width: '100%', background: 'rgba(255,255,255,0.5)',
                          border: `1px dashed ${colors.border}`, borderRadius: 4,
                          cursor: 'pointer', padding: '3px', fontSize: 10, color: colors.text,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                        }}
                      >
                        <Plus size={10} /> Aggiungi
                      </button>
                    </div>
                  )
                })}

                {/* Aggiungi turno personalizzato al giorno */}
                {day.shifts.length === 0 && (
                  <div style={{
                    border: '1.5px dashed #ccc', borderRadius: 6, padding: 8,
                    textAlign: 'center', fontSize: 11, color: '#999',
                  }}>
                    <button onClick={() => openCreate(day.date)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7366ff', fontSize: 11 }}>
                      <Plus size={11} /> Assegna turno
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      </TabPane>

      {/* ── Tab: Scostamenti e anomalie ── */}
      <TabPane tabId='exceptions'>
        <Card className='mb-3'>
          <CardBody className='py-2'>
            <Row className='g-2 align-items-center'>
              <Col md='3'>
                <Input type='select' bsSize='sm' value={facilityId}
                  onChange={(e) => setFacilityId(Number(e.target.value))}>
                  <option value='0'>Seleziona struttura…</option>
                  {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Input>
              </Col>
            </Row>
          </CardBody>
        </Card>
        {!facilityId
          ? <div className='alert alert-light text-center'>Seleziona una struttura per visualizzare gli scostamenti.</div>
          : <ScostamentiPanel facilityId={facilityId} />
        }
      </TabPane>
      </TabContent>

      {/* Modal nuova assegnazione */}
      <Modal isOpen={modal} toggle={() => setModal(false)}>
        <ModalHeader toggle={() => setModal(false)}>Nuova assegnazione turno</ModalHeader>
        <ModalBody>
          {formErr && <Alert color='warning'>{formErr}</Alert>}
          <Form>
            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label>Data</Label>
                  <Input type='date' value={form.shift_date}
                    onChange={(e) => setF('shift_date', e.target.value)} />
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label>Stato</Label>
                  <Input type='select' value={form.status}
                    onChange={(e) => setF('status', e.target.value as ShiftAssignmentStatus)}>
                    {(Object.entries(STATUS_LABELS) as [ShiftAssignmentStatus, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label>Modello turno *</Label>
              <Input type='select' value={form.shift_template_id}
                onChange={(e) => setF('shift_template_id', Number(e.target.value))}>
                <option value='0'>Seleziona turno…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.start_time}–{t.end_time})</option>
                ))}
              </Input>
            </FormGroup>
            <FormGroup>
              <Label>Operatore *</Label>
              <Input type='select' value={form.staff_member_id}
                onChange={(e) => setF('staff_member_id', Number(e.target.value))}>
                <option value='0'>Seleziona operatore…</option>
                {staffMembers.map((s) => {
                  const elig = getEligibility(s.id)
                  const attention = elig?.requires_attention ?? false
                  return (
                    <option key={s.id} value={s.id}>
                      {attention ? '⚠ ' : ''}{staffName(s)}
                    </option>
                  )
                })}
              </Input>
              {form.staff_member_id > 0 && getEligibility(form.staff_member_id)?.requires_attention && (
                <div className='mt-1'>
                  {getEligibility(form.staff_member_id)!.alerts.map((al, i) => (
                    <div key={i} className='d-flex align-items-start gap-1' style={{ fontSize: 12, color: '#856404' }}>
                      <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{al.message}</span>
                    </div>
                  ))}
                  <small className='text-muted'>Il controllo è consultivo — l'assegnazione è comunque possibile.</small>
                </div>
              )}
            </FormGroup>
            <FormGroup>
              <Label>Note</Label>
              <Input type='textarea' rows={2} value={form.notes ?? ''}
                onChange={(e) => setF('notes', e.target.value || null)} />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Assegna'}
          </Button>
          <Button color='secondary' onClick={() => setModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Pianificazione — Guida'>
        <p>La <strong>pianificazione settimanale</strong> mostra la copertura operativa della struttura giorno per giorno.</p>
        <p>Ogni blocco rappresenta un turno configurato nei modelli. Il contatore <code>assegnati/minimo</code> indica lo stato di copertura:</p>
        <ul>
          <li style={{ color: '#1a7a33' }}>Verde — copertura completa</li>
          <li style={{ color: '#b76e00' }}>Giallo — copertura parziale</li>
          <li style={{ color: '#c0392b' }}>Rosso — turno scoperto</li>
        </ul>
        <p>Clicca <strong>Aggiungi</strong> su un blocco per assegnare un operatore a quel turno e giorno specifico. Il sistema blocca la sovrapposizione di turni sullo stesso operatore.</p>
        <p className='text-muted small'>I modelli turno si configurano in Turni → Modelli turno.</p>
      </InfoDrawer>
    </div>
  )
}
