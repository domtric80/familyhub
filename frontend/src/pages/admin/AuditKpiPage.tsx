import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, CardHeader, CardBody } from 'reactstrap'
import { Home, Shield, AlertTriangle, FileText, Eye, Activity } from 'react-feather'
import { adminAuditApi, apiError } from '../../services/api'
import type { AuditKpi } from '../../types'

export default function AuditKpiPage() {
  const [kpi, setKpi] = useState<AuditKpi | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiMissing, setApiMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    adminAuditApi.kpis()
      .then(setKpi)
      .catch((e) => {
        const err = apiError(e)
        if (err.status === 404) {
          setApiMissing(true)
        } else {
          setError(err.message ?? 'Errore caricamento KPI')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const summaryCards = kpi ? [
    {
      label: 'Login falliti',
      value: kpi.summary.login_failures,
      icon: <AlertTriangle size={22} />,
      color: '#dc3545',
      bg: '#fff5f5',
    },
    {
      label: 'Accessi documenti',
      value: kpi.summary.document_access_events,
      icon: <FileText size={22} />,
      color: '#0dcaf0',
      bg: '#f0fbff',
    },
    {
      label: 'Modifiche permessi',
      value: kpi.summary.permission_change_events,
      icon: <Shield size={22} />,
      color: '#ffc107',
      bg: '#fffdf0',
    },
    {
      label: 'Letture minori',
      value: kpi.summary.minor_read_events,
      icon: <Eye size={22} />,
      color: '#7366ff',
      bg: '#f5f4ff',
    },
    {
      label: 'Eventi totali',
      value: kpi.summary.total_events,
      icon: <Activity size={22} />,
      color: '#6c757d',
      bg: '#f8f9fa',
    },
  ] : []

  return (
    <Container fluid className='p-4'>
      {/* Breadcrumb */}
      <div className='d-flex align-items-center gap-2 mb-4' style={{ fontSize: 13, color: '#8d8d8d' }}>
        <Home size={14} />
        <span>/</span>
        <span>Amministrazione</span>
        <span>/</span>
        <span style={{ color: '#7366ff', fontWeight: 500 }}>KPI Sicurezza</span>
      </div>

      <h4 className='mb-4' style={{ color: '#3d3d3d' }}>KPI Sicurezza</h4>

      {loading && (
        <div className='text-center py-5'>
          <span className='spinner-border text-primary' />
        </div>
      )}

      {apiMissing && (
        <div className='alert alert-warning mb-4'>
          KPI non ancora disponibili sul backend. La pagina sarà operativa non appena l'API /admin/audit-logs/kpis sarà attiva.
        </div>
      )}

      {error && <div className='alert alert-danger mb-4'>{error}</div>}

      {kpi && (
        <>
          {/* Summary cards */}
          <Row className='mb-4'>
            {summaryCards.map((c) => (
              <Col md={2} sm={4} xs={6} key={c.label} className='mb-3'>
                <Card style={{ border: 'none', background: c.bg, borderRadius: 12 }}>
                  <CardBody className='text-center py-3'>
                    <div style={{ color: c.color, marginBottom: 8 }}>{c.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1 }}>{(c.value ?? 0).toLocaleString('it-IT')}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{c.label}</div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className='mb-4'>
            {/* Top attori */}
            <Col md={6}>
              <Card>
                <CardHeader><h6 className='mb-0'>Top attori</h6></CardHeader>
                <CardBody className='p-0'>
                  <table className='table table-hover mb-0'>
                    <thead className='table-light'>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Utente</th>
                        <th className='text-end'>N. eventi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpi.top_actors.length === 0 && (
                        <tr><td colSpan={3} className='text-center text-muted py-4'>Nessun dato</td></tr>
                      )}
                      {kpi.top_actors.map((a, i) => (
                        <tr key={a.user_id ?? `${a.actor_display_name ?? 'actor'}-${i}`}>
                          <td style={{ color: '#aaa', fontSize: 12 }}>{i + 1}</td>
                          <td style={{ fontSize: 13 }}>{a.actor_display_name ?? '—'}</td>
                          <td className='text-end' style={{ fontWeight: 600 }}>{(a.total ?? 0).toLocaleString('it-IT')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            </Col>

            {/* Breakdown risorse */}
            <Col md={6}>
              <Card>
                <CardHeader><h6 className='mb-0'>Breakdown per risorsa</h6></CardHeader>
                <CardBody className='p-0'>
                  <table className='table table-hover mb-0'>
                    <thead className='table-light'>
                      <tr>
                        <th>Tipo risorsa</th>
                        <th className='text-end'>Conteggio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpi.resource_breakdown.length === 0 && (
                        <tr><td colSpan={2} className='text-center text-muted py-4'>Nessun dato</td></tr>
                      )}
                      {kpi.resource_breakdown.map((r, i) => (
                        <tr key={r.resource_type ?? i}>
                          <td style={{ fontSize: 13 }}>{r.resource_type ?? '—'}</td>
                          <td className='text-end' style={{ fontWeight: 600 }}>{(r.total ?? 0).toLocaleString('it-IT')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row className='mb-4'>
            {/* Breakdown azioni */}
            <Col md={6}>
              <Card>
                <CardHeader><h6 className='mb-0'>Breakdown per azione</h6></CardHeader>
                <CardBody className='p-0'>
                  <table className='table table-hover mb-0'>
                    <thead className='table-light'>
                      <tr>
                        <th>Azione</th>
                        <th className='text-end'>Conteggio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(kpi.action_breakdown ?? []).length === 0 && (
                        <tr><td colSpan={2} className='text-center text-muted py-4'>Nessun dato</td></tr>
                      )}
                      {(kpi.action_breakdown ?? []).map((a, i) => (
                        <tr key={a.action ?? i}>
                          <td style={{ fontSize: 13 }}>{a.action ?? '—'}</td>
                          <td className='text-end' style={{ fontWeight: 600 }}>{(a.total ?? 0).toLocaleString('it-IT')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            </Col>

            {/* Serie giornaliera */}
            <Col md={6}>
              <Card>
                <CardHeader><h6 className='mb-0'>Serie giornaliera (ultimi 30 giorni)</h6></CardHeader>
                <CardBody className='p-0'>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    <table className='table table-hover mb-0'>
                      <thead className='table-light' style={{ position: 'sticky', top: 0 }}>
                        <tr>
                          <th>Data</th>
                          <th className='text-end'>Conteggio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kpi.daily_series.length === 0 && (
                          <tr><td colSpan={2} className='text-center text-muted py-4'>Nessun dato</td></tr>
                        )}
                        {[...kpi.daily_series].sort((a, b) => (b.day ?? '').localeCompare(a.day ?? '')).slice(0, 30).map((d, i) => (
                          <tr key={d.day ?? i}>
                            <td style={{ fontSize: 13 }}>{d.day ?? '—'}</td>
                            <td className='text-end' style={{ fontWeight: 600 }}>{(d.total ?? 0).toLocaleString('it-IT')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  )
}
