import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Button, Alert, Input, FormGroup, Label, Badge, Table,
} from 'reactstrap'
import { Home, AlertTriangle, TrendingUp, UserX, Clock, ExternalLink, Moon, Users } from 'react-feather'
import { timesheetApi, facilityApi, apiError } from '../../services/api'
import type {
  TimesheetCoordinatorDashboardResponse,
  TimesheetDashboardSummary,
  TimesheetDashboardStaffTotal,
  TimesheetDashboardFacilityTotal,
  Facility,
} from '../../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentMonthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return { date_from: `${y}-${m}-01`, date_to: `${y}-${m}-${last}` }
}

function fmtDate(v: string) {
  try { return new Date(v + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return v }
}

function fmtDateTime(v?: string | null) {
  if (!v) return '—'
  try { return new Date(v).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }
  catch { return v }
}

function minsToHM(min?: number | null) {
  if (min == null) return '—'
  const abs = Math.abs(min)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const sign = min < 0 ? '−' : min > 0 ? '+' : ''
  return `${sign}${h}h ${m.toString().padStart(2, '0')}m`
}

function staffName(s?: { first_name: string; last_name: string; display_name?: string | null } | null) {
  if (!s) return '—'
  return s.display_name?.trim() || `${s.last_name} ${s.first_name}`
}

// Flags con resa visiva "alta priorità"
const HIGH_PRIORITY_FLAGS = new Set(['minimum_rest_violation', 'maximum_daily_hours_exceeded', 'weekly_hours_threshold_exceeded'])

function anomalyLabel(flag: string) {
  const MAP: Record<string, string> = {
    late_clock_in: 'Entrata tardiva',
    early_clock_out: 'Uscita anticipata',
    missing_clock_out: 'Uscita mancante',
    missing_clock_in: 'Entrata mancante',
    overtime_detected: 'Straordinario rilevato',
    absence_detected: 'Assenza / copertura incompleta',
    maximum_daily_hours_exceeded: 'Superamento ore giornaliere',
    minimum_rest_violation: 'Riposo minimo non rispettato',
    weekly_hours_threshold_exceeded: 'Superamento soglia settimanale',
  }
  return MAP[flag] ?? flag
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  color: string
  icon: React.ReactNode
}

function KpiCard({ label, value, sub, color, icon }: KpiCardProps) {
  return (
    <Card className='mb-0'>
      <CardBody className='d-flex align-items-center gap-3 py-3'>
        <div className='rounded-circle d-flex align-items-center justify-content-center flex-shrink-0'
          style={{ width: 44, height: 44, background: `${color}1a` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <div className='text-muted small'>{label}</div>
          <div className='fw-bold fs-5 lh-1'>{value}</div>
          {sub && <div className='text-muted' style={{ fontSize: 11 }}>{sub}</div>}
        </div>
      </CardBody>
    </Card>
  )
}

// ─── Section Box ─────────────────────────────────────────────────────────────

interface SectionBoxProps {
  title: string
  count?: number
  children: React.ReactNode
}

function SectionBox({ title, count, children }: SectionBoxProps) {
  return (
    <Card className='h-100'>
      <CardHeader className='d-flex align-items-center justify-content-between py-2'>
        <span className='fw-semibold small'>{title}</span>
        {count !== undefined && (
          <Badge color='secondary' pill className='ms-2'>{count}</Badge>
        )}
        <Link to='/turni/verifica' className='ms-auto small text-primary d-flex align-items-center gap-1' style={{ fontSize: 11 }}>
          Verifica <ExternalLink size={10} />
        </Link>
      </CardHeader>
      <CardBody className='p-0' style={{ maxHeight: 280, overflowY: 'auto' }}>
        {children}
      </CardBody>
    </Card>
  )
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

export default function TimesheetCoordDashboardPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilityId, setFacilityId] = useState<number | ''>('')
  const range = currentMonthRange()
  const [dateFrom, setDateFrom] = useState(range.date_from)
  const [dateTo, setDateTo]     = useState(range.date_to)

  const [data, setData]     = useState<TimesheetCoordinatorDashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    facilityApi.list().then(setFacilities).catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    timesheetApi.dashboardSummary({
      facility_id: facilityId !== '' ? facilityId : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })
      .then(setData)
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 403) setError('Non hai i permessi per visualizzare la dashboard timesheet.')
        else setError(ae.message ?? 'Errore caricamento dashboard.')
      })
      .finally(() => setLoading(false))
  }, [facilityId, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const s: TimesheetDashboardSummary | null = data?.summary ?? null

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <h3 className='mb-0'>Dashboard coordinatore — Timesheet</h3>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Turni</li>
                <li className='breadcrumb-item active'>Dashboard coordinatore</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>

        {/* ── Filtri ── */}
        <Card className='mb-4'>
          <CardBody className='py-2'>
            <Row className='align-items-end g-2'>
              <Col xs='12' md='3'>
                <FormGroup className='mb-0'>
                  <Label className='small mb-1'>Struttura</Label>
                  <Input type='select' bsSize='sm' value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value === '' ? '' : Number(e.target.value))}>
                    <option value=''>Tutte le strutture</option>
                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Input>
                </FormGroup>
              </Col>
              <Col xs='6' md='2'>
                <FormGroup className='mb-0'>
                  <Label className='small mb-1'>Dal</Label>
                  <Input type='date' bsSize='sm' value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </FormGroup>
              </Col>
              <Col xs='6' md='2'>
                <FormGroup className='mb-0'>
                  <Label className='small mb-1'>Al</Label>
                  <Input type='date' bsSize='sm' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </FormGroup>
              </Col>
              <Col xs='12' md='auto'>
                <Button color='primary' size='sm' onClick={load} disabled={loading}>
                  {loading ? 'Caricamento…' : 'Aggiorna'}
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {error && <Alert color='warning' className='mb-4'>{error}</Alert>}

        {/* ── KPI Cards ── */}
        <Row className='mb-4 g-3'>
          <Col xs='6' md='3'>
            <KpiCard
              label='Anomalie aperte'
              value={s?.open_anomalies_count ?? '—'}
              sub='entry non chiuse'
              color='#fa5c5c'
              icon={<AlertTriangle size={20} />}
            />
          </Col>
          <Col xs='6' md='3'>
            <KpiCard
              label='Straordinari totali'
              value={s != null ? minsToHM(s.overtime_minutes_total) : '—'}
              sub='nel periodo filtrato'
              color='#f7c604'
              icon={<TrendingUp size={20} />}
            />
          </Col>
          <Col xs='6' md='3'>
            <KpiCard
              label='Assenze riconciliate'
              value={s?.absence_reconciliations_count ?? '—'}
              sub={s != null ? minsToHM(s.absence_reconciled_minutes_total) : undefined}
              color='#7366ff'
              icon={<UserX size={20} />}
            />
          </Col>
          <Col xs='6' md='3'>
            <KpiCard
              label='Rettifiche pending'
              value={s?.pending_adjustments_count ?? '—'}
              sub='da approvare'
              color='#f76d2b'
              icon={<Clock size={20} />}
            />
          </Col>
        </Row>

        {/* ── KPI Row 2: anomalie avanzate ── */}
        <Row className='mb-4 g-3'>
          <Col xs='6' md='3'>
            <KpiCard
              label='Ore notturne'
              value={s != null ? minsToHM(s.night_minutes_total) : '—'}
              sub='nel periodo filtrato'
              color='#3a5bd9'
              icon={<Moon size={20} />}
            />
          </Col>
          <Col xs='6' md='3'>
            <KpiCard
              label='Violazioni riposo minimo'
              value={s?.minimum_rest_violations_count ?? '—'}
              sub='nel periodo filtrato'
              color='#e74c3c'
              icon={<AlertTriangle size={20} />}
            />
          </Col>
          <Col xs='6' md='3'>
            <KpiCard
              label='Superamenti ore giornaliere'
              value={s?.maximum_daily_hours_violations_count ?? '—'}
              sub='nel periodo filtrato'
              color='#e67e22'
              icon={<TrendingUp size={20} />}
            />
          </Col>
          <Col xs='6' md='3'>
            <KpiCard
              label='Operatori con anomalie'
              value={s?.staff_with_open_anomalies_count ?? '—'}
              sub='anomalie aperte'
              color='#8e44ad'
              icon={<Users size={20} />}
            />
          </Col>
        </Row>

        {/* ── Tabelle operative ── */}
        <Row className='g-3'>

          {/* Anomalie aperte */}
          <Col xs='12' md='6'>
            <SectionBox title='Anomalie aperte' count={data?.open_anomalies.length}>
              {!data ? (
                <div className='text-center py-3'><span className='spinner-border spinner-border-sm text-primary' /></div>
              ) : data.open_anomalies.length === 0 ? (
                <div className='text-muted small px-3 py-3'>Nessuna anomalia aperta.</div>
              ) : (
                <Table size='sm' className='mb-0 align-middle' style={{ fontSize: 12 }}>
                  <thead className='table-light'>
                    <tr><th>Data</th><th>Operatore</th><th>Δ</th><th>Flag</th></tr>
                  </thead>
                  <tbody>
                    {data.open_anomalies.map((row) => (
                      <tr key={row.id}>
                        <td className='text-nowrap'>{fmtDate(row.work_date)}</td>
                        <td>{staffName(row.staff_member)}</td>
                        <td className='text-nowrap'>{minsToHM(row.variance_minutes)}</td>
                        <td>
                          {row.anomaly_flags.map((f) => (
                            <Badge key={f} color='' className={`me-1 ${HIGH_PRIORITY_FLAGS.has(f) ? 'badge-light-danger' : 'badge-light-warning'}`} style={{ fontSize: 10 }}>
                              {anomalyLabel(f)}
                            </Badge>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </SectionBox>
          </Col>

          {/* Top straordinari */}
          <Col xs='12' md='6'>
            <SectionBox title='Top straordinari' count={data?.top_overtime_entries.length}>
              {!data ? (
                <div className='text-center py-3'><span className='spinner-border spinner-border-sm text-primary' /></div>
              ) : data.top_overtime_entries.length === 0 ? (
                <div className='text-muted small px-3 py-3'>Nessuno straordinario registrato.</div>
              ) : (
                <Table size='sm' className='mb-0 align-middle' style={{ fontSize: 12 }}>
                  <thead className='table-light'>
                    <tr><th>Data</th><th>Operatore</th><th>Straordinario</th><th>Pianificato</th></tr>
                  </thead>
                  <tbody>
                    {data.top_overtime_entries.map((row) => (
                      <tr key={row.id}>
                        <td className='text-nowrap'>{fmtDate(row.work_date)}</td>
                        <td>{staffName(row.staff_member)}</td>
                        <td className='text-nowrap fw-semibold'>{minsToHM('overtime_minutes' in row ? (row as any).overtime_minutes : null)}</td>
                        <td className='text-nowrap text-muted'>{minsToHM('planned_minutes' in row ? (row as any).planned_minutes : null)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </SectionBox>
          </Col>

          {/* Assenze riconciliate */}
          <Col xs='12' md='6'>
            <SectionBox title='Assenze riconciliate' count={data?.absence_reconciliations.length}>
              {!data ? (
                <div className='text-center py-3'><span className='spinner-border spinner-border-sm text-primary' /></div>
              ) : data.absence_reconciliations.length === 0 ? (
                <div className='text-muted small px-3 py-3'>Nessuna assenza riconciliata nel periodo.</div>
              ) : (
                <Table size='sm' className='mb-0 align-middle' style={{ fontSize: 12 }}>
                  <thead className='table-light'>
                    <tr><th>Data</th><th>Operatore</th><th>Delta</th><th>Revisione</th></tr>
                  </thead>
                  <tbody>
                    {data.absence_reconciliations.map((row) => (
                      <tr key={row.id}>
                        <td className='text-nowrap'>{fmtDate(row.timesheet_entry?.work_date ?? '')}</td>
                        <td>{staffName(row.timesheet_entry?.staff_member)}</td>
                        <td className='text-nowrap'>{minsToHM(row.delta_minutes)}</td>
                        <td className='text-nowrap text-muted'>{fmtDateTime(row.reviewed_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </SectionBox>
          </Col>

          {/* Rettifiche da approvare */}
          <Col xs='12' md='6'>
            <SectionBox title='Rettifiche da approvare' count={data?.pending_adjustments.length}>
              {!data ? (
                <div className='text-center py-3'><span className='spinner-border spinner-border-sm text-primary' /></div>
              ) : data.pending_adjustments.length === 0 ? (
                <div className='text-muted small px-3 py-3'>Nessuna rettifica in attesa.</div>
              ) : (
                <Table size='sm' className='mb-0 align-middle' style={{ fontSize: 12 }}>
                  <thead className='table-light'>
                    <tr><th>Data</th><th>Operatore</th><th>Tipo</th><th>Delta</th></tr>
                  </thead>
                  <tbody>
                    {data.pending_adjustments.map((row) => (
                      <tr key={row.id}>
                        <td className='text-nowrap'>{fmtDate(row.timesheet_entry?.work_date ?? '')}</td>
                        <td>{staffName(row.timesheet_entry?.staff_member)}</td>
                        <td className='text-muted' style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.adjustment_type.replace(/_/g, ' ')}
                        </td>
                        <td className='text-nowrap'>{minsToHM(row.delta_minutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </SectionBox>
          </Col>

        </Row>

        {/* ── Ore per operatore ── */}
        {data && (data.staff_totals ?? []).length > 0 && (
          <Card className='mb-4'>
            <CardHeader className='py-2'>
              <span className='fw-semibold small'>Ore per operatore</span>
              <Badge color='secondary' pill className='ms-2'>{data.staff_totals!.length}</Badge>
            </CardHeader>
            <CardBody className='p-0' style={{ overflowX: 'auto' }}>
              <Table size='sm' className='mb-0 align-middle' style={{ fontSize: 12 }}>
                <thead className='table-light'>
                  <tr>
                    <th>Operatore</th>
                    <th className='text-center'>Entry</th>
                    <th className='text-center'>Lavorate</th>
                    <th className='text-center'>Straord.</th>
                    <th className='text-center'>Notturne</th>
                    <th className='text-center'>Assenze</th>
                    <th className='text-center'>Anomalie</th>
                    <th className='text-center'>Rettifiche</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staff_totals!.map((row: TimesheetDashboardStaffTotal) => (
                    <tr key={row.staff_member.id}>
                      <td>
                        <div className='fw-semibold'>{staffName(row.staff_member)}</div>
                        {row.staff_member.employee_code && (
                          <div className='text-muted' style={{ fontSize: 10 }}>{row.staff_member.employee_code}</div>
                        )}
                      </td>
                      <td className='text-center'>{row.entries_total}</td>
                      <td className='text-center'>{minsToHM(row.worked_minutes_total)}</td>
                      <td className='text-center text-warning fw-semibold'>{minsToHM(row.overtime_minutes_total)}</td>
                      <td className='text-center' style={{ color: '#3a5bd9' }}>{minsToHM(row.night_minutes_total)}</td>
                      <td className='text-center text-muted'>{minsToHM(row.absence_minutes_total)}</td>
                      <td className='text-center'>
                        {row.anomaly_entries_count > 0
                          ? <Badge color='' className='badge-light-danger' style={{ fontSize: 10 }}>{row.anomaly_entries_count}</Badge>
                          : <span className='text-muted'>—</span>}
                      </td>
                      <td className='text-center'>
                        {row.pending_adjustments_count > 0
                          ? <Badge color='' className='badge-light-warning' style={{ fontSize: 10 }}>{row.pending_adjustments_count}</Badge>
                          : <span className='text-muted'>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* ── Totali per struttura ── */}
        {data && (data.facility_totals ?? []).length > 0 && (
          <Card className='mb-4'>
            <CardHeader className='py-2'>
              <span className='fw-semibold small'>Totali per struttura</span>
              <Badge color='secondary' pill className='ms-2'>{data.facility_totals!.length}</Badge>
            </CardHeader>
            <CardBody className='p-0' style={{ overflowX: 'auto' }}>
              <Table size='sm' className='mb-0 align-middle' style={{ fontSize: 12 }}>
                <thead className='table-light'>
                  <tr>
                    <th>Struttura</th>
                    <th className='text-center'>Entry</th>
                    <th className='text-center'>Lavorate</th>
                    <th className='text-center'>Straord.</th>
                    <th className='text-center'>Notturne</th>
                    <th className='text-center'>Assenze</th>
                    <th className='text-center'>Con anomalie</th>
                  </tr>
                </thead>
                <tbody>
                  {data.facility_totals!.map((row: TimesheetDashboardFacilityTotal) => (
                    <tr key={row.facility.id}>
                      <td className='fw-semibold'>{row.facility.name}</td>
                      <td className='text-center'>{row.entries_total}</td>
                      <td className='text-center'>{minsToHM(row.worked_minutes_total)}</td>
                      <td className='text-center text-warning fw-semibold'>{minsToHM(row.overtime_minutes_total)}</td>
                      <td className='text-center' style={{ color: '#3a5bd9' }}>{minsToHM(row.night_minutes_total)}</td>
                      <td className='text-center text-muted'>{minsToHM(row.absence_minutes_total)}</td>
                      <td className='text-center'>
                        {row.anomaly_entries_count > 0
                          ? <Badge color='' className='badge-light-danger' style={{ fontSize: 10 }}>{row.anomaly_entries_count}</Badge>
                          : <span className='text-muted'>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* Info extra */}
        <div className='text-muted mt-3 mb-4' style={{ fontSize: 11 }}>
          Le liste mostrano massimo 8 righe per box. Per il dettaglio completo usa{' '}
          <Link to='/turni/verifica' className='text-primary'>Verifica timesheet</Link>.
          Il contatore KPI "Rettifiche pending" riflette il totale reale, non le righe visualizzate.
        </div>

      </Container>
    </>
  )
}
