import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Input, Label, Alert, Button,
} from 'reactstrap'
import { Home, RefreshCw } from 'react-feather'
import { staffHRDashboardApi, facilityApi, apiError } from '../../services/api'
import type { StaffHRDashboard, StaffHRAlertItem, Facility } from '../../types'

function fmtDate(s?: string | null) { return s ? new Date(s).toLocaleDateString('it-IT') : '—' }

const STATUS_BADGE: Record<string, string> = {
  expired: 'badge-light-danger',
  expiring: 'badge-light-warning',
  revoked: 'badge-light-secondary',
  missing: 'badge-light-danger',
}
const STATUS_LABEL: Record<string, string> = {
  expired: 'Scaduto',
  expiring: 'In scadenza',
  revoked: 'Revocato',
  missing: 'Mancante',
}

export default function DashboardHRPage() {
  const [dashboard, setDashboard] = useState<StaffHRDashboard | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [filterFacility, setFilterFacility] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true); setError(null)
    const params = filterFacility ? { facility_id: Number(filterFacility) } : undefined
    staffHRDashboardApi.get(params)
      .then(setDashboard)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento dashboard'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { facilityApi.list().then(setFacilities).catch(() => {}) }, [])
  useEffect(() => { load() }, [filterFacility]) // eslint-disable-line

  const kpis = dashboard?.kpis
  const alerts = dashboard?.alerts

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Dashboard HR</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Amministrazione</li>
                <li className='breadcrumb-item active'>Dashboard HR</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 13 }}>
          La dashboard evidenzia scadenze e requisiti da verificare. Non modifica turni, ruoli o accessi al sistema. La consultazione è auditata automaticamente dal backend.
        </div>

        {/* Filtro struttura */}
        <Card className='mb-3'>
          <CardBody className='py-2'>
            <div className='d-flex align-items-center gap-3'>
              <Label className='mb-0 small'>Struttura:</Label>
              <Input type='select' bsSize='sm' style={{ width: 220 }} value={filterFacility}
                onChange={(e) => setFilterFacility(e.target.value)}>
                <option value=''>Tutte le strutture</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Input>
              <Button size='sm' color='light' className='d-flex align-items-center gap-1' onClick={load}>
                <RefreshCw size={12} /> Aggiorna
              </Button>
            </div>
          </CardBody>
        </Card>

        {error && <Alert color='danger'>{error}</Alert>}

        {loading ? <div className='text-center py-5'><div className='loader' /></div> : !kpis ? null : (
          <>
            {/* KPI grid */}
            <Row className='mb-4'>
              {[
                { label: 'Personale totale', value: kpis.total_staff, color: 'primary' },
                { label: 'Attivi', value: kpis.active_staff, color: 'success' },
                { label: 'Senza utenza app', value: kpis.staff_without_account, color: kpis.staff_without_account > 0 ? 'warning' : 'secondary' },
                { label: 'Senza competenze', value: kpis.staff_without_skills, color: kpis.staff_without_skills > 0 ? 'warning' : 'secondary' },
                { label: 'Senza lingue', value: kpis.staff_without_languages, color: kpis.staff_without_languages > 0 ? 'warning' : 'secondary' },
                { label: 'Doc. scaduti', value: kpis.documents_expired, color: kpis.documents_expired > 0 ? 'danger' : 'secondary' },
                { label: 'Doc. in scadenza', value: kpis.documents_expiring, color: kpis.documents_expiring > 0 ? 'warning' : 'secondary' },
                { label: 'Cert. scadute', value: kpis.certifications_expired, color: kpis.certifications_expired > 0 ? 'danger' : 'secondary' },
                { label: 'Cert. in scadenza', value: kpis.certifications_expiring, color: kpis.certifications_expiring > 0 ? 'warning' : 'secondary' },
                { label: 'Requisiti mancanti', value: kpis.missing_requirements, color: kpis.missing_requirements > 0 ? 'danger' : 'secondary' },
              ].map((k) => (
                <Col xs='6' md='4' lg='2' key={k.label} className='mb-3'>
                  <Card className='text-center h-100'>
                    <CardBody className='p-2'>
                      <div className={`h3 mb-0 text-${k.color}`}>{k.value}</div>
                      <small className='text-muted'>{k.label}</small>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Alert Documenti */}
            {alerts && alerts.documents.length > 0 && (
              <Card className='mb-3'>
                <CardHeader>
                  <h6 className='mb-0'>Documenti in scadenza o scaduti <span className='badge badge-light-danger ms-1'>{alerts.documents.length}</span></h6>
                </CardHeader>
                <CardBody className='p-0'>
                  <AlertTable rows={alerts.documents} linkField='staff_member_id' nameField='document_type_name' />
                </CardBody>
              </Card>
            )}

            {/* Alert Certificazioni */}
            {alerts && alerts.certifications.length > 0 && (
              <Card className='mb-3'>
                <CardHeader>
                  <h6 className='mb-0'>Certificazioni in scadenza o scadute <span className='badge badge-light-danger ms-1'>{alerts.certifications.length}</span></h6>
                </CardHeader>
                <CardBody className='p-0'>
                  <AlertTable rows={alerts.certifications} linkField='staff_member_id' nameField='certification_type_name' />
                </CardBody>
              </Card>
            )}

            {/* Alert Requisiti mancanti */}
            {alerts && alerts.missing_requirements.length > 0 && (
              <Card className='mb-3'>
                <CardHeader>
                  <h6 className='mb-0'>Requisiti certificativi mancanti <span className='badge badge-light-danger ms-1'>{alerts.missing_requirements.length}</span></h6>
                </CardHeader>
                <CardBody className='p-0'>
                  <AlertTable rows={alerts.missing_requirements} linkField='staff_member_id' nameField='certification_type_name' />
                </CardBody>
              </Card>
            )}

            {alerts && alerts.documents.length === 0 && alerts.certifications.length === 0 && alerts.missing_requirements.length === 0 && (
              <Alert color='success'>Nessun alert attivo. Tutti i documenti e le certificazioni risultano conformi.</Alert>
            )}

            {dashboard.configuration && (
              <p className='text-muted small'>
                Soglia preavviso scadenze: {dashboard.configuration.document_expiry_alert_days} giorni (configurata dal backend).
              </p>
            )}
          </>
        )}
      </Container>
    </>
  )
}

// ─── Tabella alert riutilizzabile ─────────────────────────────────────────────

function AlertTable({
  rows,
  nameField,
}: {
  rows: StaffHRAlertItem[]
  linkField: 'staff_member_id'
  nameField: 'document_type_name' | 'certification_type_name'
}) {
  return (
    <div className='table-responsive'>
      <table className='table table-hover table-sm align-middle mb-0'>
        <thead className='table-light'>
          <tr>
            <th>Professionista</th>
            <th>Struttura</th>
            <th>Tipo</th>
            <th>Stato</th>
            <th>Scadenza</th>
            <th>Giorni</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className='small fw-semibold'>{r.display_name}</td>
              <td className='small text-muted'>{r.facility_name ?? '—'}</td>
              <td className='small'>{r[nameField] ?? '—'}</td>
              <td>
                <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-light-secondary'}`}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </td>
              <td className='small'>{fmtDate(r.expiry_date)}</td>
              <td className='small text-center'>{r.days_until_expiry != null ? r.days_until_expiry : '—'}</td>
              <td>
                <Link to={`/educatori/${r.staff_member_id}`} className='btn btn-sm btn-outline-primary py-0 px-2' style={{ fontSize: 11 }}>
                  Scheda
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
