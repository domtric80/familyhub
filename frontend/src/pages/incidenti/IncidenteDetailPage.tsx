import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, AlertTriangle, FileText } from 'react-feather'
import { toast } from 'react-toastify'
import { incidentApi, lookupsApi, apiError } from '../../services/api'
import type { Incident, IncidentOptions, IncidentAuthorityReport, DocumentIssuer } from '../../types'

function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

export default function IncidenteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const incidentId = Number(id)
  const navigate = useNavigate()

  const [incident, setIncident]   = useState<Incident | null>(null)
  const [options, setOptions]     = useState<IncidentOptions | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [issuers, setIssuers]     = useState<DocumentIssuer[]>([])

  // Transizione stato
  const [transitionModal, setTransitionModal]   = useState(false)
  const [transitionCode, setTransitionCode]     = useState('')
  const [transitionNotes, setTransitionNotes]   = useState('')
  const [transitioning, setTransitioning]       = useState(false)

  // Analisi RCA
  const [analysisModal, setAnalysisModal]       = useState(false)
  const [analysis, setAnalysis]                 = useState({ root_cause: '', contributing_factors: '', corrective_actions: '' })
  const [savingAnalysis, setSavingAnalysis]     = useState(false)

  // Notifica esterna
  const [notifModal, setNotifModal]             = useState(false)
  const [notif, setNotif]                       = useState({ authority_id: 0, notified_at: '', method: 'telefono', notes: '' })
  const [savingNotif, setSavingNotif]           = useState(false)

  // Report autorità
  const [reportModal, setReportModal]           = useState(false)
  const [report, setReport]                     = useState<IncidentAuthorityReport | null>(null)
  const [loadingReport, setLoadingReport]       = useState(false)

  const load = () => {
    setLoading(true); setError(null)
    Promise.all([
      incidentApi.get(incidentId),
      incidentApi.options(),
      lookupsApi.documentIssuers().catch(() => []),
    ]).then(([inc, opts, iss]) => {
      setIncident(inc); setOptions(opts)
      setIssuers(iss as DocumentIssuer[])
      if (inc.analysis) {
        setAnalysis({
          root_cause: inc.analysis.root_cause ?? '',
          contributing_factors: inc.analysis.contributing_factors ?? '',
          corrective_actions: inc.analysis.corrective_actions ?? '',
        })
      }
    }).catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [incidentId]) // eslint-disable-line

  const getSeverityColor = (code: string) => {
    const opt = options?.severity_levels.find((s) => s.code === code)
    return opt?.color === 'green' ? 'success' : opt?.color === 'red' ? 'danger' : 'warning'
  }
  const getSeverityLabel = (code: string) => options?.severity_levels.find((s) => s.code === code)?.label ?? code
  const getStatusLabel = (code: string) => options?.statuses.find((s) => s.code === code)?.label ?? code

  const handleTransition = async () => {
    if (!transitionCode) return
    setTransitioning(true)
    try {
      const updated = await incidentApi.transition(incidentId, { transition: transitionCode, notes: transitionNotes || null })
      setIncident(updated); setTransitionModal(false); setTransitionCode(''); setTransitionNotes('')
      toast.success('Stato aggiornato.')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore transizione.') }
    finally { setTransitioning(false) }
  }

  const handleSaveAnalysis = async () => {
    setSavingAnalysis(true)
    try {
      const updated = await incidentApi.saveAnalysis(incidentId, analysis)
      setIncident(updated); setAnalysisModal(false)
      toast.success('Analisi salvata.')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore salvataggio analisi.') }
    finally { setSavingAnalysis(false) }
  }

  const handleAddNotif = async () => {
    if (!notif.authority_id || !notif.notified_at) { toast.error('Compila tutti i campi obbligatori.'); return }
    setSavingNotif(true)
    try {
      await incidentApi.addExternalNotification(incidentId, notif)
      setNotifModal(false); setNotif({ authority_id: 0, notified_at: '', method: 'telefono', notes: '' })
      load(); toast.success('Notifica registrata.')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore registrazione notifica.') }
    finally { setSavingNotif(false) }
  }

  const handleLoadReport = async () => {
    setLoadingReport(true)
    try {
      const r = await incidentApi.getAuthorityReport(incidentId)
      setReport(r); setReportModal(true)
    } catch (e) { toast.error(apiError(e).message ?? 'Errore caricamento report.') }
    finally { setLoadingReport(false) }
  }

  if (loading) return <Container fluid className='pt-4'><div className='loader' /></Container>
  if (error || !incident) return <Container fluid className='pt-4'><Alert color='danger'>{error ?? 'Incidente non trovato.'}</Alert></Container>

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <h3>Incidente #{incident.id}</h3>
              <p className='text-muted mb-0'>{incident.title}</p>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/incidenti'>Incidenti</Link></li>
                <li className='breadcrumb-item active'>#{incident.id}</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Row>
          {/* Colonna principale */}
          <Col lg='8'>
            <Card className='mb-3'>
              <CardHeader>
                <div className='d-flex align-items-center justify-content-between'>
                  <span className='fw-bold'>Dati incidente</span>
                  <div className='d-flex gap-2'>
                    <span className={`badge badge-light-${getSeverityColor(incident.severity)}`}>
                      <AlertTriangle size={11} className='me-1' />{getSeverityLabel(incident.severity)}
                    </span>
                    <span className='badge badge-light-info'>{getStatusLabel(incident.status)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <table className='table table-sm table-borderless'>
                  <tbody>
                    <tr><td className='text-muted fw-semibold' style={{ width: 160 }}>Minore</td><td>{incident.minor ? `${incident.minor.last_name} ${incident.minor.first_name}` : `#${incident.minor_id}`}</td></tr>
                    <tr><td className='text-muted fw-semibold'>Tipo</td><td>{incident.incident_type?.name ?? `#${incident.incident_type_id}`}</td></tr>
                    <tr><td className='text-muted fw-semibold'>Accaduto il</td><td>{fmtDt(incident.occurred_at)}</td></tr>
                    <tr><td className='text-muted fw-semibold'>Segnalato da</td><td>{incident.reported_by ? `${incident.reported_by.first_name} ${incident.reported_by.last_name}` : '—'}</td></tr>
                  </tbody>
                </table>
                <div className='mt-2 p-3 bg-light rounded' style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
                  {incident.description}
                </div>
              </CardBody>
            </Card>

            {/* Analisi RCA */}
            <Card className='mb-3'>
              <CardHeader>
                <div className='d-flex align-items-center justify-content-between'>
                  <span className='fw-bold'>Analisi causa radice (RCA)</span>
                  <Button size='sm' color='primary' outline onClick={() => setAnalysisModal(true)}>
                    {incident.analysis ? 'Modifica' : 'Compila'}
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {incident.analysis ? (
                  <table className='table table-sm table-borderless'>
                    <tbody>
                      <tr><td className='text-muted fw-semibold' style={{ width: 180 }}>Causa radice</td><td style={{ whiteSpace: 'pre-wrap' }}>{incident.analysis.root_cause ?? '—'}</td></tr>
                      <tr><td className='text-muted fw-semibold'>Fattori contributivi</td><td style={{ whiteSpace: 'pre-wrap' }}>{incident.analysis.contributing_factors ?? '—'}</td></tr>
                      <tr><td className='text-muted fw-semibold'>Azioni correttive</td><td style={{ whiteSpace: 'pre-wrap' }}>{incident.analysis.corrective_actions ?? '—'}</td></tr>
                      {incident.analysis.analyzed_at && <tr><td className='text-muted fw-semibold'>Analizzato il</td><td>{fmtDt(incident.analysis.analyzed_at)}</td></tr>}
                    </tbody>
                  </table>
                ) : <p className='text-muted small'>Analisi non ancora compilata.</p>}
              </CardBody>
            </Card>

            {/* Notifiche esterne */}
            <Card>
              <CardHeader>
                <div className='d-flex align-items-center justify-content-between'>
                  <span className='fw-bold'>Notifiche a enti esterni</span>
                  <Button size='sm' color='primary' outline onClick={() => setNotifModal(true)}>Aggiungi</Button>
                </div>
              </CardHeader>
              <CardBody>
                {(!incident.external_notifications || incident.external_notifications.length === 0)
                  ? <p className='text-muted small'>Nessuna notifica registrata.</p>
                  : (
                    <table className='table table-sm'>
                      <thead className='table-light'><tr><th>Ente</th><th>Notificato il</th><th>Metodo</th><th>Note</th></tr></thead>
                      <tbody>
                        {incident.external_notifications.map((n) => (
                          <tr key={n.id}>
                            <td>{n.authority?.name ?? `Ente #${n.authority_id}`}</td>
                            <td className='small'>{fmtDt(n.notified_at)}</td>
                            <td className='small'>{n.method}</td>
                            <td className='small text-muted'>{n.notes ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </CardBody>
            </Card>
          </Col>

          {/* Colonna azioni */}
          <Col lg='4'>
            <Card className='mb-3'>
              <CardHeader><strong>Transizioni di stato</strong></CardHeader>
              <CardBody>
                {incident.allowed_transitions.length === 0
                  ? <p className='text-muted small'>Nessuna transizione disponibile.</p>
                  : (
                    <>
                      <p className='small text-muted mb-3'>Solo le transizioni validate dal backend sono mostrate. Ogni avanzamento richiede conferma.</p>
                      {incident.allowed_transitions.map((t) => (
                        <Button key={t} block color='warning' outline className='mb-2'
                          onClick={() => { setTransitionCode(t); setTransitionNotes(''); setTransitionModal(true) }}>
                          {getStatusLabel(t)}
                        </Button>
                      ))}
                    </>
                  )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><strong>Report e documenti</strong></CardHeader>
              <CardBody>
                <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 12 }}>
                  <strong>Nessun invio automatico</strong> — la precompilazione per l'autorità è una bozza da rivedere e inviare manualmente.
                </Alert>
                <Button block color='light' className='mb-2' onClick={handleLoadReport} disabled={loadingReport}>
                  <FileText size={13} className='me-1' />{loadingReport ? 'Caricamento…' : 'Report autorità (bozza)'}
                </Button>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal transizione */}
      <Modal isOpen={transitionModal} toggle={() => setTransitionModal(false)} size='sm'>
        <ModalHeader toggle={() => setTransitionModal(false)}>Conferma avanzamento stato</ModalHeader>
        <ModalBody>
          <Alert color='warning' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Stai per avanzare l'incidente a stato: <strong>{getStatusLabel(transitionCode)}</strong>. L'operazione è registrata e non può essere annullata.
          </Alert>
          <FormGroup>
            <Label>Note (facoltative)</Label>
            <Input type='textarea' rows={3} value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              placeholder='Motivazione o contesto del passaggio di stato…' />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleTransition} disabled={transitioning}>
            {transitioning ? 'In corso…' : 'Conferma avanzamento'}
          </Button>
          <Button color='light' onClick={() => setTransitionModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal RCA */}
      <Modal isOpen={analysisModal} toggle={() => setAnalysisModal(false)} size='lg'>
        <ModalHeader toggle={() => setAnalysisModal(false)}>Analisi causa radice</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Causa radice</Label>
            <Input type='textarea' rows={3} value={analysis.root_cause}
              onChange={(e) => setAnalysis((p) => ({ ...p, root_cause: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Fattori contributivi</Label>
            <Input type='textarea' rows={3} value={analysis.contributing_factors}
              onChange={(e) => setAnalysis((p) => ({ ...p, contributing_factors: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Azioni correttive</Label>
            <Input type='textarea' rows={3} value={analysis.corrective_actions}
              onChange={(e) => setAnalysis((p) => ({ ...p, corrective_actions: e.target.value }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSaveAnalysis} disabled={savingAnalysis}>
            {savingAnalysis ? 'Salvataggio…' : 'Salva analisi'}
          </Button>
          <Button color='light' onClick={() => setAnalysisModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal notifica esterna */}
      <Modal isOpen={notifModal} toggle={() => setNotifModal(false)} size='md'>
        <ModalHeader toggle={() => setNotifModal(false)}>Registra notifica a ente esterno</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Autorità/ente <span className='text-danger'>*</span></Label>
            <Input type='select' value={notif.authority_id}
              onChange={(e) => setNotif((p) => ({ ...p, authority_id: Number(e.target.value) }))}>
              <option value={0}>Seleziona ente…</option>
              {issuers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </Input>
            <small className='text-muted'>Seleziona dall'anagrafica enti rilascio — nessun testo libero.</small>
          </FormGroup>
          <FormGroup>
            <Label>Data/ora notifica <span className='text-danger'>*</span></Label>
            <Input type='datetime-local' value={notif.notified_at}
              onChange={(e) => setNotif((p) => ({ ...p, notified_at: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Metodo</Label>
            <Input type='select' value={notif.method}
              onChange={(e) => setNotif((p) => ({ ...p, method: e.target.value }))}>
              <option value='telefono'>Telefono</option>
              <option value='email'>Email</option>
              <option value='fax'>Fax</option>
              <option value='pec'>PEC</option>
              <option value='altro'>Altro</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Note</Label>
            <Input type='textarea' rows={2} value={notif.notes}
              onChange={(e) => setNotif((p) => ({ ...p, notes: e.target.value }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleAddNotif} disabled={savingNotif}>
            {savingNotif ? 'Salvataggio…' : 'Registra notifica'}
          </Button>
          <Button color='light' onClick={() => setNotifModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal report autorità */}
      <Modal isOpen={reportModal} toggle={() => setReportModal(false)} size='xl'>
        <ModalHeader toggle={() => setReportModal(false)}>Report autorità — bozza precompilata</ModalHeader>
        <ModalBody>
          <Alert color='warning' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            <strong>Nessun invio automatico.</strong> Questo report è una precompilazione da rivedere prima di qualsiasi invio all'autorità competente. Generato il {fmtDt(report?.generated_at)}.
          </Alert>
          <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap', background: '#f8f9fa', padding: 16, borderRadius: 4, maxHeight: '60vh', overflowY: 'auto' }}>
            {report?.content}
          </pre>
        </ModalBody>
        <ModalFooter><Button color='light' onClick={() => setReportModal(false)}>Chiudi</Button></ModalFooter>
      </Modal>
    </>
  )
}
