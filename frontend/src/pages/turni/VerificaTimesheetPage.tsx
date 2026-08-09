import { useEffect, useState } from 'react'
import {
  Card, CardBody, CardHeader, Button, Badge,
  Table, Row, Col, Input, FormGroup, Label, Alert,
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap'
import { Check, X, AlertTriangle, Info, Clock, ChevronDown, Plus } from 'react-feather'
import { toast } from 'react-toastify'
import { timesheetApi, staffMemberApi, facilityApi, apiError } from '../../services/api'
import type { TimesheetAdjustmentWrite, TimesheetEntry, TimesheetEntryStatus, Facility } from '../../types'
import InfoDrawer from '../../components/common/InfoDrawer'

const STATUS_ENTRY: Record<TimesheetEntryStatus, { label: string; cls: string }> = {
  draft: { label: 'Bozza', cls: 'badge-light-secondary' },
  computed: { label: 'Calcolato', cls: 'badge-light-primary' },
  submitted: { label: 'Inviato', cls: 'badge-light-warning' },
  approved: { label: 'Approvato', cls: 'badge-light-success' },
  rejected: { label: 'Rifiutato', cls: 'badge-light-danger' },
  locked: { label: 'Bloccato', cls: 'badge-light-secondary' },
}

const ADJUSTMENT_TYPE_OPTIONS: Array<{ value: TimesheetAdjustmentWrite['adjustment_type']; label: string }> = [
  { value: 'manual_correction', label: 'Correzione manuale' },
  { value: 'break_correction', label: 'Correzione pausa' },
  { value: 'overtime_authorization', label: 'Straordinario autorizzato' },
  { value: 'absence_reconciliation', label: 'Riconciliazione assenza' },
]

function fmtDate(value: string) {
  try { return new Date(value + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return value }
}

function fmtTime(value: string) {
  try { return new Date(value).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }
  catch { return value }
}

function fmtDateTime(value?: string | null) {
  if (!value) return '—'
  try { return new Date(value).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return value }
}

function minsToHM(min?: number | null) {
  if (min == null) return '—'
  const h = Math.floor(Math.abs(min) / 60)
  const m = Math.abs(min) % 60
  const sign = min < 0 ? '−' : (min > 0 ? '+' : '')
  return `${sign}${h}h ${m.toString().padStart(2, '0')}m`
}

function staffName(s?: { first_name: string; last_name: string; display_name?: string | null } | null) {
  if (!s) return '—'
  return s.display_name?.trim() || `${s.last_name} ${s.first_name}`
}

function currentMonthRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthNumber = (month + 1).toString().padStart(2, '0')
  return { date_from: `${year}-${monthNumber}-01`, date_to: `${year}-${monthNumber}-${new Date(year, month + 1, 0).getDate()}` }
}

function adjustmentTypeLabel(value: string) {
  return ADJUSTMENT_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value
}

export default function VerificaTimesheetPage() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [staffList, setStaffList] = useState<{ id: number; first_name: string; last_name: string; display_name?: string | null }[]>([])
  const [loading, setLoading] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  const [filterFacility, setFilterFacility] = useState(0)
  const [filterStaff, setFilterStaff] = useState(0)
  const [filterStatus, setFilterStatus] = useState<TimesheetEntryStatus | ''>('')
  const [filterAnomaly, setFilterAnomaly] = useState(false)
  const [{ date_from, date_to }, setDateRange] = useState(currentMonthRange)

  const [detail, setDetail] = useState<TimesheetEntry | null>(null)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [adjustmentModal, setAdjustmentModal] = useState(false)
  const [adjustmentForm, setAdjustmentForm] = useState<TimesheetAdjustmentWrite>({
    adjustment_type: 'manual_correction',
    delta_minutes: 0,
    reason: '',
  })
  const [acting, setActing] = useState(false)

  useEffect(() => {
    facilityApi.list().then(setFacilities).catch(() => {})
  }, [])

  useEffect(() => {
    if (filterFacility) {
      staffMemberApi.list({ facility_id: filterFacility }).then(setStaffList).catch(() => {})
    } else {
      setStaffList([])
    }
    setFilterStaff(0)
  }, [filterFacility])

  const load = () => {
    setLoading(true)
    timesheetApi.list({
      facility_id: filterFacility || undefined,
      staff_member_id: filterStaff || undefined,
      status: filterStatus || undefined,
      has_anomaly: filterAnomaly || undefined,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
    }).then(setEntries).catch(() => toast.error('Errore caricamento timesheet')).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterFacility, filterStaff, filterStatus, filterAnomaly, date_from, date_to]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async (entry: TimesheetEntry) => {
    if (!confirm(`Approvare l'entry del ${fmtDate(entry.work_date)} per ${staffName(entry.staff_member)}?`)) return
    setActing(true)
    try {
      const updated = await timesheetApi.approve(entry.id)
      setEntries((prev) => prev.map((item) => item.id === entry.id ? updated : item))
      if (detail?.id === entry.id) setDetail(updated)
      toast.success('Entry approvata.')
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore approvazione.')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!detail || !rejectReason.trim()) return
    setActing(true)
    try {
      const updated = await timesheetApi.reject(detail.id, rejectReason)
      setEntries((prev) => prev.map((item) => item.id === detail.id ? updated : item))
      setDetail(updated)
      setRejectModal(false)
      setRejectReason('')
      toast.success('Entry rifiutata.')
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore rifiuto.')
    } finally {
      setActing(false)
    }
  }

  const openAdjustmentModal = (entry: TimesheetEntry) => {
    setDetail(entry)
    setAdjustmentForm({
      adjustment_type: 'manual_correction',
      delta_minutes: 0,
      reason: '',
    })
    setAdjustmentModal(true)
  }

  const handleAdjustmentSubmit = async () => {
    if (!detail || !adjustmentForm.reason.trim() || adjustmentForm.delta_minutes === 0) return

    setActing(true)
    try {
      const updated = await timesheetApi.addAdjustment(detail.id, adjustmentForm)
      setEntries((prev) => prev.map((item) => item.id === detail.id ? updated : item))
      setDetail(updated)
      setAdjustmentModal(false)
      toast.success('Rettifica timesheet registrata con successo.')
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore creazione rettifica.')
    } finally {
      setActing(false)
    }
  }

  const submittedCount = entries.filter((entry) => entry.status === 'submitted').length
  const anomalyCount = entries.filter((entry) => entry.has_anomaly).length

  return (
    <div className='container-fluid py-3'>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Verifica timesheet</h5>
        <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
          <Info size={13} /> Info
        </Button>
      </div>

      {(submittedCount > 0 || anomalyCount > 0) && (
        <div className='d-flex gap-3 mb-3'>
          {submittedCount > 0 && <div className='badge badge-light-warning' style={{ fontSize: 12 }}>{submittedCount} in attesa di approvazione</div>}
          {anomalyCount > 0 && <div className='badge badge-light-danger d-flex align-items-center gap-1' style={{ fontSize: 12 }}><AlertTriangle size={11} /> {anomalyCount} anomalie</div>}
        </div>
      )}

      <Card className='mb-3'>
        <CardBody className='py-2'>
          <Row className='g-2'>
            <Col md='2'>
              <Input type='select' bsSize='sm' value={filterFacility} onChange={(e) => setFilterFacility(Number(e.target.value))}>
                <option value='0'>Tutte le strutture</option>
                {facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
              </Input>
            </Col>
            <Col md='2'>
              <Input type='select' bsSize='sm' value={filterStaff} disabled={!filterFacility} onChange={(e) => setFilterStaff(Number(e.target.value))}>
                <option value='0'>Tutti gli operatori</option>
                {staffList.map((staff) => <option key={staff.id} value={staff.id}>{staffName(staff)}</option>)}
              </Input>
            </Col>
            <Col md='2'>
              <Input type='date' bsSize='sm' value={date_from} onChange={(e) => setDateRange((prev) => ({ ...prev, date_from: e.target.value }))} />
            </Col>
            <Col md='2'>
              <Input type='date' bsSize='sm' value={date_to} onChange={(e) => setDateRange((prev) => ({ ...prev, date_to: e.target.value }))} />
            </Col>
            <Col md='2'>
              <Input type='select' bsSize='sm' value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TimesheetEntryStatus | '')}>
                <option value=''>Tutti gli stati</option>
                {(Object.entries(STATUS_ENTRY) as [TimesheetEntryStatus, { label: string; cls: string }][]).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </Input>
            </Col>
            <Col md='2'>
              <FormGroup check className='mb-0 d-flex align-items-center h-100'>
                <Input type='checkbox' checked={filterAnomaly} onChange={(e) => setFilterAnomaly(e.target.checked)} />
                <Label check className='small'>Solo anomalie</Label>
              </FormGroup>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className='py-2 d-flex align-items-center gap-2'>
          <Clock size={16} style={{ color: '#7366ff' }} />
          <strong>Entry timesheet</strong>
          <Badge color='primary' pill className='ms-auto'>{entries.length}</Badge>
        </CardHeader>
        <CardBody className='p-0'>
          {loading ? (
            <div className='text-center py-4'><div className='loader' /></div>
          ) : entries.length === 0 ? (
            <div className='text-center py-5 text-muted small'>Nessuna entry per i filtri selezionati.</div>
          ) : (
            <Table hover responsive className='mb-0 table-sm'>
              <thead className='table-light'>
                <tr>
                  <th>Data</th>
                  <th>Operatore</th>
                  <th>Turno</th>
                  <th className='text-center'>Entrata</th>
                  <th className='text-center'>Uscita</th>
                  <th className='text-center'>Lavorato</th>
                  <th className='text-center'>Δ</th>
                  <th className='text-center'>Straord.</th>
                  <th className='text-center'>Anomalia</th>
                  <th className='text-center'>Stato</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const statusBadge = STATUS_ENTRY[entry.status]
                  return (
                    <tr key={entry.id} style={entry.has_anomaly ? { background: '#fffbea' } : {}}>
                      <td className='small'>{fmtDate(entry.work_date)}</td>
                      <td className='small'>{staffName(entry.staff_member)}</td>
                      <td className='small'>{entry.shift_assignment?.shift_template?.name ?? '—'}</td>
                      <td className='text-center small'>{entry.actual_start ? fmtTime(entry.actual_start) : '—'}</td>
                      <td className='text-center small'>{entry.actual_end ? fmtTime(entry.actual_end) : '—'}</td>
                      <td className='text-center small'>{minsToHM(entry.worked_minutes)}</td>
                      <td className='text-center small' style={{ color: (entry.delta_minutes ?? 0) < 0 ? '#e74c3c' : '#28a745' }}>{minsToHM(entry.delta_minutes)}</td>
                      <td className='text-center small'>{minsToHM(entry.overtime_minutes)}</td>
                      <td className='text-center'>{entry.has_anomaly ? <AlertTriangle size={13} color='#ff9f43' /> : <span className='text-muted'>—</span>}</td>
                      <td className='text-center'><span className={`badge ${statusBadge.cls}`}>{statusBadge.label}</span></td>
                      <td className='text-end text-nowrap'>
                        <Button size='sm' color='outline-primary' className='py-0 px-2 me-1' onClick={() => setDetail(entry)}>
                          <ChevronDown size={12} />
                        </Button>
                        {entry.status === 'submitted' && (
                          <>
                            <Button size='sm' color='success' className='py-0 px-2 me-1' disabled={acting} onClick={() => handleApprove(entry)} title='Approva'>
                              <Check size={12} />
                            </Button>
                            <Button size='sm' color='danger' className='py-0 px-2' disabled={acting} onClick={() => { setDetail(entry); setRejectModal(true) }} title='Rifiuta'>
                              <X size={12} />
                            </Button>
                          </>
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

      <Modal isOpen={!!detail && !rejectModal && !adjustmentModal} toggle={() => setDetail(null)} size='lg'>
        {detail && (
          <>
            <ModalHeader toggle={() => setDetail(null)}>
              {staffName(detail.staff_member)} — {fmtDate(detail.work_date)}
              <span className={`badge ${STATUS_ENTRY[detail.status].cls} ms-2`}>{STATUS_ENTRY[detail.status].label}</span>
            </ModalHeader>
            <ModalBody>
              <div className='fw-semibold small mb-1' style={{ color: '#7366ff' }}>Pianificato</div>
              <div className='p-2 rounded mb-3' style={{ background: '#f8f9ff', fontSize: 13 }}>
                <div><strong>Turno:</strong> {detail.shift_assignment?.shift_template?.name ?? '—'}</div>
                <div><strong>Durata teorica:</strong> {minsToHM(detail.planned_minutes)}</div>
              </div>

              {detail.attendance_events && detail.attendance_events.length > 0 && (
                <>
                  <div className='fw-semibold small mb-1' style={{ color: '#7366ff' }}>Presenze registrate</div>
                  <div className='mb-3' style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[...detail.attendance_events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)).map((event) => (
                      <div key={event.id} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '4px 8px', background: '#f4f5f7', borderRadius: 4 }}>
                        <span className='fw-semibold'>{event.event_type}</span>
                        <span>{fmtTime(event.occurred_at)}</span>
                        <span className='text-muted ms-auto'>{event.source}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className='fw-semibold small mb-1' style={{ color: '#7366ff' }}>Consuntivo</div>
              <div className='p-2 rounded mb-3' style={{ background: '#f8f9ff', fontSize: 13 }}>
                <div><strong>Lavorato:</strong> {minsToHM(detail.worked_minutes)}</div>
                <div><strong>Ordinarie:</strong> {minsToHM(detail.ordinary_minutes)}</div>
                <div><strong>Straordinarie:</strong> {minsToHM(detail.overtime_minutes)}</div>
                <div><strong>Pausa:</strong> {minsToHM(detail.break_minutes)}</div>
                <div><strong>Δ:</strong> <span style={{ color: (detail.delta_minutes ?? 0) < 0 ? '#e74c3c' : '#28a745' }}>{minsToHM(detail.delta_minutes)}</span></div>
                {detail.has_anomaly && (
                  <Alert color='warning' className='mt-2 mb-0 py-1 small'>
                    <AlertTriangle size={13} className='me-1' /> {detail.anomaly_notes ?? 'Anomalia rilevata'}
                  </Alert>
                )}
              </div>

              {detail.adjustments && detail.adjustments.length > 0 && (
                <>
                  <div className='fw-semibold small mb-1' style={{ color: '#7366ff' }}>Rettifiche</div>
                  <Table size='sm' className='mb-3'>
                    <thead><tr><th>Tipo</th><th>Δ min</th><th>Motivo</th><th>Stato</th><th>Creata il</th></tr></thead>
                    <tbody>
                      {detail.adjustments.map((adjustment) => (
                        <tr key={adjustment.id}>
                          <td className='small'>{adjustmentTypeLabel(adjustment.adjustment_type)}</td>
                          <td className='small'>{adjustment.delta_minutes > 0 ? '+' : ''}{adjustment.delta_minutes}</td>
                          <td className='small'>{adjustment.reason}</td>
                          <td><span className='badge badge-light-secondary'>{adjustment.status}</span></td>
                          <td className='small'>{fmtDateTime(adjustment.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </ModalBody>
            <ModalFooter className='justify-content-between'>
              <div className='small text-muted'>Le rettifiche correggono il consuntivo senza alterare lo storico delle timbrature originali.</div>
              <div className='d-flex gap-2'>
                {detail.status !== 'locked' && (
                  <Button color='primary' outline size='sm' disabled={acting} onClick={() => openAdjustmentModal(detail)}>
                    <Plus size={13} className='me-1' /> Aggiungi rettifica
                  </Button>
                )}
                {detail.status === 'submitted' && (
                  <>
                    <Button color='success' size='sm' disabled={acting} onClick={() => handleApprove(detail)}>
                      <Check size={13} className='me-1' /> Approva
                    </Button>
                    <Button color='danger' size='sm' disabled={acting} onClick={() => setRejectModal(true)}>
                      <X size={13} className='me-1' /> Rifiuta
                    </Button>
                  </>
                )}
                <Button color='secondary' size='sm' onClick={() => setDetail(null)}>Chiudi</Button>
              </div>
            </ModalFooter>
          </>
        )}
      </Modal>

      <Modal isOpen={adjustmentModal} toggle={() => setAdjustmentModal(false)}>
        <ModalHeader toggle={() => setAdjustmentModal(false)}>Nuova rettifica timesheet</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Tipo rettifica</Label>
            <Input
              type='select'
              value={adjustmentForm.adjustment_type}
              onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, adjustment_type: e.target.value as TimesheetAdjustmentWrite['adjustment_type'] }))}
            >
              {ADJUSTMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Delta minuti</Label>
            <Input
              type='number'
              min='-720'
              max='720'
              step='1'
              value={adjustmentForm.delta_minutes}
              onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, delta_minutes: Number(e.target.value) }))}
            />
            <div className='small text-muted mt-1'>Positivo aggiunge minuti, negativo li sottrae dal consuntivo.</div>
          </FormGroup>
          <FormGroup className='mb-0'>
            <Label>Motivazione</Label>
            <Input
              type='textarea'
              rows={4}
              value={adjustmentForm.reason}
              onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder='Descrivi la motivazione operativa o autorizzativa della rettifica.'
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' disabled={acting || !adjustmentForm.reason.trim() || adjustmentForm.delta_minutes === 0} onClick={handleAdjustmentSubmit}>
            {acting ? 'Salvataggio…' : 'Crea rettifica'}
          </Button>
          <Button color='secondary' onClick={() => setAdjustmentModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={rejectModal} toggle={() => setRejectModal(false)}>
        <ModalHeader toggle={() => setRejectModal(false)}>Motivo rifiuto</ModalHeader>
        <ModalBody>
          <Input type='textarea' rows={3} placeholder='Indica il motivo del rifiuto…' value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </ModalBody>
        <ModalFooter>
          <Button color='danger' disabled={!rejectReason.trim() || acting} onClick={handleReject}>
            {acting ? 'Rifiuto…' : 'Conferma rifiuto'}
          </Button>
          <Button color='secondary' onClick={() => setRejectModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Verifica timesheet — Guida'>
        <p>Qui puoi revisionare e approvare le entry timesheet degli operatori della struttura.</p>
        <p>Le entry nello stato <em>Inviato</em> sono in attesa di approvazione. Le anomalie indicano scostamenti o timbrature incomplete.</p>
        <p>Usa <strong>Approva</strong> per confermare l'entry, <strong>Rifiuta</strong> per rimandarla all'operatore e <strong>Aggiungi rettifica</strong> per correggere il consuntivo con audit trail.</p>
      </InfoDrawer>
    </div>
  )
}
