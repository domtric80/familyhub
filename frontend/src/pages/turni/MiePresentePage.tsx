import { useEffect, useState } from 'react'
import {
  Card, CardBody, CardHeader, Button, Alert,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Table,
} from 'reactstrap'
import { LogIn, LogOut, Coffee, Play, Info, AlertTriangle, Clock, MapPin } from 'react-feather'
import { toast } from 'react-toastify'
import { attendanceApi, timesheetApi, apiError } from '../../services/api'
import type { AttendanceEvent, TimesheetEntry, TimesheetEntryStatus } from '../../types'
import InfoDrawer from '../../components/common/InfoDrawer'

const EVENT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  clock_in: { label: 'Entrata', icon: <LogIn size={14} />, color: '#28a745' },
  clock_out: { label: 'Uscita', icon: <LogOut size={14} />, color: '#e74c3c' },
  break_start: { label: 'Inizio pausa', icon: <Coffee size={14} />, color: '#ff9f43' },
  break_end: { label: 'Fine pausa', icon: <Play size={14} />, color: '#7366ff' },
}

const STATUS_ENTRY: Record<TimesheetEntryStatus, { label: string; cls: string }> = {
  draft: { label: 'Bozza', cls: 'badge-light-secondary' },
  computed: { label: 'Calcolato', cls: 'badge-light-primary' },
  submitted: { label: 'Inviato', cls: 'badge-light-warning' },
  approved: { label: 'Approvato', cls: 'badge-light-success' },
  rejected: { label: 'Rifiutato', cls: 'badge-light-danger' },
  locked: { label: 'Bloccato', cls: 'badge-light-secondary' },
}

const ADJUSTMENT_LABELS: Record<string, string> = {
  manual_correction: 'Correzione manuale',
  break_correction: 'Correzione pausa',
  overtime_authorization: 'Straordinario autorizzato',
  absence_reconciliation: 'Riconciliazione assenza',
}

function fmtTime(value: string) {
  try { return new Date(value).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }
  catch { return value }
}

function fmtDate(value: string) {
  try { return new Date(value + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' }) }
  catch { return value }
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return '—'
  try { return new Date(value).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return value }
}

function minsToHM(min?: number | null) {
  if (min == null) return '—'
  const h = Math.floor(Math.abs(min) / 60)
  const m = Math.abs(min) % 60
  const sign = min < 0 ? '−' : ''
  return `${sign}${h}h ${m.toString().padStart(2, '0')}m`
}

function lastEventType(events: AttendanceEvent[]): string | null {
  if (!events.length) return null
  return [...events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)).at(-1)?.event_type ?? null
}

export default function MiePresentePage() {
  const [todayEvents, setTodayEvents] = useState<AttendanceEvent[]>([])
  const [entries, setEntries] = useState<TimesheetEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [clocking, setClocking] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [detail, setDetail] = useState<TimesheetEntry | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadAll = () => {
    setLoading(true)
    Promise.allSettled([
      attendanceApi.myToday(),
      timesheetApi.myEntries(),
    ]).then(([eventsResult, entriesResult]) => {
      if (eventsResult.status === 'fulfilled') setTodayEvents(eventsResult.value)
      if (entriesResult.status === 'fulfilled') setEntries(entriesResult.value)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const clock = async (eventType: 'clock_in' | 'clock_out' | 'break_start' | 'break_end') => {
    setClocking(true)
    try {
      await attendanceApi.clockEvent({ event_type: eventType })
      toast.success(EVENT_LABELS[eventType].label + ' registrata.')
      const [eventsResult, entriesResult] = await Promise.allSettled([attendanceApi.myToday(), timesheetApi.myEntries()])
      if (eventsResult.status === 'fulfilled') setTodayEvents(eventsResult.value)
      if (entriesResult.status === 'fulfilled') setEntries(entriesResult.value)
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore timbratura.')
    } finally {
      setClocking(false)
    }
  }

  const handleSubmit = async (entry: TimesheetEntry) => {
    setSubmitting(true)
    try {
      const updated = await timesheetApi.submit(entry.id)
      setEntries((prev) => prev.map((item) => item.id === entry.id ? updated : item))
      if (detail?.id === entry.id) setDetail(updated)
      toast.success('Entry inviata per approvazione.')
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore invio.')
    } finally {
      setSubmitting(false)
    }
  }

  const last = lastEventType(todayEvents)
  const canClockIn = !last || last === 'clock_out' || last === 'break_end'
  const canClockOut = last === 'clock_in' || last === 'break_end'
  const canBreakStart = last === 'clock_in'
  const canBreakEnd = last === 'break_start'
  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className='container-fluid py-3'>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Le mie presenze</h5>
        <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
          <Info size={13} /> Info
        </Button>
      </div>

      <Card className='mb-3' style={{ border: '2px solid #7366ff' }}>
        <CardBody>
          <div className='small text-muted mb-2 text-capitalize'>{today}</div>
          <div className='d-flex flex-wrap gap-2 mb-3'>
            <Button color='success' disabled={!canClockIn || clocking} className='d-flex align-items-center gap-2' onClick={() => clock('clock_in')}>
              <LogIn size={16} /> Timbra entrata
            </Button>
            <Button color='danger' disabled={!canClockOut || clocking} className='d-flex align-items-center gap-2' onClick={() => clock('clock_out')}>
              <LogOut size={16} /> Timbra uscita
            </Button>
            <Button color='warning' disabled={!canBreakStart || clocking} className='d-flex align-items-center gap-2' onClick={() => clock('break_start')}>
              <Coffee size={16} /> Inizia pausa
            </Button>
            <Button color='primary' outline disabled={!canBreakEnd || clocking} className='d-flex align-items-center gap-2' onClick={() => clock('break_end')}>
              <Play size={16} /> Termina pausa
            </Button>
          </div>

          {todayEvents.length === 0 ? (
            <div className='small text-muted'>Nessuna timbratura oggi.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...todayEvents].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)).map((event) => {
                const meta = EVENT_LABELS[event.event_type] ?? { label: event.event_type, icon: <Clock size={14} />, color: '#999' }
                return (
                  <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px', background: '#f8f9ff', borderRadius: 6, fontSize: 13, color: meta.color, fontWeight: 500 }}>
                    {meta.icon}
                    <span>{meta.label}</span>
                    <span className='ms-auto text-muted fw-normal'>{fmtTime(event.occurred_at)}</span>
                    <span className='text-muted fw-normal' style={{ fontSize: 11 }}>{event.source}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className='py-2 d-flex align-items-center gap-2'>
          <Clock size={16} style={{ color: '#7366ff' }} />
          <strong>Le mie entry timesheet</strong>
        </CardHeader>
        <CardBody className='p-0'>
          {loading ? (
            <div className='text-center py-4'><div className='loader' /></div>
          ) : entries.length === 0 ? (
            <div className='text-center py-5 text-muted small'>Nessuna entry per il periodo.</div>
          ) : (
            <Table hover responsive className='mb-0 table-sm'>
              <thead className='table-light'>
                <tr>
                  <th>Data</th>
                  <th>Turno</th>
                  <th className='text-center'>Pianificato</th>
                  <th className='text-center'>Lavorato</th>
                  <th className='text-center'>Δ</th>
                  <th className='text-center'>Anomalia</th>
                  <th className='text-center'>Stato</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const statusBadge = STATUS_ENTRY[entry.status]
                  return (
                    <tr key={entry.id}>
                      <td className='small'>{fmtDate(entry.work_date)}</td>
                      <td className='small'>{entry.shift_assignment?.shift_template?.name ?? '—'}</td>
                      <td className='text-center small'>{minsToHM(entry.planned_minutes)}</td>
                      <td className='text-center small'>{minsToHM(entry.worked_minutes)}</td>
                      <td className='text-center small' style={{ color: (entry.delta_minutes ?? 0) < 0 ? '#e74c3c' : '#28a745' }}>{minsToHM(entry.delta_minutes)}</td>
                      <td className='text-center'>
                        {entry.has_anomaly ? <span title={entry.anomaly_notes ?? 'Anomalia'}><AlertTriangle size={14} color='#ff9f43' /></span> : <span className='text-muted'>—</span>}
                      </td>
                      <td className='text-center'><span className={`badge ${statusBadge.cls}`}>{statusBadge.label}</span></td>
                      <td className='text-end'>
                        <Button size='sm' color='outline-primary' className='py-0 px-2 me-1' onClick={() => setDetail(entry)}>Dettaglio</Button>
                        {(entry.status === 'computed' || entry.status === 'draft' || entry.status === 'rejected') && (
                          <Button size='sm' color='primary' className='py-0 px-2' disabled={submitting} onClick={() => handleSubmit(entry)}>
                            Invia
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={!!detail} toggle={() => setDetail(null)} size='lg'>
        {detail && (
          <>
            <ModalHeader toggle={() => setDetail(null)}>
              Dettaglio — {fmtDate(detail.work_date)}
              <span className={`badge ${STATUS_ENTRY[detail.status].cls} ms-2`}>{STATUS_ENTRY[detail.status].label}</span>
            </ModalHeader>
            <ModalBody>
              <div className='fw-semibold small mb-1' style={{ color: '#7366ff' }}>Pianificato</div>
              <div className='p-2 rounded mb-3' style={{ background: '#f8f9ff', fontSize: 13 }}>
                <div><strong>Turno:</strong> {detail.shift_assignment?.shift_template?.name ?? '—'}</div>
                <div><strong>Orario teorico:</strong> {detail.planned_start ? fmtTime(detail.planned_start) : '—'} – {detail.planned_end ? fmtTime(detail.planned_end) : '—'}</div>
                <div><strong>Durata teorica:</strong> {minsToHM(detail.planned_minutes)}</div>
              </div>

              <div className='fw-semibold small mb-1' style={{ color: '#7366ff' }}>Consuntivo</div>
              <div className='p-2 rounded mb-3' style={{ background: '#f8f9ff', fontSize: 13 }}>
                <div><strong>Ore lavorate:</strong> {minsToHM(detail.worked_minutes)}</div>
                <div><strong>Ordinarie:</strong> {minsToHM(detail.ordinary_minutes)}</div>
                <div><strong>Straordinarie:</strong> {minsToHM(detail.overtime_minutes)}</div>
                <div><strong>Pausa:</strong> {minsToHM(detail.break_minutes)}</div>
                <div><strong>Scostamento:</strong> <span style={{ color: (detail.delta_minutes ?? 0) < 0 ? '#e74c3c' : '#28a745' }}>{minsToHM(detail.delta_minutes)}</span></div>
                {detail.has_anomaly && (
                  <Alert color='warning' className='mt-2 mb-0 py-1 small'>
                    <AlertTriangle size={13} className='me-1' /> {detail.anomaly_notes ?? 'Anomalia rilevata'}
                  </Alert>
                )}
              </div>

              {detail.attendance_events && detail.attendance_events.length > 0 && (
                <>
                  <div className='fw-semibold small mb-1' style={{ color: '#7366ff' }}>Presenze registrate</div>
                  <div className='mb-3' style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[...detail.attendance_events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)).map((event) => {
                      const meta = EVENT_LABELS[event.event_type] ?? { label: event.event_type, icon: null, color: '#999' }
                      const lat = event.geo_latitude ?? event.latitude
                      const lon = event.geo_longitude ?? event.longitude
                      const hasGeo = lat != null && lon != null
                      const osmUrl = hasGeo
                        ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`
                        : null
                      return (
                        <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, padding: '4px 8px', background: '#f4f5f7', borderRadius: 4 }}>
                          <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                          <span>{fmtTime(event.occurred_at)}</span>
                          <span className='text-muted'>{event.source}</span>
                          <span className='ms-auto d-flex align-items-center gap-1'>
                            {hasGeo ? (
                              <a href={osmUrl!} target='_blank' rel='noopener noreferrer'
                                className='d-flex align-items-center gap-1 text-success text-decoration-none'
                                style={{ fontSize: 10 }}>
                                <MapPin size={10} /> Posizione disponibile
                              </a>
                            ) : (
                              <span className='text-muted' style={{ fontSize: 10 }}>
                                <MapPin size={10} /> Posizione assente
                              </span>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {detail.adjustments && detail.adjustments.length > 0 && (
                <>
                  <div className='fw-semibold small mb-1' style={{ color: '#7366ff' }}>Rettifiche</div>
                  <Table size='sm' className='mb-0'>
                    <thead><tr><th>Tipo</th><th>Δ min</th><th>Motivo</th><th>Stato</th><th>Creata il</th><th>Revisione</th></tr></thead>
                    <tbody>
                      {detail.adjustments.map((adjustment) => (
                        <tr key={adjustment.id}>
                          <td className='small'>{ADJUSTMENT_LABELS[adjustment.adjustment_type] ?? adjustment.adjustment_type}</td>
                          <td className='small'>{adjustment.delta_minutes > 0 ? '+' : ''}{adjustment.delta_minutes}</td>
                          <td className='small'>{adjustment.reason}</td>
                          <td><span className='badge badge-light-secondary'>{adjustment.status}</span></td>
                          <td className='small'>{fmtDateTime(adjustment.created_at)}</td>
                          <td className='small'>
                            {adjustment.reviewed_at ? (
                              <>
                                <div>{fmtDateTime(adjustment.reviewed_at)}</div>
                                {adjustment.review_notes && <div className='text-muted'>{adjustment.review_notes}</div>}
                              </>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              {(detail.status === 'computed' || detail.status === 'draft' || detail.status === 'rejected') && (
                <Button color='primary' disabled={submitting} onClick={() => handleSubmit(detail)}>
                  {submitting ? 'Invio…' : 'Invia per approvazione'}
                </Button>
              )}
              <Button color='secondary' onClick={() => setDetail(null)}>Chiudi</Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Le mie presenze — Guida'>
        <p>Qui registri entrata, uscita e pausa e vedi le tue entry timesheet giornaliere.</p>
        <p>Il sistema confronta quanto pianificato con quanto lavorato e segnala eventuali anomalie.</p>
        <p className='text-muted small'>Quando la giornata è completa puoi inviare l&apos;entry al coordinatore per approvazione.</p>
      </InfoDrawer>
    </div>
  )
}
