import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Input, Alert, Button,
} from 'reactstrap'
import { Home, Plus, AlertTriangle } from 'react-feather'
import { incidentApi, facilityApi, minorApi, apiError } from '../../services/api'
import type { Incident, Facility, Minor, IncidentOptions } from '../../types'

function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

export default function IncidentiPage() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [options, setOptions]     = useState<IncidentOptions | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [minors, setMinors]       = useState<Minor[]>([])

  // Filtri
  const [filterFacility, setFilterFacility] = useState(0)
  const [filterMinor, setFilterMinor]       = useState(0)
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterStatus, setFilterStatus]     = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo]     = useState('')

  const load = () => {
    setLoading(true); setError(null)
    incidentApi.list({
      ...(filterFacility ? { facility_id: filterFacility } : {}),
      ...(filterMinor ? { minor_id: filterMinor } : {}),
      ...(filterSeverity ? { severity: filterSeverity } : {}),
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(filterDateFrom ? { date_from: filterDateFrom } : {}),
      ...(filterDateTo ? { date_to: filterDateTo } : {}),
    }).then(setIncidents)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([
      incidentApi.options(),
      facilityApi.list(),
      minorApi.list(),
    ]).then(([opts, facs, mins]) => {
      setOptions(opts)
      setFacilities(facs)
      setMinors(Array.isArray(mins) ? mins : (mins as any).data ?? [])
    }).catch(() => {})
    load()
  }, []) // eslint-disable-line

  const getSeverityColor = (code: string) => {
    const opt = options?.severity_levels.find((s) => s.code === code)
    if (!opt) return 'secondary'
    return opt.color === 'green' ? 'success' : opt.color === 'red' ? 'danger' : 'warning'
  }

  const getSeverityLabel = (code: string) =>
    options?.severity_levels.find((s) => s.code === code)?.label ?? code

  const getStatusLabel = (code: string) =>
    options?.statuses.find((s) => s.code === code)?.label ?? code

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Incidenti e segnalazioni</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Incidenti</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Row><Col>
          <Card>
            <CardHeader>
              <div className='d-flex align-items-center justify-content-between flex-wrap gap-2'>
                <div className='d-flex align-items-center gap-2 flex-wrap'>
                  <Input type='select' bsSize='sm' style={{ width: 150 }} value={filterFacility}
                    onChange={(e) => setFilterFacility(Number(e.target.value))}>
                    <option value={0}>Tutte le strutture</option>
                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Input>
                  <Input type='select' bsSize='sm' style={{ width: 150 }} value={filterMinor}
                    onChange={(e) => setFilterMinor(Number(e.target.value))}>
                    <option value={0}>Tutti i minori</option>
                    {minors.map((m) => <option key={m.id} value={m.id}>{m.last_name} {m.first_name}</option>)}
                  </Input>
                  <Input type='select' bsSize='sm' style={{ width: 120 }} value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}>
                    <option value=''>Gravità</option>
                    {options?.severity_levels.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
                  </Input>
                  <Input type='select' bsSize='sm' style={{ width: 120 }} value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value=''>Stato</option>
                    {options?.statuses.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
                  </Input>
                  <Input type='date' bsSize='sm' style={{ width: 130 }} value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)} placeholder='Dal' />
                  <Input type='date' bsSize='sm' style={{ width: 130 }} value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)} placeholder='Al' />
                  <Button size='sm' color='primary' outline onClick={load}>Filtra</Button>
                </div>
                <Button color='danger' size='sm' onClick={() => navigate('/incidenti/nuova')}>
                  <Plus size={13} className='me-1' />Nuova segnalazione
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className='alert alert-warning py-2 px-3 mb-3' style={{ fontSize: 13 }}>
                Il registro incidenti documenta eventi critici e ne guida l'escalation formale. Ogni passaggio è tracciato, non cancellabile e visibile solo agli utenti autorizzati sul minore. La precompilazione per un'autorità non equivale a un invio automatico.
              </div>
              {error && <Alert color='danger'>{error}</Alert>}
              {loading ? <div className='text-center py-4'><div className='loader' /></div> : (
                incidents.length === 0 ? <p className='text-muted text-center py-4'>Nessun incidente registrato.</p> : (
                  <div className='table-responsive'>
                    <table className='table table-hover table-sm'>
                      <thead className='table-light'>
                        <tr>
                          <th>#</th><th>Titolo</th><th>Minore</th><th>Gravità</th><th>Stato</th><th>Accaduto il</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.map((inc) => (
                          <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/incidenti/${inc.id}`)}>
                            <td className='small text-muted'>{inc.id}</td>
                            <td>
                              <div className='fw-semibold'>{inc.title}</div>
                              <small className='text-muted'>{inc.incident_type?.name}</small>
                            </td>
                            <td className='small'>{inc.minor ? `${inc.minor.last_name} ${inc.minor.first_name}` : `#${inc.minor_id}`}</td>
                            <td>
                              <span className={`badge badge-light-${getSeverityColor(inc.severity)}`}>
                                <AlertTriangle size={10} className='me-1' />{getSeverityLabel(inc.severity)}
                              </span>
                            </td>
                            <td><span className='badge badge-light-info'>{getStatusLabel(inc.status)}</span></td>
                            <td className='small'>{fmtDt(inc.occurred_at)}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <Button size='sm' color='light' onClick={() => navigate(`/incidenti/${inc.id}`)}>Dettaglio</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </CardBody>
          </Card>
        </Col></Row>
      </Container>
    </>
  )
}
