import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, CardHeader, CardBody, Table, Badge } from 'reactstrap'
import { toast } from 'react-toastify'
import { Shield } from 'react-feather'
import { authApi, apiError } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { MfaStatusResponse } from '../../types'

export default function ProfiloPage() {
  const { user, refresh } = useAuth()
  const [mfaStatus, setMfaStatus] = useState<MfaStatusResponse | null>(null)
  const [loadingMfa, setLoadingMfa] = useState(true)

  useEffect(() => {
    refresh().catch(() => {})
    authApi.mfaStatus()
      .then(setMfaStatus)
      .catch((e) => toast.error(apiError(e).message ?? 'Errore stato MFA'))
      .finally(() => setLoadingMfa(false))
  }, [])

  return (
    <Container fluid>
      <div className="page-title">
        <Row>
          <Col xs={6}><h3>Profilo utente</h3></Col>
          <Col xs={6}>
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item">Sicurezza</li>
              <li className="breadcrumb-item active">Profilo utente</li>
            </ol>
          </Col>
        </Row>
      </div>

      <Row>
        <Col xl={6} md={12}>
          <Card>
            <CardHeader><h5 className="mb-0">Dati personali</h5></CardHeader>
            <CardBody>
              {!user ? (
                <div className="text-center py-4"><div className="loader-box"><div className="loader-15" /></div></div>
              ) : (
                <Table borderless className="mb-0">
                  <tbody>
                    <tr>
                      <th style={{ width: 160 }}>Nome</th>
                      <td>{user.first_name}</td>
                    </tr>
                    <tr>
                      <th>Cognome</th>
                      <td>{user.last_name}</td>
                    </tr>
                    <tr>
                      <th>Email</th>
                      <td>{user.email}</td>
                    </tr>
                    <tr>
                      <th>Stato account</th>
                      <td>
                        <span className={`badge badge-light-${user.is_active ? 'success' : 'danger'}`}>
                          {user.is_active ? 'Attivo' : 'Disabilitato'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>MFA</th>
                      <td>
                        <span className={`badge badge-light-${user.mfa_confirmed_at ? 'success' : 'warning'}`}>
                          {user.mfa_confirmed_at ? 'Attiva' : 'Non attiva'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col xl={6} md={12}>
          <Card>
            <CardHeader><h5 className="mb-0">Ruoli e strutture</h5></CardHeader>
            <CardBody>
              {!user?.user_facility_roles || !user.user_facility_roles.some((fr) => fr.is_active !== false) ? (
                <p className="text-muted mb-0">Nessuna assegnazione</p>
              ) : (
                <Table size="sm" className="mb-0 table-border-horizontal">
                  <thead>
                    <tr>
                      <th>Struttura</th>
                      <th>Ruolo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.user_facility_roles.filter((fr) => fr.is_active !== false).map((fr) => (
                      <tr key={fr.id}>
                        <td>{fr.facility?.name ?? '—'}</td>
                        <td>
                          <Badge color="light" className="text-primary">{fr.role?.name ?? fr.role?.code ?? '—'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col xl={6} md={12}>
          <Card>
            <CardHeader><h5 className="mb-0">Permessi applicativi</h5></CardHeader>
            <CardBody>
              {!user?.capabilities?.permissions || user.capabilities.permissions.length === 0 ? (
                <p className="text-muted mb-0">Nessun permesso</p>
              ) : (
                <div className="d-flex flex-wrap gap-1">
                  {user.capabilities.permissions.map((p) => (
                    <span key={p} className="badge badge-light-secondary mb-1">{p}</span>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col xl={6} md={12}>
          <Card>
            <CardHeader><h5 className="mb-0">Classificazioni documentali consentite</h5></CardHeader>
            <CardBody>
              {!user?.capabilities?.document_classifications || user.capabilities.document_classifications.length === 0 ? (
                <p className="text-muted mb-0">Nessuna classificazione</p>
              ) : (
                <div className="d-flex flex-wrap gap-1">
                  {user.capabilities.document_classifications.map((dc) => (
                    <span key={dc.code} className="badge badge-light-info mb-1" title={dc.description ?? undefined}>{dc.name}</span>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col sm={12}>
          <Card>
            <CardHeader className="d-flex align-items-center gap-2">
              <Shield size={18} className="text-primary" />
              <h5 className="mb-0">Stato MFA</h5>
            </CardHeader>
            <CardBody>
              {loadingMfa ? (
                <div className="text-center py-4"><div className="loader-box"><div className="loader-15" /></div></div>
              ) : mfaStatus ? (
                <Row className="align-items-center">
                  <Col auto>
                    <span className={`badge badge-light-${mfaStatus.confirmed ? 'success' : 'warning'} f-14`}>
                      {mfaStatus.confirmed ? 'MFA attiva e confermata' : 'MFA non attiva'}
                    </span>
                  </Col>
                  {mfaStatus.confirmed && (
                    <Col auto>
                      <span className="text-muted f-12">
                        Codici di recupero rimanenti: <strong>{mfaStatus.recovery_codes_remaining}</strong>
                      </span>
                    </Col>
                  )}
                  <Col sm={12} className="mt-3">
                    <a href="/mfa/config" className="btn btn-outline-primary btn-sm">
                      Gestisci MFA
                    </a>
                  </Col>
                </Row>
              ) : (
                <p className="text-muted mb-0">Stato MFA non disponibile</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
