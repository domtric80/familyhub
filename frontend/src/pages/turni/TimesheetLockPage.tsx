import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge, Table,
} from 'reactstrap'
import { Home, Lock, Unlock, Plus } from 'react-feather'
import { toast } from 'react-toastify'
import { timesheetMonthLockApi, facilityApi, apiError } from '../../services/api'
import type { TimesheetMonthLock, Facility } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                      'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

function fmtDateTime(v: string | null | undefined) {
  if (!v) return '—'
  try { return new Date(v).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return v }
}

function userName(u: { first_name: string; last_name: string } | null | undefined) {
  if (!u) return '—'
  return `${u.first_name} ${u.last_name}`
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)
const MONTHS = MONTH_LABELS.map((label, i) => ({ value: i + 1, label }))

// ─── Pagina ───────────────────────────────────────────────────────────────────

export default function TimesheetLockPage() {
  const { hasPermission } = useAuth()
  const canLock = hasPermission('staff_timesheet_entries.lock')

  const [facilities, setFacilities]   = useState<Facility[]>([])
  const [facilityId, setFacilityId]   = useState<number | ''>('')
  const [locks, setLocks]             = useState<TimesheetMonthLock[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [acting, setActing]           = useState(false)

  // Modal chiusura mese
  const [lockModal, setLockModal]     = useState(false)
  const [lockForm, setLockForm]       = useState({ facility_id: '' as number | '', year: CURRENT_YEAR, month: new Date().getMonth() + 1, notes: '' })
  const [lockError, setLockError]     = useState<string | null>(null)

  // Carica strutture
  useEffect(() => {
    facilityApi.list()
      .then(setFacilities)
      .catch(() => {})
  }, [])

  // Carica lock quando cambia filtro struttura
  useEffect(() => {
    loadLocks()
  }, [facilityId])

  const loadLocks = () => {
    setLoading(true)
    setError(null)
    timesheetMonthLockApi.list(facilityId !== '' ? facilityId : undefined)
      .then(setLocks)
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 403) setError('Non hai i permessi per visualizzare i lock mensili.')
        else setError(ae.message ?? 'Errore caricamento lock')
      })
      .finally(() => setLoading(false))
  }

  const handleLock = async () => {
    if (!lockForm.facility_id || !lockForm.year || !lockForm.month) return
    setLockError(null)
    setActing(true)
    try {
      const res = await timesheetMonthLockApi.lock({
        facility_id: lockForm.facility_id as number,
        year: lockForm.year,
        month: lockForm.month,
        notes: lockForm.notes.trim() || undefined,
      })
      toast.success(`${res.message} (${res.entries_locked} entry bloccate)`)
      setLockModal(false)
      setLockForm({ facility_id: '', year: CURRENT_YEAR, month: new Date().getMonth() + 1, notes: '' })
      loadLocks()
    } catch (e: any) {
      const ae = apiError(e)
      setLockError(ae.message ?? 'Errore chiusura mese')
    } finally {
      setActing(false)
    }
  }

  const handleUnlock = async (lock: TimesheetMonthLock) => {
    if (!window.confirm(`Riaprire ${MONTH_LABELS[lock.month - 1]} ${lock.year} per ${lock.facility.name}?`)) return
    setActing(true)
    try {
      const res = await timesheetMonthLockApi.unlock(lock.id)
      toast.success(`${res.message} (${res.entries_unlocked} entry riaperte)`)
      loadLocks()
    } catch (e: any) {
      const ae = apiError(e)
      toast.error(ae.message ?? 'Errore riapertura mese')
    } finally {
      setActing(false)
    }
  }

  if (!canLock) {
    return (
      <Container fluid>
        <Alert color='warning' className='mt-4'>Non hai i permessi per gestire i lock mensili timesheet.</Alert>
      </Container>
    )
  }

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <Lock size={18} className='text-primary' />
                <h3 className='mb-0'>Lock mensili timesheet</h3>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Turni</li>
                <li className='breadcrumb-item active'>Lock mensili</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Alert color='info' className='mb-4' style={{ fontSize: 13 }}>
          La chiusura contabile mensile impedisce: nuove timbrature, invio timesheet, nuove rettifiche e loro approvazione.
          L'operazione è reversibile tramite <strong>Riapri mese</strong>. La chiusura fallisce se esistono entry non ancora approvate o rettifiche pending.
        </Alert>

        <Card>
          <CardHeader className='d-flex flex-wrap align-items-center gap-2'>
            <strong>Lock mensili</strong>

            {/* Filtro struttura */}
            <Input
              type='select'
              bsSize='sm'
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value === '' ? '' : Number(e.target.value))}
              style={{ width: 220 }}
            >
              <option value=''>Tutte le strutture</option>
              {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Input>

            <Button color='primary' size='sm' className='ms-auto d-flex align-items-center gap-1'
              onClick={() => { setLockError(null); setLockModal(true) }}>
              <Plus size={13} /> Chiudi mese
            </Button>
          </CardHeader>

          <CardBody className='p-0'>
            {loading && <div className='text-center py-4'><span className='spinner-border spinner-border-sm text-primary' /></div>}
            {error && <Alert color='warning' className='m-3'>{error}</Alert>}

            {!loading && !error && (
              <div className='table-responsive'>
                <Table className='table-hover align-middle mb-0'>
                  <thead className='table-light'>
                    <tr>
                      <th>Struttura</th>
                      <th>Periodo</th>
                      <th>Stato</th>
                      <th>Bloccato il</th>
                      <th>Bloccato da</th>
                      <th>Riaperto il</th>
                      <th>Riaperto da</th>
                      <th>Note</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {locks.length === 0 && (
                      <tr><td colSpan={9} className='text-center text-muted py-4'>Nessun lock mensile registrato.</td></tr>
                    )}
                    {locks.map((lock) => (
                      <tr key={lock.id}>
                        <td className='fw-semibold small'>{lock.facility.name}</td>
                        <td className='small'>{MONTH_LABELS[lock.month - 1]} {lock.year}</td>
                        <td>
                          {lock.is_locked
                            ? <Badge color='' className='badge-light-danger'>Bloccato</Badge>
                            : <Badge color='' className='badge-light-success'>Riaperto</Badge>}
                        </td>
                        <td className='small'>{fmtDateTime(lock.locked_at)}</td>
                        <td className='small'>{userName(lock.locked_by)}</td>
                        <td className='small'>{fmtDateTime(lock.unlocked_at)}</td>
                        <td className='small'>{userName(lock.unlocked_by)}</td>
                        <td className='small text-muted'>{lock.notes ?? '—'}</td>
                        <td className='text-end text-nowrap'>
                          {lock.is_locked && (
                            <Button size='sm' color='warning' outline disabled={acting}
                              onClick={() => handleUnlock(lock)}
                              title='Riapri mese'>
                              <Unlock size={13} className='me-1' /> Riapri
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Modal chiusura mese */}
      <Modal isOpen={lockModal} toggle={() => setLockModal(false)}>
        <ModalHeader toggle={() => setLockModal(false)}>
          <Lock size={15} className='me-2' /> Chiudi mese contabile
        </ModalHeader>
        <ModalBody>
          {lockError && (
            <Alert color='danger' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
              {lockError}
            </Alert>
          )}

          <FormGroup>
            <Label>Struttura <span className='text-danger'>*</span></Label>
            <Input type='select' value={lockForm.facility_id}
              onChange={(e) => setLockForm((p) => ({ ...p, facility_id: e.target.value === '' ? '' : Number(e.target.value) }))}>
              <option value=''>Seleziona struttura...</option>
              {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Input>
          </FormGroup>

          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Anno <span className='text-danger'>*</span></Label>
                <Input type='select' value={lockForm.year}
                  onChange={(e) => setLockForm((p) => ({ ...p, year: Number(e.target.value) }))}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Mese <span className='text-danger'>*</span></Label>
                <Input type='select' value={lockForm.month}
                  onChange={(e) => setLockForm((p) => ({ ...p, month: Number(e.target.value) }))}>
                  {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Input>
              </FormGroup>
            </Col>
          </Row>

          <FormGroup className='mb-0'>
            <Label>Note</Label>
            <Input type='textarea' rows={3} placeholder='Es. Chiusura amministrativa mese luglio.'
              value={lockForm.notes}
              onChange={(e) => setLockForm((p) => ({ ...p, notes: e.target.value }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='danger'
            disabled={acting || !lockForm.facility_id || !lockForm.year || !lockForm.month}
            onClick={handleLock}>
            {acting ? 'Chiusura...' : 'Conferma chiusura mese'}
          </Button>
          <Button color='secondary' onClick={() => setLockModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
