import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, ChevronLeft, ChevronRight, Bell, CheckCircle, Clock } from 'react-feather'
import { toast } from 'react-toastify'
import {
  activityCalendarApi, activityReminderApi, facilityApi, minorApi, adminUserApi, apiError,
} from '../../services/api'
import type { Activity, Facility, Minor, MinorActivityReminder, MinorActivityReminderWrite } from '../../types'

function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}
function fmtTime(s?: string | null) {
  if (!s) return ''
  return new Date(s).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}
function isoDate(d: Date) {
  return d.toISOString().substring(0, 10)
}

const STATUS_COLOR: Record<string, string> = {
  planned: '#17a2b8', in_progress: '#ffc107',
  completed: '#28a745', cancelled: '#6c757d',
}
const STATUS_LABEL: Record<string, string> = {
  planned: 'Pianificata', in_progress: 'In corso',
  completed: 'Completata', cancelled: 'Annullata',
}

const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

function getDaysInMonth(year: number, month: number) {
  const days: Date[] = []
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  // padding days before first (monday=0)
  const startDow = (first.getDay() + 6) % 7
  for (let i = 0; i < startDow; i++) {
    days.push(new Date(year, month, -startDow + i + 1))
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  return days
}

export default function AttivitaCalendarioPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [minors, setMinors] = useState<Minor[]>([])
  const [facilityFilter, setFacilityFilter] = useState<number>(0)
  const [minorFilter, setMinorFilter] = useState<number>(0)

  // Dettaglio attività selezionata
  const [selected, setSelected] = useState<Activity | null>(null)
  const [reminders, setReminders] = useState<MinorActivityReminder[]>([])
  const [loadingReminders, setLoadingReminders] = useState(false)
  const [users, setUsers] = useState<{ id: number; full_name: string }[]>([])
  const [reminderForm, setReminderForm] = useState<MinorActivityReminderWrite>({ recipient_user_id: 0, remind_at: '' })
  const [reminderMsg, setReminderMsg] = useState<string | null>(null)
  const [savingReminder, setSavingReminder] = useState(false)

  const loadCalendar = (y = year, m = month, fid = facilityFilter, mid = minorFilter) => {
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    setLoading(true); setError(null)
    activityCalendarApi.list({
      date_from: isoDate(first),
      date_to: isoDate(last),
      ...(fid ? { facility_id: fid } : {}),
      ...(mid ? { minor_id: mid } : {}),
    }).then(setActivities)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento calendario'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    facilityApi.list().then(setFacilities).catch(() => {})
    minorApi.list().then((r) => setMinors(Array.isArray(r) ? r : (r as any).data ?? [])).catch(() => {})
    adminUserApi.list().then((users) => {
      setUsers(users.map((u: any) => ({
        id: u.id,
        full_name: `${u.first_name} ${u.last_name}`.trim(),
      })))
    }).catch(() => {})
    loadCalendar()
  }, []) // eslint-disable-line

  const prevMonth = () => {
    const nm = month === 0 ? 11 : month - 1
    const ny = month === 0 ? year - 1 : year
    setMonth(nm); setYear(ny); loadCalendar(ny, nm)
  }
  const nextMonth = () => {
    const nm = month === 11 ? 0 : month + 1
    const ny = month === 11 ? year + 1 : year
    setMonth(nm); setYear(ny); loadCalendar(ny, nm)
  }

  const openDetail = async (a: Activity) => {
    setSelected(a)
    setReminders([]); setReminderForm({ recipient_user_id: 0, remind_at: '' }); setReminderMsg(null)
    setLoadingReminders(true)
    activityReminderApi.list(a.id)
      .then(setReminders)
      .catch(() => {})
      .finally(() => setLoadingReminders(false))
  }

  const handleAddReminder = async () => {
    if (!selected) return
    if (!reminderForm.recipient_user_id) { setReminderMsg('Seleziona il destinatario.'); return }
    if (!reminderForm.remind_at) { setReminderMsg('Inserisci la data/ora promemoria.'); return }
    setSavingReminder(true); setReminderMsg(null)
    try {
      const r = await activityReminderApi.create(selected.id, reminderForm)
      setReminders((prev) => [...prev, r])
      setReminderForm({ recipient_user_id: 0, remind_at: '' })
      toast.success('Promemoria aggiunto.')
    } catch (e) {
      const ae = apiError(e)
      setReminderMsg(ae.message ?? 'Errore aggiunta promemoria.')
    } finally { setSavingReminder(false) }
  }

  const handleDeleteReminder = async (r: MinorActivityReminder) => {
    if (!selected) return
    try {
      await activityReminderApi.delete(selected.id, r.id)
      setReminders((prev) => prev.filter((x) => x.id !== r.id))
      toast.success('Promemoria rimosso.')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore rimozione.') }
  }

  const handleAcknowledgeReminder = async (r: MinorActivityReminder) => {
    if (!selected) return
    try {
      const updated = await activityReminderApi.acknowledge(selected.id, r.id)
      setReminders((prev) => prev.map((x) => x.id === updated.id ? updated : x))
      toast.success('Presa visione registrata.')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore presa visione.') }
  }

  // Raggruppa attività per giorno (YYYY-MM-DD)
  const byDay: Record<string, Activity[]> = {}
  activities.forEach((a) => {
    const day = (a.planned_start_at ?? '').substring(0, 10)
    if (day) {
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(a)
    }
  })

  const days = getDaysInMonth(year, month)
  const todayStr = isoDate(today)

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Calendario attività</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/attivita'>Attività</Link></li>
                <li className='breadcrumb-item active'>Calendario</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Card>
          <CardHeader>
            <div className='d-flex align-items-center justify-content-between flex-wrap gap-2'>
              <div className='d-flex align-items-center gap-2'>
                <Button color='light' size='sm' onClick={prevMonth}><ChevronLeft size={14} /></Button>
                <strong style={{ minWidth: 160, textAlign: 'center' }}>{MONTHS_IT[month]} {year}</strong>
                <Button color='light' size='sm' onClick={nextMonth}><ChevronRight size={14} /></Button>
              </div>
              <div className='d-flex gap-2 flex-wrap'>
                <Input type='select' bsSize='sm' style={{ width: 160 }} value={facilityFilter}
                  onChange={(e) => { const v = Number(e.target.value); setFacilityFilter(v); loadCalendar(year, month, v, minorFilter) }}>
                  <option value={0}>Tutte le strutture</option>
                  {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Input>
                <Input type='select' bsSize='sm' style={{ width: 160 }} value={minorFilter}
                  onChange={(e) => { const v = Number(e.target.value); setMinorFilter(v); loadCalendar(year, month, facilityFilter, v) }}>
                  <option value={0}>Tutti i minori</option>
                  {minors.map((m) => <option key={m.id} value={m.id}>{m.last_name} {m.first_name}</option>)}
                </Input>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 13 }}>
              Il calendario mostra solo le attività accessibili al tuo profilo. Usa i filtri per restringere la vista. Clicca un evento per il dettaglio e per aggiungere promemoria.
            </div>
            {error && <Alert color='danger'>{error}</Alert>}
            {loading && <div className='text-center py-4'><div className='loader' /></div>}
            {!loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, background: '#dee2e6' }}>
                {DAYS_IT.map((d) => (
                  <div key={d} style={{ background: '#f8f9fa', padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>{d}</div>
                ))}
                {days.map((day, i) => {
                  const dStr = isoDate(day)
                  const isCurrentMonth = day.getMonth() === month
                  const isToday = dStr === todayStr
                  const dayActivities = byDay[dStr] ?? []
                  const visible = dayActivities.slice(0, 3)
                  const extra = dayActivities.length - 3
                  return (
                    <div key={i} style={{
                      background: isToday ? '#e8f4fd' : '#fff',
                      minHeight: 90, padding: 4,
                      opacity: isCurrentMonth ? 1 : 0.4,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? '#0078d4' : '#495057', marginBottom: 2 }}>
                        {day.getDate()}
                      </div>
                      {visible.map((a) => (
                        <div key={a.id}
                          onClick={() => openDetail(a)}
                          title={`${fmtTime(a.planned_start_at)} ${a.title}`}
                          style={{
                            background: STATUS_COLOR[a.status] ?? '#6c757d',
                            color: '#fff', borderRadius: 3, padding: '1px 4px',
                            fontSize: 10, marginBottom: 2, cursor: 'pointer',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                          {fmtTime(a.planned_start_at)} {a.title}
                        </div>
                      ))}
                      {extra > 0 && <div style={{ fontSize: 10, color: '#6c757d' }}>+{extra} altro/i</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Modal dettaglio attività + promemoria */}
      <Modal isOpen={!!selected} toggle={() => setSelected(null)} size='lg'>
        <ModalHeader toggle={() => setSelected(null)}>
          {selected?.title}
          {selected && (
            <span className='ms-2 small' style={{ background: STATUS_COLOR[selected.status], color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
              {STATUS_LABEL[selected.status] ?? selected.status}
            </span>
          )}
        </ModalHeader>
        <ModalBody>
          {selected && (
            <>
              <table className='table table-sm table-borderless mb-3' style={{ maxWidth: 520 }}>
                <tbody>
                  <tr><td className='text-muted fw-semibold' style={{ width: 170 }}>Minore</td><td>{(selected as any).minor ? `${(selected as any).minor.last_name} ${(selected as any).minor.first_name}` : '—'}</td></tr>
                  <tr><td className='text-muted fw-semibold'>Inizio previsto</td><td>{fmtDt(selected.planned_start_at)}</td></tr>
                  <tr><td className='text-muted fw-semibold'>Fine prevista</td><td>{fmtDt(selected.planned_end_at)}</td></tr>
                  <tr><td className='text-muted fw-semibold'>Luogo</td><td>{(selected as any).location ?? '—'}</td></tr>
                  <tr><td className='text-muted fw-semibold'>Responsabile</td><td>{(selected as any).responsible_staff_member?.display_name ?? '—'}</td></tr>
                </tbody>
              </table>

              {/* Sezione promemoria */}
              <h6 className='fw-bold border-bottom pb-1 mb-3'>Promemoria</h6>
              <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 12 }}>
                Il destinatario riceve il promemoria solo se possiede accesso all'attività. Nessun testo dell'attività viene incluso nelle notifiche browser. La presa visione è idempotente.
              </div>

              {loadingReminders ? <div className='text-center py-2'><div className='loader' /></div> : (
                reminders.length === 0 ? <p className='text-muted small'>Nessun promemoria per questa attività.</p> : (
                  <div className='mb-3'>
                    {reminders.map((r) => (
                      <div key={r.id} className={`d-flex align-items-center justify-content-between border rounded px-3 py-2 mb-1 ${r.is_due && !r.acknowledged_at ? 'border-warning' : ''}`}>
                        <div>
                          <span className='small fw-semibold'>Utente #{r.recipient_user_id}</span>
                          <span className='ms-2 small text-muted'>{fmtDt(r.remind_at)}</span>
                          {r.acknowledged_at ? (
                            <span className='ms-2 badge badge-light-success'><CheckCircle size={10} /> Visto {fmtDt(r.acknowledged_at)}</span>
                          ) : r.is_due ? (
                            <span className='ms-2 badge badge-light-warning'><Clock size={10} /> Scaduto</span>
                          ) : null}
                        </div>
                        <div className='d-flex gap-1'>
                          {!r.acknowledged_at && (
                            <Button size='sm' color='light' onClick={() => handleAcknowledgeReminder(r)} title='Prendi visione'>
                              <CheckCircle size={12} />
                            </Button>
                          )}
                          {!r.acknowledged_at && (
                            <Button size='sm' color='light' onClick={() => handleDeleteReminder(r)} title='Elimina'>✕</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              <div className='border rounded p-3' style={{ background: '#f8f9fa' }}>
                <h6 className='mb-2 small fw-bold'>Aggiungi promemoria</h6>
                {reminderMsg && <Alert color='danger' className='py-1 px-2' style={{ fontSize: 12 }}>{reminderMsg}</Alert>}
                <Row>
                  <Col md='5'>
                    <FormGroup className='mb-2'>
                      <Label className='small'>Destinatario <span className='text-danger'>*</span></Label>
                      <Input type='select' bsSize='sm' value={reminderForm.recipient_user_id}
                        onChange={(e) => setReminderForm((f) => ({ ...f, recipient_user_id: Number(e.target.value) }))}>
                        <option value={0}>Seleziona utente…</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md='5'>
                    <FormGroup className='mb-2'>
                      <Label className='small'>Data/ora promemoria <span className='text-danger'>*</span></Label>
                      <Input type='datetime-local' bsSize='sm' value={reminderForm.remind_at}
                        max={selected.planned_start_at ? selected.planned_start_at.substring(0, 16) : undefined}
                        onChange={(e) => setReminderForm((f) => ({ ...f, remind_at: e.target.value }))} />
                      <small className='text-muted'>Deve essere prima dell'inizio dell'attività.</small>
                    </FormGroup>
                  </Col>
                  <Col md='2' className='d-flex align-items-end pb-2'>
                    <Button size='sm' color='primary' onClick={handleAddReminder} disabled={savingReminder}>
                      {savingReminder ? '…' : <Bell size={13} />}
                    </Button>
                  </Col>
                </Row>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color='light' onClick={() => setSelected(null)}>Chiudi</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
