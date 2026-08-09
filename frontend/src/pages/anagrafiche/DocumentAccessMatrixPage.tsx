import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Alert, Badge,
} from 'reactstrap'
import { Home, FileText, CheckCircle, XCircle, AlertTriangle } from 'react-feather'
import { adminRoleApi, apiError } from '../../services/api'
import type { DocumentAccessMatrix, DocumentAccessRole, DocumentAccessEntry } from '../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function AccessBadge({ access, hasRbac = true }: { access: boolean; hasRbac?: boolean }) {
  if (!hasRbac) {
    return (
      <span className='d-flex align-items-center gap-1 text-warning small'>
        <AlertTriangle size={12} /> No RBAC base
      </span>
    )
  }
  if (!access) {
    return (
      <span className='d-flex align-items-center gap-1 text-danger small'>
        <XCircle size={12} /> Non consentito
      </span>
    )
  }
  return (
    <span className='d-flex align-items-center gap-1 text-success small'>
      <CheckCircle size={12} /> Sì
    </span>
  )
}

function ReadAccessBadge({ entry }: { entry: DocumentAccessEntry }) {
  return <AccessBadge access={entry.effective_read_access} hasRbac={entry.allowed_by_classification !== false || entry.effective_read_access} />
}

function DownloadAccessBadge({ entry }: { entry: DocumentAccessEntry }) {
  return <AccessBadge access={entry.effective_download_access} />
}

function RbacBadge({ value }: { value: boolean }) {
  return value
    ? <Badge color='' className='badge-light-success' style={{ fontSize: 10 }}>Sì</Badge>
    : <Badge color='' className='badge-light-secondary' style={{ fontSize: 10 }}>No</Badge>
}

// ─── Drawer espandibile per ruolo ─────────────────────────────────────────────

function RoleAccessRow({ role, classifications }: {
  role: DocumentAccessRole
  classifications: string[]
}) {
  const [expanded, setExpanded] = useState(false)

  const readable = role.document_access
    .filter((e) => e.effective_read_access)
    .map((e) => e.classification_name)

  return (
    <>
      <tr
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <td>
          <div className='d-flex align-items-center gap-2'>
            <span className='fw-semibold'>{role.name}</span>
            <code style={{ fontSize: 11, color: '#888' }}>{role.code}</code>
          </div>
        </td>
        <td><RbacBadge value={role.rbac.attachments_read} /></td>
        <td><RbacBadge value={role.rbac.attachments_download} /></td>
        <td><RbacBadge value={role.rbac.attachments_upload} /></td>
        <td>
          {readable.length > 0
            ? readable.map((n) => (
                <Badge key={n} color='' className='badge-light-primary me-1' style={{ fontSize: 10 }}>{n}</Badge>
              ))
            : <span className='text-muted small'>Nessuna</span>}
        </td>
        <td>
          <span className='text-muted small' style={{ fontSize: 11 }}>
            {expanded ? '▲ chiudi' : '▼ dettaglio'}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ background: '#f8f9fa', padding: '12px 20px' }}>
            <div className='fw-semibold small text-muted mb-2'>Accesso per classificazione</div>
            <table className='table table-sm table-bordered mb-2' style={{ fontSize: 12 }}>
              <thead className='table-light'>
                <tr>
                  <th>Classificazione</th>
                  <th>Lettura effettiva</th>
                  <th>Regola lettura</th>
                  <th>Download effettivo</th>
                  <th>Regola download</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {role.document_access
                  .filter((e) => classifications.includes(e.classification_code))
                  .map((entry) => (
                    <tr key={entry.classification_code}>
                      <td>
                        <code style={{ fontSize: 11 }}>{entry.classification_code}</code>
                        {' '}{entry.classification_name}
                        {!entry.classification_active && (
                          <Badge color='' className='badge-light-secondary ms-1' style={{ fontSize: 9 }}>inattiva</Badge>
                        )}
                      </td>
                      <td><ReadAccessBadge entry={entry} /></td>
                      <td style={{ fontSize: 11, color: '#555' }}>{entry.effective_read_rule || '—'}</td>
                      <td><DownloadAccessBadge entry={entry} /></td>
                      <td style={{ fontSize: 11, color: '#555' }}>{entry.effective_download_rule || '—'}</td>
                      <td style={{ fontSize: 11, color: '#777' }}>{entry.notes ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!role.rbac.attachments_read && (
              <div className='alert alert-warning py-2 px-3 mb-2' style={{ fontSize: 12 }}>
                <strong>Attenzione:</strong> questo ruolo non dispone del permesso RBAC <code>attachments.read</code> di base.
                Anche se una classificazione lo ammettesse, non potrebbe leggere documenti.
              </div>
            )}
            {!role.rbac.attachments_download && (
              <div className='alert alert-info py-2 px-3 mb-0' style={{ fontSize: 12 }}>
                Questo ruolo non dispone del permesso RBAC <code>attachments.download</code>: gli utenti con questo ruolo
                possono aprire documenti in preview ma non scaricarli sul proprio device.
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Pagina principale ────────────────────────────────────────────────────────

export default function DocumentAccessMatrixPage() {
  const [matrix, setMatrix]   = useState<DocumentAccessMatrix | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    adminRoleApi.getDocumentAccessMatrix()
      .then(setMatrix)
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 403) setError('Non hai i permessi per visualizzare la matrice accesso documentale.')
        else setError(ae.message ?? 'Errore caricamento matrice')
      })
      .finally(() => setLoading(false))
  }, [])

  const classificationCodes = matrix?.classifications.map((c) => c.code) ?? []

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <FileText size={18} className='text-primary' />
                <h3 className='mb-0'>Matrice accesso documentale</h3>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Anagrafiche</li>
                <li className='breadcrumb-item'><Link to='/anagrafiche/ruoli'>Ruoli</Link></li>
                <li className='breadcrumb-item active'>Accesso documentale</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        {/* Box introduttivo RBAC vs ABAC */}
        <Row className='mb-4'>
          <Col md='6'>
            <div className='alert alert-info mb-0' style={{ fontSize: 13 }}>
              <strong>RBAC</strong> — controlla l'accesso ai moduli e alle funzioni del sistema
              (es. poter aprire la sezione Documenti, caricare un file).
              I permessi chiave per i documenti sono <code>attachments.read</code>, <code>attachments.download</code> e <code>attachments.upload</code>.
            </div>
          </Col>
          <Col md='6'>
            <div className='alert alert-warning mb-0' style={{ fontSize: 13 }}>
              <strong>ABAC documentale</strong> — controlla l'accesso effettivo ai singoli documenti
              in base a classificazione, ruolo nella struttura e assegnazione attiva al minore.<br />
              <strong>Preview documento = attachments.read + classificazione ammessa + assegnazione minore</strong><br /><strong>Download documento = attachments.download + classificazione ammessa + assegnazione minore</strong>
            </div>
          </Col>
        </Row>

        {/* Avviso ruoli nuovi */}
        <div className='alert alert-secondary mb-4 d-flex align-items-start gap-2' style={{ fontSize: 13 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Ruoli personalizzati</strong> — un ruolo con il permesso <code>attachments.read</code>
            può vedere il modulo documenti, ma se non è incluso tra i ruoli ammessi da una classificazione,
            non potrà leggere i documenti di quella classificazione. Il permesso RBAC da solo non è sufficiente.
          </div>
        </div>

        {loading && (
          <div className='text-center py-5'><span className='spinner-border text-primary' /></div>
        )}
        {error && <Alert color='warning'>{error}</Alert>}

        {!loading && matrix && (
          <>
            {/* Riepilogo classificazioni */}
            <Card className='mb-4'>
              <CardHeader>
                <h5 className='mb-0'>Classificazioni documentali</h5>
              </CardHeader>
              <CardBody>
                <p className='text-muted small mb-3'>{matrix.meta.summary}</p>
                <div className='table-responsive'>
                  <table className='table table-sm table-bordered'>
                    <thead className='table-light'>
                      <tr>
                        <th>Codice</th>
                        <th>Nome</th>
                        <th>Descrizione</th>
                        <th>Ruoli lettura</th>
                        <th>Ruoli download</th>
                        <th>Ass. minore richiesta</th>
                        <th>Stato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.classifications.map((cls) => (
                        <tr key={cls.code}>
                          <td><code style={{ fontSize: 12 }}>{cls.code}</code></td>
                          <td className='fw-semibold'>{cls.name}</td>
                          <td className='text-muted small'>{cls.description ?? '—'}</td>
                          <td>
                            {cls.allowed_role_codes.length > 0
                              ? cls.allowed_role_codes.map((rc) => (
                                  <Badge key={rc} color='' className='badge-light-primary me-1' style={{ fontSize: 10 }}>
                                    {rc}
                                  </Badge>
                                ))
                              : <span className='text-muted small'>Nessuno</span>}
                          </td>
                          <td>
                            {cls.allowed_download_role_codes.length > 0
                              ? cls.allowed_download_role_codes.map((rc) => (
                                  <Badge key={rc} color='' className='badge-light-success me-1' style={{ fontSize: 10 }}>
                                    {rc}
                                  </Badge>
                                ))
                              : <span className='text-muted small'>Nessuno</span>}
                          </td>
                          <td className='text-center'>
                            {cls.assignment_required_for_minor_documents
                              ? <Badge color='' className='badge-light-warning' style={{ fontSize: 10 }}>Sì</Badge>
                              : <Badge color='' className='badge-light-success' style={{ fontSize: 10 }}>No</Badge>}
                          </td>
                          <td>
                            {cls.is_active
                              ? <Badge color='' className='badge-light-success' style={{ fontSize: 10 }}>Attiva</Badge>
                              : <Badge color='' className='badge-light-secondary' style={{ fontSize: 10 }}>Inattiva</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            {/* Tabella ruoli */}
            <Card>
              <CardHeader>
                <h5 className='mb-0'>Accesso per ruolo</h5>
                <p className='text-muted small mb-0 mt-1'>Clicca su una riga per espandere il dettaglio per classificazione.</p>
              </CardHeader>
              <CardBody>
                <div className='table-responsive'>
                  <table className='table table-hover'>
                    <thead className='table-light'>
                      <tr>
                        <th>Ruolo</th>
                        <th>Lettura (RBAC)</th>
                        <th>Download (RBAC)</th>
                        <th>Upload (RBAC)</th>
                        <th>Classificazioni leggibili</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.roles.map((role) => (
                        <RoleAccessRow
                          key={role.id}
                          role={role}
                          classifications={classificationCodes}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className='text-muted mt-3 mb-0' style={{ fontSize: 11 }}>
                  * La lettura dei documenti del minore richiede anche un'assegnazione attiva al minore per i ruoli operativi.
                  I ruoli privilegiati (SUPER_ADMIN, DIRETTORE, COORDINATORE) hanno accesso senza assegnazione puntuale.
                </p>
              </CardBody>
            </Card>
          </>
        )}
      </Container>
    </>
  )
}
