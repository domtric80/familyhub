import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, Button, Row, Col, Input } from 'reactstrap'
import { ChevronLeft, ChevronRight, AlertTriangle, Info } from 'react-feather'
import { shiftAssignmentsApi, facilityApi, apiError } from '../../services/api'
import type { StaffShiftMonthView, ShiftMonthDay, ShiftWeekBlock, Facility } from '../../types'
import InfoDrawer from '../../components/common/InfoDrawer'

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

const DAY_NAMES_SHORT = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do']

/** Colore giorno in base a copertura effettiva */
function dayStatusColor(day: ShiftMonthDay): { bg: string; border: string; text: string } {
  const s = day.summary
  if (!s) return { bg: '#f8f9ff', border: '#ddd', text: '#333' }
  if (s.actual_coverage_gap_total > 0 || s.anomaly_count > 0)
    return { bg: '#fff5f5', border: '#e74c3c', text: '#c0392b' }
  if (s.coverage_gap_total > 0)
    return { bg: '#fff8e1', border: '#ff9f43', text: '#b76e00' }
  return { bg: '#f0fff8', border: '#28a745', text: '#1a7a33' }
}

function staffName(s?: { first_name: string; last_name: string; display_name?: string | null } | null) {
  if (!s) return '—'
  return s.display_name?.trim() || `${s.last_name} ${s.first_name}`
}

function fmtMin(min?: number | null) {
  if (min == null) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h${m > 0 ? ` ${m}m` : ''}`
}

/** Mostra dettaglio turni di un giorno in drawer/panel laterale */
function DayDetailPanel({ day, onClose }: { day: ShiftMonthDay; onClose: () => void }) {
  const dateLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 360,
      background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      zIndex: 1050, overflowY: 'auto', padding: 20,
    }}>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <strong style={{ textTransform: 'capitalize' }}>{dateLabel}</strong>
        <button className='btn btn-sm btn-light' onClick={onClose}>✕</button>
      </div>

      {day.summary && (
        <div className='mb-3 p-2 rounded' style={{ background: '#f8f9ff', fontSize: 12 }}>
          <div className='d-flex justify-content-between'>
            <span className='text-muted'>Pianificati:</span>
            <span>{day.summary.assigned_count_total}/{day.summary.minimum_staff_required_total}</span>
          </div>
          <div className='d-flex justify-content-between'>
            <span className='text-muted'>Completati:</span>
            <span>{day.summary.actual_completed_count_total}</span>
          </div>
          {day.summary.coverage_gap_total > 0 && (
            <div className='d-flex justify-content-between text-warning'>
              <span>Gap pianificato:</span><span>−{day.summary.coverage_gap_total}</span>
            </div>
          )}
          {day.summary.actual_coverage_gap_total > 0 && (
            <div className='d-flex justify-content-between text-danger'>
              <span>Gap effettivo:</span><span>−{day.summary.actual_coverage_gap_total}</span>
            </div>
          )}
          {day.summary.anomaly_count > 0 && (
            <div className='d-flex justify-content-between text-danger'>
              <span>Anomalie:</span><span>{day.summary.anomaly_count}</span>
            </div>
          )}
        </div>
      )}

      {day.shifts.map((block: ShiftWeekBlock) => (
        <div key={block.shift_template.id} className='mb-3 border rounded p-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <strong style={{ fontSize: 13 }}>{block.shift_template.name}</strong>
            <span className='badge badge-light-secondary' style={{ fontSize: 10 }}>
              {block.assigned_count}/{block.minimum_staff_required}
            </span>
          </div>
          {block.assignments.length === 0
            ? <div className='small text-muted'>Nessun operatore assegnato.</div>
            : block.assignments.map((a) => (
              <div key={a.id} className='d-flex justify-content-between align-items-center mb-1'
                style={{ background: '#f8f9ff', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}>
                <div>
                  <div className='fw-semibold'>{staffName(a.effective_staff_member ?? a.staff_member)}</div>
                  {a.has_active_substitution && (
                    <div style={{ fontSize: 10, color: '#ff9f43' }}>
                      Sostituto di {staffName(a.staff_member)}
                    </div>
                  )}
                </div>
                <div className='d-flex flex-column align-items-end gap-1'>
                  {a.operational
                    ? <span className='badge badge-light-secondary' style={{ fontSize: 9 }}>{a.operational.label}</span>
                    : <span className='badge badge-light-secondary' style={{ fontSize: 9 }}>{a.status}</span>
                  }
                  {a.actual?.has_anomaly && (
                    <span className='badge badge-light-danger' style={{ fontSize: 9 }}>
                      <AlertTriangle size={8} /> Anomalia
                    </span>
                  )}
                </div>
              </div>
            ))
          }
          {/* Effettivo vs pianificato */}
          <div className='mt-1' style={{ fontSize: 11, color: '#888' }}>
            Completati effettivi: {block.actual_completed_count ?? '—'}/{block.minimum_staff_required}
            {(block.actual_coverage_gap ?? 0) > 0 && (
              <span className='text-danger ms-1'>(gap eff. −{block.actual_coverage_gap})</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CalendarioMensileStrutturePage() {
  const today = new Date()
  const [year, setYear]           = useState(today.getFullYear())
  const [month, setMonth]         = useState(today.getMonth() + 1)
  const [facilityId, setFacilityId] = useState<number>(0)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [monthView, setMonthView] = useState<StaffShiftMonthView | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<ShiftMonthDay | null>(null)
  const [infoOpen, setInfoOpen]   = useState(false)

  useEffect(() => {
    facilityApi.list().then((list) => {
      setFacilities(list)
      if (list.length > 0 && !facilityId) setFacilityId(list[0].id)
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const load = () => {
    if (!facilityId) return
    setLoading(true)
    setError(null)
    shiftAssignmentsApi.monthView({ facility_id: facilityId, year, month })
      .then(setMonthView)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento calendario'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [facilityId, year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  /** Costruisce griglia 6×7 con celle vuote per i giorni fuori dal mese */
  function buildGrid(days: ShiftMonthDay[]): (ShiftMonthDay | null)[] {
    if (days.length === 0) return []
    const firstDate = new Date(days[0].date + 'T12:00:00')
    // iso weekday: 1=Mon, 7=Sun → offset 0-based (Mon=0)
    const firstDow = (firstDate.getDay() + 6) % 7
    const grid: (ShiftMonthDay | null)[] = Array(firstDow).fill(null)
    for (const d of days) grid.push(d)
    while (grid.length % 7 !== 0) grid.push(null)
    return grid
  }

  const s = monthView?.summary
  const grid = monthView ? buildGrid(monthView.days) : []

  return (
    <div className='container-fluid py-3'>
      {/* Header */}
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Calendario mensile</h5>
        <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1'
          onClick={() => setInfoOpen(true)}>
          <Info size={13} /> Info
        </Button>
      </div>

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
              <Button size='sm' color='outline-secondary' onClick={prevMonth}><ChevronLeft size={14} /></Button>
              <span className='small fw-semibold px-2'>{MONTH_NAMES[month - 1]} {year}</span>
              <Button size='sm' color='outline-secondary' onClick={nextMonth}><ChevronRight size={14} /></Button>
              <Button size='sm' color='outline-primary'
                onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1) }}>
                Oggi
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* KPI riepilogo mese */}
      {s && (
        <Row className='g-2 mb-3'>
          <Col sm='4' md='2'>
            <div className='card mb-0'><div className='card-body py-2'>
              <div className='small text-muted'>Assegnazioni</div>
              <div className='fw-bold h5 mb-0' style={{ color: '#7366ff' }}>{s.total_assignments}</div>
            </div></div>
          </Col>
          <Col sm='4' md='2'>
            <div className='card mb-0'><div className='card-body py-2'>
              <div className='small text-muted'>Completate</div>
              <div className='fw-bold h5 mb-0' style={{ color: '#28a745' }}>{s.completed_assignments_count}</div>
            </div></div>
          </Col>
          <Col sm='4' md='2'>
            <div className='card mb-0'><div className='card-body py-2'>
              <div className='small text-muted'>Giorni gap pianif.</div>
              <div className='fw-bold h5 mb-0' style={{ color: s.days_with_coverage_gap_count > 0 ? '#ff9f43' : '#333' }}>
                {s.days_with_coverage_gap_count}
              </div>
            </div></div>
          </Col>
          <Col sm='4' md='2'>
            <div className='card mb-0'><div className='card-body py-2'>
              <div className='small text-muted'>Giorni gap effett.</div>
              <div className='fw-bold h5 mb-0' style={{ color: s.days_with_actual_gap_count > 0 ? '#e74c3c' : '#333' }}>
                {s.days_with_actual_gap_count}
              </div>
            </div></div>
          </Col>
          <Col sm='4' md='2'>
            <div className='card mb-0'><div className='card-body py-2'>
              <div className='small text-muted'>Giorni anomalie</div>
              <div className='fw-bold h5 mb-0' style={{ color: s.days_with_anomalies_count > 0 ? '#e74c3c' : '#333' }}>
                {s.days_with_anomalies_count}
              </div>
            </div></div>
          </Col>
          <Col sm='4' md='2'>
            <div className='card mb-0'><div className='card-body py-2'>
              <div className='small text-muted'>Copertura totale</div>
              <div className='fw-bold h5 mb-0'>{s.actual_completed_count_total}/{s.minimum_staff_required_total}</div>
            </div></div>
          </Col>
        </Row>
      )}

      {/* Legenda */}
      <div className='d-flex flex-wrap gap-3 mb-3 small'>
        <span><span className='badge' style={{ background: '#f0fff8', color: '#1a7a33', border: '1px solid #28a745' }}>● Copertura completa</span></span>
        <span><span className='badge' style={{ background: '#fff8e1', color: '#b76e00', border: '1px solid #ff9f43' }}>● Gap pianificato</span></span>
        <span><span className='badge' style={{ background: '#fff5f5', color: '#c0392b', border: '1px solid #e74c3c' }}>● Gap effettivo / anomalia</span></span>
      </div>

      {!facilityId ? (
        <Card><CardBody className='text-center py-5 text-muted'>Seleziona una struttura.</CardBody></Card>
      ) : loading ? (
        <div className='text-center py-5'><div className='loader' /></div>
      ) : error ? (
        <div className='alert alert-danger'>{error}</div>
      ) : (
        <Card>
          <CardHeader className='py-2'>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {DAY_NAMES_SHORT.map((d) => (
                <div key={d} style={{ textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#888', padding: '4px 0' }}>{d}</div>
              ))}
            </div>
          </CardHeader>
          <CardBody style={{ padding: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {grid.map((day, i) => {
                if (!day) {
                  return <div key={`empty-${i}`} style={{ minHeight: 80, borderRadius: 6, background: '#fafafa' }} />
                }
                const colors = dayStatusColor(day)
                const isToday = day.date === new Date().toISOString().slice(0, 10)
                const dayNum = new Date(day.date + 'T12:00:00').getDate()
                const daySummary = day.summary
                return (
                  <div
                    key={day.date}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      minHeight: 80, borderRadius: 6, padding: '6px 8px',
                      background: isToday ? '#f0eeff' : colors.bg,
                      border: isToday ? '2px solid #7366ff' : `1.5px solid ${colors.border}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: isToday ? '#7366ff' : colors.text, marginBottom: 4 }}>
                      {dayNum}
                    </div>
                    {daySummary && (
                      <div style={{ fontSize: 10, color: '#666' }}>
                        <div>{daySummary.assigned_count_total}/{daySummary.minimum_staff_required_total} pian.</div>
                        {daySummary.actual_completed_count_total > 0 && (
                          <div>{daySummary.actual_completed_count_total} effett.</div>
                        )}
                        {daySummary.anomaly_count > 0 && (
                          <div style={{ color: '#e74c3c' }}>⚠ {daySummary.anomaly_count}</div>
                        )}
                      </div>
                    )}
                    {/* Mini turni */}
                    {day.shifts.length > 0 && (
                      <div className='d-flex flex-column gap-1 mt-1'>
                        {day.shifts.map((b: ShiftWeekBlock) => (
                          <div key={b.shift_template.id} style={{
                            fontSize: 9, padding: '1px 4px', borderRadius: 3,
                            background: 'rgba(255,255,255,0.7)', color: '#555',
                          }}>
                            {b.shift_template.code} {b.assigned_count}/{b.minimum_staff_required}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pannello dettaglio giorno */}
      {selectedDay && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1040 }}
            onClick={() => setSelectedDay(null)}
          />
          <DayDetailPanel day={selectedDay} onClose={() => setSelectedDay(null)} />
        </>
      )}

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Calendario mensile — Guida'>
        <p>Questa pagina mostra la copertura turni della struttura su tutto il mese.</p>
        <p><strong>Colori:</strong> verde = copertura completa, giallo = gap pianificato, rosso = gap effettivo o anomalia timesheet.</p>
        <p>Clicca su un giorno per vedere il dettaglio dei turni e degli operatori assegnati.</p>
        <p className='text-muted small'>Gap pianificato = non hai assegnato abbastanza persone. Gap effettivo = le presenze effettive completate sono insufficienti rispetto al minimo richiesto.</p>
      </InfoDrawer>
    </div>
  )
}
