import { useEffect, useState } from 'react'
import { Card, CardBody, Button, Badge } from 'reactstrap'
import { ChevronLeft, ChevronRight, Calendar, Info } from 'react-feather'
import { toast } from 'react-toastify'
import { shiftAssignmentsApi, apiError } from '../../services/api'
import type { StaffShiftMyWeek, MyWeekAssignment, ShiftAssignmentStatus } from '../../types'
import InfoDrawer from '../../components/common/InfoDrawer'

const STATUS_BADGE: Record<ShiftAssignmentStatus, { label: string; cls: string }> = {
  planned:   { label: 'Pianificato',  cls: 'badge-light-secondary' },
  confirmed: { label: 'Confermato',   cls: 'badge-light-primary' },
  completed: { label: 'Completato',   cls: 'badge-light-success' },
  cancelled: { label: 'Annullato',    cls: 'badge-light-danger' },
}

const DAY_NAMES_FULL = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function toISO(d: Date) { return d.toISOString().slice(0, 10) }
function addDays(d: Date, n: number) { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd }

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

function fmtDateFull(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return `${DAY_NAMES_FULL[d.getDay()]} ${d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}`
  } catch { return dateStr }
}

/** Raggruppa assegnazioni per giorno */
function groupByDate(assignments: MyWeekAssignment[]): Map<string, MyWeekAssignment[]> {
  const map = new Map<string, MyWeekAssignment[]>()
  for (const a of assignments) {
    if (!map.has(a.shift_date)) map.set(a.shift_date, [])
    map.get(a.shift_date)!.push(a)
  }
  return map
}

export default function MiaSettimanaPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [myWeek, setMyWeek]       = useState<StaffShiftMyWeek | null>(null)
  const [loading, setLoading]     = useState(false)
  const [notLinked, setNotLinked] = useState(false)
  const [infoOpen, setInfoOpen]   = useState(false)

  const load = () => {
    setLoading(true); setNotLinked(false)
    shiftAssignmentsApi.myWeek({ week_start: toISO(weekStart) })
      .then(setMyWeek)
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 404) setNotLinked(true)
        else toast.error('Errore caricamento turni.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [weekStart]) // eslint-disable-line react-hooks/exhaustive-deps

  const prevWeek = () => setWeekStart((d) => addDays(d, -7))
  const nextWeek = () => setWeekStart((d) => addDays(d, 7))
  const goToday  = () => setWeekStart(getMonday(new Date()))

  const weekLabel = myWeek
    ? `${new Date(myWeek.week_start).toLocaleDateString('it-IT')} – ${new Date(myWeek.week_end).toLocaleDateString('it-IT')}`
    : `${weekStart.toLocaleDateString('it-IT')} – ${addDays(weekStart, 6).toLocaleDateString('it-IT')}`

  const grouped = myWeek ? groupByDate(myWeek.assignments) : new Map<string, MyWeekAssignment[]>()

  // Genera tutti i giorni della settimana
  const weekDays = myWeek
    ? Array.from({ length: 7 }, (_, i) => toISO(addDays(new Date(myWeek.week_start + 'T12:00:00'), i)))
    : Array.from({ length: 7 }, (_, i) => toISO(addDays(weekStart, i)))

  const staffLabel = myWeek?.staff_member
    ? (myWeek.staff_member.display_name?.trim() || `${myWeek.staff_member.last_name} ${myWeek.staff_member.first_name}`)
    : null

  return (
    <div className='container-fluid py-3'>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <div>
          <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>La mia settimana</h5>
          {staffLabel && <div className='small text-muted'>{staffLabel}</div>}
        </div>
        <div className='d-flex gap-2'>
          <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1'
            onClick={() => setInfoOpen(true)}>
            <Info size={13} /> Info
          </Button>
        </div>
      </div>

      {/* Navigazione settimana */}
      <Card className='mb-3'>
        <CardBody className='py-2'>
          <div className='d-flex gap-2 align-items-center'>
            <Button size='sm' color='outline-secondary' onClick={prevWeek}><ChevronLeft size={14} /></Button>
            <span className='small fw-semibold px-2'>{weekLabel}</span>
            <Button size='sm' color='outline-secondary' onClick={nextWeek}><ChevronRight size={14} /></Button>
            <Button size='sm' color='outline-primary' onClick={goToday}>Oggi</Button>
          </div>
        </CardBody>
      </Card>

      {notLinked ? (
        <Card>
          <CardBody className='text-center py-5'>
            <Calendar size={40} className='text-muted mb-3' />
            <p className='text-muted'>Il tuo account non è collegato a nessun profilo operatore.</p>
            <p className='small text-muted'>Contatta il coordinatore per associare il tuo utente a un operatore della struttura.</p>
          </CardBody>
        </Card>
      ) : loading ? (
        <div className='text-center py-5'><div className='loader' /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {weekDays.map((dateStr) => {
            const assignments = grouped.get(dateStr) ?? []
            const isToday = dateStr === toISO(new Date())
            return (
              <Card key={dateStr} style={isToday ? { border: '2px solid #7366ff' } : {}}>
                <CardBody className='py-2'>
                  {/* Header giorno */}
                  <div className='d-flex justify-content-between align-items-center mb-2'>
                    <span className='fw-semibold' style={{ color: isToday ? '#7366ff' : '#333', fontSize: 14 }}>
                      {fmtDateFull(dateStr)}
                      {isToday && <Badge color='primary' pill className='ms-2' style={{ fontSize: 10 }}>Oggi</Badge>}
                    </span>
                    {assignments.length > 0 && (
                      <span className='small text-muted'>{assignments.length} turno{assignments.length > 1 ? 'i' : ''}</span>
                    )}
                  </div>

                  {assignments.length === 0 ? (
                    <div className='small text-muted py-1'>Nessun turno assegnato.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {assignments.map((a) => {
                        const sb = STATUS_BADGE[a.status]
                        return (
                          <div key={a.id} style={{
                            background: '#f8f9ff', borderRadius: 8, padding: '10px 14px',
                            border: '1px solid #e8e4ff',
                          }}>
                            <div className='d-flex justify-content-between align-items-start'>
                              <div>
                                <div className='fw-semibold small' style={{ color: '#7366ff' }}>
                                  {a.shift_template?.name ?? 'Turno'}
                                </div>
                                <div className='small text-muted'>
                                  {fmtTime(a.starts_at)} – {fmtTime(a.ends_at)}
                                </div>
                                {a.facility && (
                                  <div className='small text-muted'>{a.facility.name}</div>
                                )}
                              </div>
                              <span className={`badge ${sb.cls}`}>{sb.label}</span>
                            </div>
                            {a.notes && (
                              <div className='small mt-1' style={{ color: '#666', fontStyle: 'italic' }}>
                                {a.notes}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='La mia settimana — Guida'>
        <p>Questa pagina mostra i <strong>turni assegnati al tuo profilo operatore</strong> per la settimana selezionata.</p>
        <p>Puoi navigare tra le settimane con i pulsanti freccia. Il giorno corrente è evidenziato in viola.</p>
        <p>Ogni turno mostra il nome del turno, la fascia oraria, la struttura e lo stato dell'assegnazione.</p>
        <p className='text-muted small'>Visualizzi solo i tuoi turni. I turni degli altri operatori sono visibili ai coordinatori nella Pianificazione settimanale.</p>
      </InfoDrawer>
    </div>
  )
}
