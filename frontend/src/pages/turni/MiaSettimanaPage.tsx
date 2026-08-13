import { useEffect, useState } from 'react'
import { Card, CardBody, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input } from 'reactstrap'
import { ChevronLeft, ChevronRight, Calendar, Info, AlertTriangle, CheckCircle } from 'react-feather'
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

const OPERATIONAL_STATE_CLS: Record<string, string> = {
  open:        'badge-light-secondary',
  in_progress: 'badge-light-warning',
  closed:      'badge-light-info',
  signed:      'badge-light-primary',
  approved:    'badge-light-success',
  locked:      'badge-light-dark',
  cancelled:   'badge-light-danger',
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

function staffName(s?: { first_name: string; last_name: string; display_name?: string | null } | null) {
  if (!s) return '—'
  return s.display_name?.trim() || `${s.last_name} ${s.first_name}`
}

function groupByDate(assignments: MyWeekAssignment[]): Map<string, MyWeekAssignment[]> {
  const map = new Map<string, MyWeekAssignment[]>()
  for (const a of assignments) {
    if (!map.has(a.shift_date)) map.set(a.shift_date, [])
    map.get(a.shift_date)!.push(a)
  }
  return map
}

function AssignmentCard({ assignment, onSubmitted }: { assignment: MyWeekAssignment; onSubmitted: () => void }) {
  const a = assignment
  const op = a.operational
  const [submitOpen, setSubmitOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await shiftAssignmentsApi.submitMyShift(a.id, notes ? { notes } : undefined)
      toast.success('Turno chiuso e firmato con successo.')
      setSubmitOpen(false)
      onSubmitted()
    } catch (e) {
      const ae = apiError(e)
      setSubmitError(ae.message ?? 'Errore durante la chiusura del turno.')
    } finally { setSubmitting(false) }
  }

  const sb = STATUS_BADGE[a.status] ?? { label: a.status, cls: 'badge-light-secondary' }
  const opCls = op ? (OPERATIONAL_STATE_CLS[op.state] ?? 'badge-light-secondary') : null

  return (
    <>
      <div style={{
        background: '#f8f9ff', borderRadius: 8, padding: '10px 14px',
        border: a.has_active_substitution ? '2px solid #ff9f43' : '1px solid #e8e4ff',
      }}>
        <div className='d-flex justify-content-between align-items-start gap-2 mb-1'>
          <div>
            <div className='fw-semibold small' style={{ color: '#7366ff' }}>
              {a.shift_template?.name ?? 'Turno'}
            </div>
            <div className='small text-muted'>
              {op?.submitted_at
                ? `Effettivo: ${fmtTime(a.actual?.actual_start ?? a.starts_at)} – ${fmtTime(a.actual?.actual_end ?? a.ends_at)}`
                : `${fmtTime(a.starts_at)} – ${fmtTime(a.ends_at)}`
              }
            </div>
            {a.facility && <div className='small text-muted'>{a.facility.name}</div>}
          </div>
          <div className='d-flex flex-column align-items-end gap-1'>
            {/* Stato operativo (fonte primaria) */}
            {op
              ? <span className={`badge ${opCls}`}>{op.label}</span>
              : <span className={`badge ${sb.cls}`}>{sb.label}</span>
            }
            {/* Badge sostituzione */}
            {a.has_active_substitution && (
              <span className='badge badge-light-warning'>Sostituzione attiva</span>
            )}
            {/* Badge anomalie */}
            {op?.has_open_anomalies && (
              <span className='badge badge-light-danger d-flex align-items-center gap-1'>
                <AlertTriangle size={10} /> Anomalie
              </span>
            )}
          </div>
        </div>

        {/* Operatore pianificato + effettivo (in caso di sostituzione) */}
        {a.has_active_substitution && (
          <div className='mt-1 p-2 rounded' style={{ background: '#fff8e1', fontSize: 12 }}>
            <div><span className='text-muted'>Operatore pianificato:</span> {staffName(a.staff_member)}</div>
            <div><span className='text-muted'>Operatore effettivo:</span> <strong>{staffName(a.effective_staff_member)}</strong></div>
            {a.active_substitution?.reason_code && (
              <div><span className='text-muted'>Motivo:</span> {REASON_LABELS[a.active_substitution.reason_code] ?? a.active_substitution.reason_code}</div>
            )}
          </div>
        )}

        {/* Consuntivo se disponibile */}
        {a.actual && (a.actual.worked_minutes != null) && (
          <div className='mt-1' style={{ fontSize: 11, color: '#666' }}>
            Lavorati: {Math.floor((a.actual.worked_minutes ?? 0) / 60)}h {(a.actual.worked_minutes ?? 0) % 60}m
            {a.actual.overtime_minutes ? ` · Straord.: ${a.actual.overtime_minutes}m` : ''}
          </div>
        )}

        {a.notes && (
          <div className='small mt-1' style={{ color: '#666', fontStyle: 'italic' }}>{a.notes}</div>
        )}

        {/* CTA Chiudi e firma — solo se can_submit */}
        {op?.can_submit && (
          <div className='mt-2'>
            <Button size='sm' color='primary' className='d-flex align-items-center gap-1'
              onClick={() => { setNotes(''); setSubmitError(null); setSubmitOpen(true) }}>
              <CheckCircle size={13} /> Chiudi e firma turno
            </Button>
          </div>
        )}

        {/* Stato post-firma (promemoria visivo) */}
        {op?.state === 'signed' && (
          <div className='mt-2 small text-muted'>
            ✓ Turno chiuso e firmato — in attesa di approvazione amministrativa.
          </div>
        )}
        {op?.state === 'approved' && (
          <div className='mt-2 small' style={{ color: '#27ae60' }}>
            ✓ Turno approvato dall'amministrazione.
          </div>
        )}
      </div>

      {/* Modal conferma chiusura turno */}
      <Modal isOpen={submitOpen} toggle={() => setSubmitOpen(false)}>
        <ModalHeader toggle={() => setSubmitOpen(false)}>Chiudi e firma turno</ModalHeader>
        <ModalBody>
          <p className='small text-muted mb-3'>
            Stai per chiudere e firmare operativamente il turno <strong>{a.shift_template?.name}</strong> del {fmtDateFull(a.shift_date)}.
            Questa operazione non sostituisce l'approvazione amministrativa del timesheet.
          </p>
          {op?.has_open_anomalies && (
            <div className='alert alert-warning d-flex align-items-center gap-2 mb-3'>
              <AlertTriangle size={16} />
              Sono presenti anomalie nel consuntivo. Il turno può comunque essere chiuso.
            </div>
          )}
          {submitError && (
            <div className='alert alert-danger mb-3'>{submitError}</div>
          )}
          <FormGroup>
            <Label className='small fw-semibold'>Note finali (facoltative)</Label>
            <Input
              type='textarea'
              rows={3}
              maxLength={4000}
              placeholder='Consegne completate, note operative…'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <small className='text-muted'>{notes.length}/4000</small>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Invio…' : 'Chiudi e firma'}
          </Button>
          <Button color='light' onClick={() => setSubmitOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

const REASON_LABELS: Record<string, string> = {
  illness:   'Malattia',
  vacation:  'Ferie',
  leave:     'Permesso',
  emergency: 'Emergenza',
  coverage:  'Copertura',
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

      {/* Legenda stato operativo */}
      <div className='d-flex flex-wrap gap-2 mb-3 small'>
        <span className='badge badge-light-secondary'>Aperto</span>
        <span className='badge badge-light-warning'>In corso</span>
        <span className='badge badge-light-info'>Chiuso</span>
        <span className='badge badge-light-primary'>Firmato</span>
        <span className='badge badge-light-success'>Approvato</span>
        <span className='badge badge-light-warning' style={{ background: 'transparent', border: '1px solid #ff9f43', color: '#b76e00' }}>Sostituzione attiva</span>
      </div>

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
                      {assignments.map((a) => (
                        <AssignmentCard key={a.id} assignment={a} onSubmitted={load} />
                      ))}
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
        <p>Lo <strong>stato operativo</strong> (Aperto, Firmato, Approvato…) è più informativo dello stato di assegnazione base. Quando un turno è pronto per essere chiuso, compare il pulsante <em>Chiudi e firma turno</em>.</p>
        <p>La <strong>firma operativa</strong> conferma il tuo consuntivo giornaliero: non sostituisce l'approvazione amministrativa, che avviene separatamente.</p>
        <p className='text-muted small'>Visualizzi solo i tuoi turni. I turni degli altri operatori sono visibili ai coordinatori nella Pianificazione.</p>
      </InfoDrawer>
    </div>
  )
}
