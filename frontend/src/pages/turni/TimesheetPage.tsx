import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card, CardBody, CardHeader, Row, Col, Button, Input, Alert, Table,
} from 'reactstrap'
import { Calendar, CheckCircle, Clock, Download, FileText, Info, AlertTriangle, UserCheck } from 'react-feather'
import { toast } from 'react-toastify'
import { attendanceApi, timesheetApi, facilityApi, apiError } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { AttendanceEvent, Facility, TimesheetEntry } from '../../types'
import InfoDrawer from '../../components/common/InfoDrawer'

function currentMonthRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthNumber = (month + 1).toString().padStart(2, '0')
  return {
    dateFrom: `${year}-${monthNumber}-01`,
    dateTo: `${year}-${monthNumber}-${new Date(year, month + 1, 0).getDate().toString().padStart(2, '0')}`,
  }
}

function minsToHM(min?: number | null) {
  if (min == null) return '—'
  const sign = min < 0 ? '-' : ''
  const abs = Math.abs(min)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  return `${sign}${hours}h ${minutes.toString().padStart(2, '0')}m`
}

function fmtDate(value: string) {
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return value
  }
}

function fmtTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return value
  }
}

function lastEventLabel(events: AttendanceEvent[]) {
  if (!events.length) return 'Nessuna timbratura oggi'
  const last = [...events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)).at(-1)
  if (!last) return 'Nessuna timbratura oggi'
  const labels: Record<string, string> = {
    clock_in: 'Ultima timbratura: entrata',
    clock_out: 'Ultima timbratura: uscita',
    break_start: 'Ultima timbratura: inizio pausa',
    break_end: 'Ultima timbratura: fine pausa',
  }
  return `${labels[last.event_type] ?? 'Ultima timbratura'} alle ${fmtTime(last.occurred_at)}`
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = 'primary',
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  tone?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const borderColor = {
    primary: '#7366ff',
    success: '#28a745',
    warning: '#ff9f43',
    danger: '#e74c3c',
  }[tone]

  return (
    <Card style={{ borderTop: `3px solid ${borderColor}` }}>
      <CardBody>
        <div className='d-flex align-items-start justify-content-between'>
          <div>
            <div className='small text-muted mb-1'>{title}</div>
            <div className='fw-bold' style={{ fontSize: 24 }}>{value}</div>
            {subtitle && <div className='small text-muted mt-1'>{subtitle}</div>}
          </div>
          <div style={{ color: borderColor }}>{icon}</div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function TimesheetPage() {
  const { hasPermission } = useAuth()
  const [infoOpen, setInfoOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [selectedFacilityId, setSelectedFacilityId] = useState(0)
  const [myEntries, setMyEntries] = useState<TimesheetEntry[]>([])
  const [adminEntries, setAdminEntries] = useState<TimesheetEntry[]>([])
  const [todayEvents, setTodayEvents] = useState<AttendanceEvent[]>([])

  const canReview = hasPermission('staff_timesheet_entries.approve')
  const canExport = hasPermission('staff_timesheet_entries.export')
  const canReadOwn = hasPermission('staff_timesheet_entries.read')
  const { dateFrom, dateTo } = useMemo(() => currentMonthRange(), [])

  useEffect(() => {
    if (canReview || canExport) {
      facilityApi.list()
        .then((items) => {
          setFacilities(items)
          if (items.length > 0) setSelectedFacilityId((current) => current || items[0].id)
        })
        .catch(() => {})
    }
  }, [canReview, canExport])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      try {
        const requests: Promise<unknown>[] = []

        if (canReadOwn) {
          requests.push(timesheetApi.myEntries({ date_from: dateFrom, date_to: dateTo }))
          requests.push(attendanceApi.myToday())
        }

        if ((canReview || canExport) && selectedFacilityId) {
          requests.push(timesheetApi.list({
            facility_id: selectedFacilityId,
            date_from: dateFrom,
            date_to: dateTo,
          }))
        }

        const results = await Promise.allSettled(requests)
        let pointer = 0

        if (canReadOwn) {
          const ownEntriesResult = results[pointer++]
          const ownTodayResult = results[pointer++]
          if (ownEntriesResult?.status === 'fulfilled' && active) setMyEntries(ownEntriesResult.value as TimesheetEntry[])
          if (ownTodayResult?.status === 'fulfilled' && active) setTodayEvents(ownTodayResult.value as AttendanceEvent[])
        }

        if ((canReview || canExport) && selectedFacilityId) {
          const adminEntriesResult = results[pointer]
          if (adminEntriesResult?.status === 'fulfilled' && active) setAdminEntries(adminEntriesResult.value as TimesheetEntry[])
        }
      } catch (error) {
        toast.error(apiError(error).message ?? 'Errore caricamento dashboard timesheet.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [canReadOwn, canReview, canExport, selectedFacilityId, dateFrom, dateTo])

  const myWorkedMinutes = myEntries.reduce((sum, item) => sum + (item.worked_minutes ?? 0), 0)
  const myPlannedMinutes = myEntries.reduce((sum, item) => sum + (item.planned_minutes ?? 0), 0)
  const mySubmittedCount = myEntries.filter((item) => item.status === 'submitted').length
  const myAnomalyCount = myEntries.filter((item) => item.has_anomaly).length

  const adminSubmittedCount = adminEntries.filter((item) => item.status === 'submitted').length
  const adminApprovedCount = adminEntries.filter((item) => item.status === 'approved' || item.status === 'locked').length
  const adminAnomalyCount = adminEntries.filter((item) => item.has_anomaly).length
  const adminOvertimeMinutes = adminEntries.reduce((sum, item) => sum + (item.overtime_minutes ?? 0), 0)
  const anomalyItems = adminEntries.filter((item) => item.has_anomaly).slice(0, 5)

  return (
    <div className='container-fluid py-3'>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <div>
          <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Timesheet</h5>
          <div className='small text-muted'>Consuntivo presenze, verifica scostamenti e approvazione operativa.</div>
        </div>
        <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
          <Info size={13} /> Info
        </Button>
      </div>

      {(canReview || canExport) && facilities.length > 0 && (
        <Card className='mb-3'>
          <CardBody className='py-2'>
            <div className='d-flex flex-wrap align-items-center gap-2'>
              <div className='small text-muted me-2'>Vista struttura</div>
              <Input
                type='select'
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
                style={{ maxWidth: 320 }}
              >
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>{facility.name}</option>
                ))}
              </Input>
              <div className='small text-muted ms-auto'>Periodo corrente: {fmtDate(dateFrom)} - {fmtDate(dateTo)}</div>
            </div>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <Card><CardBody className='text-center py-5 text-muted'>Caricamento dashboard timesheet…</CardBody></Card>
      ) : (
        <>
          <Row className='g-3 mb-3'>
            <Col md='3'><StatCard title='Ore lavorate mese' value={minsToHM(myWorkedMinutes)} subtitle='Vista personale' icon={<Clock size={22} />} tone='primary' /></Col>
            <Col md='3'><StatCard title='Ore pianificate mese' value={minsToHM(myPlannedMinutes)} subtitle='Confronto col pianificato' icon={<Calendar size={22} />} tone='success' /></Col>
            <Col md='3'><StatCard title='Entry inviate' value={mySubmittedCount} subtitle='In attesa di verifica' icon={<FileText size={22} />} tone='warning' /></Col>
            <Col md='3'><StatCard title='Anomalie personali' value={myAnomalyCount} subtitle={lastEventLabel(todayEvents)} icon={<AlertTriangle size={22} />} tone='danger' /></Col>
          </Row>

          {(canReview || canExport) && (
            <Row className='g-3 mb-3'>
              <Col md='3'><StatCard title='Entry struttura da approvare' value={adminSubmittedCount} subtitle='Stato submitted' icon={<UserCheck size={22} />} tone='warning' /></Col>
              <Col md='3'><StatCard title='Entry approvate/bloccate' value={adminApprovedCount} subtitle='Pronte per export' icon={<CheckCircle size={22} />} tone='success' /></Col>
              <Col md='3'><StatCard title='Anomalie struttura' value={adminAnomalyCount} subtitle='Richiedono verifica' icon={<AlertTriangle size={22} />} tone='danger' /></Col>
              <Col md='3'><StatCard title='Straordinari struttura' value={minsToHM(adminOvertimeMinutes)} subtitle='Accumulo nel mese' icon={<Clock size={22} />} tone='primary' /></Col>
            </Row>
          )}

          <Row className='g-3'>
            <Col xl='8'>
              <Card className='h-100'>
                <CardHeader className='py-2'>
                  <strong>Azioni rapide modulo</strong>
                </CardHeader>
                <CardBody>
                  <div className='d-flex flex-wrap gap-2 mb-3'>
                    <Button tag={Link} to='/turni/presenze' color='primary'>Le mie presenze</Button>
                    <Button tag={Link} to='/turni/mia-settimana' color='outline-primary'>La mia settimana</Button>
                    <Button tag={Link} to='/turni' color='outline-primary'>Pianificazione</Button>
                    {canReview && <Button tag={Link} to='/turni/verifica' color='warning'>Verifica timesheet</Button>}
                    {canExport && <Button tag={Link} to='/turni/export' color='success'><Download size={14} className='me-1' />Export presenze</Button>}
                  </div>

                  <Alert color='info' className='small'>
                    Il modulo timesheet separa sempre <strong>pianificato</strong> e <strong>consuntivo reale</strong>.
                    La timbratura genera eventi presenza; il sistema ricompone poi l&apos;entry giornaliera da verificare o approvare.
                  </Alert>

                  <Table responsive className='table-sm align-middle mb-0'>
                    <thead className='table-light'>
                      <tr>
                        <th>Ambito</th>
                        <th>Cosa fare qui</th>
                        <th>Pagina</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Operatore</td>
                        <td>Timbrature entrata/uscita/pausa e invio entry</td>
                        <td><Link to='/turni/presenze'>Le mie presenze</Link></td>
                      </tr>
                      <tr>
                        <td>Coordinamento</td>
                        <td>Verifica anomalie, approvazione e rifiuto</td>
                        <td><Link to='/turni/verifica'>Verifica timesheet</Link></td>
                      </tr>
                      <tr>
                        <td>Amministrazione</td>
                        <td>Estrazione mensile delle entry consolidate</td>
                        <td><Link to='/turni/export'>Export presenze</Link></td>
                      </tr>
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            </Col>

            <Col xl='4'>
              <Card className='h-100'>
                <CardHeader className='py-2'>
                  <strong>Controlli prioritari</strong>
                </CardHeader>
                <CardBody>
                  {(canReview || canExport) ? (
                    anomalyItems.length > 0 ? (
                      <div className='d-flex flex-column gap-2'>
                        {anomalyItems.map((item) => (
                          <div key={item.id} className='border rounded p-2 small'>
                            <div className='fw-semibold'>{item.staff_member?.display_name ?? (`${item.staff_member?.last_name ?? ''} ${item.staff_member?.first_name ?? ''}`.trim() || 'Operatore')}</div>
                            <div className='text-muted'>{fmtDate(item.work_date)} - scostamento {minsToHM(item.delta_minutes)}</div>
                            <div>{item.anomaly_notes ?? 'Anomalia rilevata sul consuntivo.'}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-muted small'>Nessuna anomalia aperta nel periodo corrente.</div>
                    )
                  ) : (
                    <div className='text-muted small'>
                      Qui vedrai i controlli struttura quando il tuo ruolo include verifica o export del timesheet.
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Timesheet — Guida'>
        <p>Questa è la pagina di ingresso del modulo <strong>Timesheet</strong>.</p>
        <p>Il flusso corretto è: <strong>pianificazione turno</strong> → <strong>timbrature</strong> → <strong>entry timesheet</strong> → <strong>verifica/approvazione</strong> → <strong>export</strong>.</p>
        <p>Le timbrature non sostituiscono il turno pianificato: servono a produrre il consuntivo reale.</p>
        <p className='text-muted small'>Le rettifiche avanzate, il PDF presenze e la chiusura periodo restano evoluzioni successive del modulo.</p>
      </InfoDrawer>
    </div>
  )
}
