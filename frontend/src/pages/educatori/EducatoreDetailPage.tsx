import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Nav, NavItem, NavLink, TabContent, TabPane,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, ArrowLeft, Upload, Edit2, Archive, Download, Eye, Plus, Trash2, Save } from 'react-feather'
import { toast } from 'react-toastify'
import {
  staffMemberApi, staffMemberDocumentApi, staffProfessionalProfileApi,
  staffCertificationApi, lookupsApi, apiError,
} from '../../services/api'
import type {
  StaffMember, StaffDocument, StaffDocumentWrite,
  StaffProfessionalProfile, StaffProfileLookupItem,
  LookupItem, StaffDocumentStatus,
  StaffCertification, StaffCertificationWrite,
} from '../../types'

// ─── Helper ──────────────────────────────────────────────────────────────────

function fmtDate(s?: string | null) { return s ? new Date(s).toLocaleDateString('it-IT') : '—' }

const EXPIRY_BADGE: Record<string, string> = {
  no_expiry: 'badge-light-secondary',
  valid: 'badge-light-success',
  expiring: 'badge-light-warning',
  expired: 'badge-light-danger',
}
const EXPIRY_LABEL: Record<string, string> = {
  no_expiry: 'Senza scadenza',
  valid: 'Valido',
  expiring: 'In scadenza',
  expired: 'Scaduto',
}
const SEC_BADGE: Record<string, string> = {
  pending: 'badge-light-warning',
  clean: 'badge-light-success',
}
const SEC_LABEL: Record<string, string> = {
  pending: 'In verifica',
  clean: 'Disponibile',
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function EducatoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const staffId = Number(id)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('anagrafica')
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [staffError, setStaffError] = useState<string | null>(null)

  const loadStaff = () => {
    setLoadingStaff(true)
    staffMemberApi.get(staffId)
      .then(setStaff)
      .catch((e) => setStaffError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoadingStaff(false))
  }

  useEffect(() => { loadStaff() }, [staffId]) // eslint-disable-line

  if (loadingStaff) return <Container fluid><div className='text-center py-5'><div className='loader' /></div></Container>
  if (staffError || !staff) return (
    <Container fluid>
      <Alert color='danger'>{staffError ?? 'Professionista non trovato.'}</Alert>
      <Button color='light' size='sm' onClick={() => navigate('/educatori')}><ArrowLeft size={13} className='me-1' />Torna alla lista</Button>
    </Container>
  )

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <Button color='light' size='sm' onClick={() => navigate('/educatori')}><ArrowLeft size={13} /></Button>
                <h3 className='mb-0'>{staff.display_name ?? `${staff.last_name} ${staff.first_name}`}</h3>
                <span className='badge badge-light-primary'>{staff.employee_code}</span>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/educatori'>Educatori</Link></li>
                <li className='breadcrumb-item active'>{staff.last_name} {staff.first_name}</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Card>
          <CardHeader className='p-0 border-bottom-0'>
            <Nav tabs className='border-tab nav-primary mb-0 px-3 pt-3'>
              {[
                ['anagrafica', 'Anagrafica'],
                ['documenti', 'Documenti professionali'],
                ['certificazioni', 'Certificazioni'],
                ['profilo', 'Profilo professionale'],
              ].map(([key, label]) => (
                <NavItem key={key}>
                  <NavLink className={activeTab === key ? 'active' : ''} style={{ cursor: 'pointer' }} onClick={() => setActiveTab(key)}>
                    {label}
                  </NavLink>
                </NavItem>
              ))}
            </Nav>
          </CardHeader>
          <CardBody>
            <TabContent activeTab={activeTab}>
              <TabPane tabId='anagrafica'>
                <AnagraficaTab staff={staff} onUpdated={loadStaff} />
              </TabPane>
              <TabPane tabId='documenti'>
                {activeTab === 'documenti' && <DocumentiTab staffId={staffId} />}
              </TabPane>
              <TabPane tabId='certificazioni'>
                {activeTab === 'certificazioni' && <CertificazioniTab staffId={staffId} />}
              </TabPane>
              <TabPane tabId='profilo'>
                {activeTab === 'profilo' && <ProfiloProfessionaleTab staffId={staffId} />}
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Container>
    </>
  )
}

// ─── Tab Anagrafica ───────────────────────────────────────────────────────────

function AnagraficaTab({ staff, onUpdated }: { staff: StaffMember; onUpdated: () => void }) {
  const rows: [string, string | null | undefined][] = [
    ['Struttura', staff.facility?.name],
    ['Codice dipendente', staff.employee_code],
    ['Nome', staff.first_name],
    ['Cognome', staff.last_name],
    ['Data nascita', staff.birth_date ? new Date(staff.birth_date).toLocaleDateString('it-IT') : null],
    ['Città nascita', staff.birth_city?.name],
    ['Codice fiscale', staff.tax_code],
    ['Email', staff.email],
    ['Telefono', staff.phone],
    ['Qualifica', staff.qualification_lookup?.name ?? staff.qualification_label ?? staff.qualification_code],
    ['Stato', staff.status_lookup?.name ?? staff.status_label ?? staff.status_code],
    ['Account utente', staff.user ? `${staff.user.first_name} ${staff.user.last_name}`.trim() : (staff.user_id ? `ID ${staff.user_id}` : 'Nessun account collegato')],
  ]
  return (
    <div className='table-responsive' style={{ maxWidth: 600 }}>
      <table className='table table-sm table-borderless'>
        <tbody>
          {rows.map(([label, val]) => (
            <tr key={label}>
              <td className='text-muted fw-semibold' style={{ width: 200 }}>{label}</td>
              <td>{val ?? <span className='text-muted'>—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab Documenti professionali ──────────────────────────────────────────────

function DocumentiTab({ staffId }: { staffId: number }) {
  const [docs, setDocs] = useState<StaffDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [docTypes, setDocTypes] = useState<LookupItem[]>([])
  const [docStatuses, setDocStatuses] = useState<StaffDocumentStatus[]>([])
  const [expiry, setExpiry] = useState<{ expired: number; expiring: number; valid: number } | null>(null)

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({ document_type_id: 0, issue_date: '', expiry_date: '', status_code: '' })
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Edit modal
  const [editTarget, setEditTarget] = useState<StaffDocument | null>(null)
  const [editForm, setEditForm] = useState<StaffDocumentWrite>({ document_type_id: 0 })
  const [editMsg, setEditMsg] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  // Archive modal
  const [archiveTarget, setArchiveTarget] = useState<StaffDocument | null>(null)
  const [archiving, setArchiving] = useState(false)

  const loadDocs = () => {
    setLoading(true); setError(null)
    staffMemberDocumentApi.list(staffId)
      .then(setDocs)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento documenti'))
      .finally(() => setLoading(false))
    staffMemberDocumentApi.expirySummary()
      .then((s) => setExpiry({ expired: s.expired, expiring: s.expiring, valid: s.valid }))
      .catch(() => {})
  }

  useEffect(() => {
    loadDocs()
    lookupsApi.documentTypes().then(setDocTypes).catch(() => {})
    lookupsApi.staffDocumentStatuses().then(setDocStatuses).catch(() => {})
  }, [staffId]) // eslint-disable-line

  const handleUpload = async () => {
    if (!uploadFile) { setUploadMsg('Seleziona un file.'); return }
    if (!uploadForm.document_type_id) { setUploadMsg('Seleziona il tipo documento.'); return }
    setUploading(true); setUploadMsg(null)
    const fd = new FormData()
    fd.append('file', uploadFile)
    fd.append('document_type_id', String(uploadForm.document_type_id))
    if (uploadForm.issue_date) fd.append('issue_date', uploadForm.issue_date)
    if (uploadForm.expiry_date) fd.append('expiry_date', uploadForm.expiry_date)
    if (uploadForm.status_code) fd.append('status_code', uploadForm.status_code)
    try {
      await staffMemberDocumentApi.upload(staffId, fd)
      toast.success('Documento caricato. In attesa di scansione sicurezza.')
      setUploadOpen(false)
      setUploadFile(null)
      setUploadForm({ document_type_id: 0, issue_date: '', expiry_date: '', status_code: '' })
      loadDocs()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 422) setUploadMsg(ae.message ?? 'Dati non validi.')
      else setUploadMsg(ae.message ?? 'Errore upload.')
    } finally { setUploading(false) }
  }

  const openEdit = (doc: StaffDocument) => {
    setEditTarget(doc)
    setEditForm({
      document_type_id: doc.document_type_id,
      issue_date: doc.issue_date ?? null,
      expiry_date: doc.expiry_date ?? null,
      status_code: doc.status_code ?? null,
    })
    setEditMsg(null)
  }

  const handleEdit = async () => {
    if (!editTarget) return
    setEditSaving(true); setEditMsg(null)
    try {
      await staffMemberDocumentApi.update(staffId, editTarget.id, editForm)
      toast.success('Documento aggiornato.')
      setEditTarget(null); loadDocs()
    } catch (e) { setEditMsg(apiError(e).message ?? 'Errore aggiornamento.') }
    finally { setEditSaving(false) }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    setArchiving(true)
    try {
      await staffMemberDocumentApi.archive(staffId, archiveTarget.id)
      toast.success('Documento archiviato.')
      setArchiveTarget(null); loadDocs()
    } catch (e) { toast.error(apiError(e).message ?? 'Errore archiviazione.') }
    finally { setArchiving(false) }
  }

  const handleDownload = async (doc: StaffDocument) => {
    if (doc.attachment?.security_status !== 'clean') { toast.warning('File non ancora disponibile (scansione in corso).'); return }
    try {
      const blob = await staffMemberDocumentApi.downloadDocument(staffId, doc.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = doc.attachment?.original_name ?? `documento-${doc.id}`
      a.click(); URL.revokeObjectURL(url)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 423) toast.warning('File in quarantena. Non disponibile per il download.')
      else toast.error(ae.message ?? 'Errore download.')
    }
  }

  const secStatus = (doc: StaffDocument) => {
    const s = doc.attachment?.security_status ?? 'pending'
    return <span className={`badge ${SEC_BADGE[s] ?? 'badge-light-secondary'}`}>{SEC_LABEL[s] ?? s}</span>
  }

  return (
    <div>
      {/* KPI scadenze */}
      {expiry && (
        <Row className='mb-3'>
          {[
            { label: 'Scaduti', value: expiry.expired, color: 'danger' },
            { label: 'In scadenza', value: expiry.expiring, color: 'warning' },
            { label: 'Validi', value: expiry.valid, color: 'success' },
          ].map((k) => (
            <Col xs='auto' key={k.label} className='mb-2' style={{ minWidth: 120 }}>
              <Card className='text-center h-100'>
                <CardBody className='p-2'>
                  <div className={`h4 mb-0 text-${k.color}`}>{k.value}</div>
                  <small className='text-muted'>{k.label}</small>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div className='d-flex justify-content-end mb-3'>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={() => { setUploadOpen(true); setUploadMsg(null) }}>
          <Upload size={13} /> Carica documento
        </Button>
      </div>

      {error && <Alert color='danger'>{error}</Alert>}
      {loading ? <div className='text-center py-4'><div className='loader' /></div> : (
        docs.length === 0 ? <p className='text-muted'>Nessun documento caricato.</p> : (
          <div className='table-responsive'>
            <table className='table table-hover table-sm'>
              <thead className='table-light'>
                <tr>
                  <th>Tipo</th><th>File</th><th>Rilascio</th><th>Scadenza</th><th>Giorni</th><th>Stato amm.</th><th>Stato file</th><th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id}>
                    <td className='small'>{doc.document_type?.name ?? '—'}</td>
                    <td className='small'>{doc.attachment?.original_name ?? '—'}</td>
                    <td className='small'>{fmtDate(doc.issue_date)}</td>
                    <td className='small'>{fmtDate(doc.expiry_date)}</td>
                    <td className='small'>
                      {doc.expiry_status && doc.expiry_status !== 'no_expiry'
                        ? <span className={`badge ${EXPIRY_BADGE[doc.expiry_status]}`}>{EXPIRY_LABEL[doc.expiry_status]}</span>
                        : <span className='text-muted'>—</span>}
                      {doc.days_until_expiry != null && <span className='ms-1 small'>{doc.days_until_expiry}gg</span>}
                    </td>
                    <td className='small'>{doc.status_lookup?.name ?? doc.status_label ?? '—'}</td>
                    <td>{secStatus(doc)}</td>
                    <td>
                      <div className='d-flex gap-1'>
                        <Button size='sm' color='light' title='Scarica' onClick={() => handleDownload(doc)}><Download size={12} /></Button>
                        <Button size='sm' color='light' title='Modifica metadati' onClick={() => openEdit(doc)}><Edit2 size={12} /></Button>
                        <Button size='sm' color='light' title='Archivia logicamente' onClick={() => setArchiveTarget(doc)}><Archive size={12} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <div className='alert alert-info py-2 px-3 mt-3' style={{ fontSize: 13 }}>
        <strong>Nota:</strong> il file è utilizzabile solo dopo la scansione di sicurezza (badge "Disponibile"). L'archiviazione logica preserva il file per la retention. La scadenza è un alert informativo e non blocca automaticamente i turni.
      </div>

      {/* Modal upload */}
      <Modal isOpen={uploadOpen} toggle={() => setUploadOpen(false)} size='md'>
        <ModalHeader toggle={() => setUploadOpen(false)}>Carica documento professionale</ModalHeader>
        <ModalBody>
          {uploadMsg && <Alert color='danger'>{uploadMsg}</Alert>}
          <Alert color='warning' className='py-2 px-3' style={{ fontSize: 13 }}>
            Il file sarà in quarantena (scansione sicurezza) subito dopo il caricamento e non potrà essere visualizzato finché non risulta "clean".
          </Alert>
          <FormGroup>
            <Label>Tipo documento <span className='text-danger'>*</span></Label>
            <Input type='select' value={uploadForm.document_type_id}
              onChange={(e) => setUploadForm((f) => ({ ...f, document_type_id: Number(e.target.value) }))}>
              <option value={0}>Seleziona tipo…</option>
              {docTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>File <span className='text-danger'>*</span></Label>
            <Input type='file' onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
          </FormGroup>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Data rilascio</Label>
                <Input type='date' value={uploadForm.issue_date}
                  onChange={(e) => setUploadForm((f) => ({ ...f, issue_date: e.target.value }))} />
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Data scadenza</Label>
                <Input type='date' value={uploadForm.expiry_date}
                  onChange={(e) => setUploadForm((f) => ({ ...f, expiry_date: e.target.value }))} />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Stato amministrativo</Label>
            <Input type='select' value={uploadForm.status_code}
              onChange={(e) => setUploadForm((f) => ({ ...f, status_code: e.target.value }))}>
              <option value=''>Default (VALID)</option>
              {docStatuses.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </Input>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleUpload} disabled={uploading}>{uploading ? 'Caricamento…' : 'Carica'}</Button>
          <Button color='light' onClick={() => setUploadOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal modifica metadati */}
      <Modal isOpen={!!editTarget} toggle={() => setEditTarget(null)} size='md'>
        <ModalHeader toggle={() => setEditTarget(null)}>Modifica metadati documento</ModalHeader>
        <ModalBody>
          {editMsg && <Alert color='danger'>{editMsg}</Alert>}
          <Alert color='info' className='py-2 px-3' style={{ fontSize: 13 }}>
            La modifica aggiorna solo date e stato. Per sostituire il file, archivia questo documento e caricane uno nuovo.
          </Alert>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Data rilascio</Label>
                <Input type='date' value={editForm.issue_date ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, issue_date: e.target.value || null }))} />
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Data scadenza</Label>
                <Input type='date' value={editForm.expiry_date ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, expiry_date: e.target.value || null }))} />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Stato amministrativo</Label>
            <Input type='select' value={editForm.status_code ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, status_code: e.target.value || null }))}>
              <option value=''>Seleziona…</option>
              {docStatuses.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </Input>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleEdit} disabled={editSaving}>{editSaving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setEditTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal archiviazione */}
      <Modal isOpen={!!archiveTarget} toggle={() => setArchiveTarget(null)} size='sm'>
        <ModalHeader toggle={() => setArchiveTarget(null)}>Archivia documento</ModalHeader>
        <ModalBody>
          <p>Archiviare il documento <strong>{archiveTarget?.document_type?.name}</strong>?</p>
          <p className='small text-muted'>Il file viene conservato per la retention ma non sarà più visibile nell'elenco operativo.</p>
        </ModalBody>
        <ModalFooter>
          <Button color='warning' onClick={handleArchive} disabled={archiving}>{archiving ? 'Archiviazione…' : 'Archivia'}</Button>
          <Button color='light' onClick={() => setArchiveTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ─── Tab Certificazioni ───────────────────────────────────────────────────────

const VALIDITY_BADGE: Record<string, string> = {
  valid: 'badge-light-success',
  expiring: 'badge-light-warning',
  expired: 'badge-light-danger',
  revoked: 'badge-light-secondary',
}
const VALIDITY_LABEL: Record<string, string> = {
  valid: 'Valida',
  expiring: 'In scadenza',
  expired: 'Scaduta',
  revoked: 'Revocata',
}

const EMPTY_CERT_FORM: StaffCertificationWrite = {
  certification_type_id: 0,
  document_id: null,
  issue_date: null,
  expiry_date: null,
  reference: null,
  notes: null,
}

function CertificazioniTab({ staffId }: { staffId: number }) {
  const [certs, setCerts] = useState<StaffCertification[]>([])
  const [docs, setDocs] = useState<StaffDocument[]>([])
  const [certTypes, setCertTypes] = useState<StaffProfileLookupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StaffCertification | null>(null)
  const [form, setForm] = useState<StaffCertificationWrite>(EMPTY_CERT_FORM)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<StaffCertification | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true); setError(null)
    Promise.all([
      staffCertificationApi.list(staffId),
      staffMemberDocumentApi.list(staffId),
      staffProfessionalProfileApi.lookups('certification-types'),
    ]).then(([c, d, ct]) => { setCerts(c); setDocs(d); setCertTypes(ct) })
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [staffId]) // eslint-disable-line

  const openCreate = () => {
    setEditTarget(null); setForm(EMPTY_CERT_FORM); setFormMsg(null); setModalOpen(true)
  }
  const openEdit = (c: StaffCertification) => {
    setEditTarget(c)
    setForm({
      certification_type_id: c.certification_type_id,
      document_id: c.document_id ?? null,
      issue_date: c.issue_date ?? null,
      expiry_date: c.expiry_date ?? null,
      reference: c.reference ?? null,
      notes: c.notes ?? null,
    })
    setFormMsg(null); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.certification_type_id) { setFormMsg('Seleziona il tipo certificazione.'); return }
    setSaving(true); setFormMsg(null)
    try {
      if (editTarget) {
        await staffCertificationApi.update(staffId, editTarget.id, form)
        toast.success('Certificazione aggiornata.')
      } else {
        await staffCertificationApi.create(staffId, form)
        toast.success('Certificazione aggiunta.')
      }
      setModalOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      setFormMsg(ae.status === 422 ? (ae.message ?? 'Dati non validi.') : (ae.message ?? 'Errore salvataggio.'))
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await staffCertificationApi.delete(staffId, deleteTarget.id)
      toast.success('Certificazione eliminata.')
      setDeleteTarget(null); load()
    } catch (e) { toast.error(apiError(e).message ?? 'Errore eliminazione.') }
    finally { setDeleting(false) }
  }

  return (
    <div>
      <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 13 }}>
        Le certificazioni appartengono al professionista. Il badge di validità è informativo e non blocca automaticamente turni o assegnazioni.
      </div>
      <div className='d-flex justify-content-end mb-3'>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Nuova certificazione
        </Button>
      </div>
      {error && <Alert color='danger'>{error}</Alert>}
      {loading ? <div className='text-center py-4'><div className='loader' /></div> : (
        certs.length === 0 ? <p className='text-muted'>Nessuna certificazione registrata.</p> : (
          <div className='table-responsive'>
            <table className='table table-hover table-sm align-middle'>
              <thead className='table-light'>
                <tr><th>Tipo</th><th>Rilascio</th><th>Scadenza</th><th>Validità</th><th>Riferimento</th><th>Documento</th><th>Azioni</th></tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id}>
                    <td className='small fw-semibold'>{c.certification_type?.name ?? '—'}</td>
                    <td className='small'>{fmtDate(c.issue_date)}</td>
                    <td className='small'>{fmtDate(c.expiry_date)}</td>
                    <td>
                      {c.validity_status ? (
                        <span className={`badge ${VALIDITY_BADGE[c.validity_status] ?? 'badge-light-secondary'}`}>
                          {VALIDITY_LABEL[c.validity_status] ?? c.validity_status}
                        </span>
                      ) : <span className='text-muted'>—</span>}
                      {c.days_until_expiry != null && <span className='ms-1 small text-muted'>{c.days_until_expiry}gg</span>}
                    </td>
                    <td className='small'>{c.reference ?? '—'}</td>
                    <td className='small'>{c.document?.document_type?.name ?? (c.document_id ? `doc #${c.document_id}` : '—')}</td>
                    <td>
                      <div className='d-flex gap-1'>
                        <Button size='sm' color='light' onClick={() => openEdit(c)}><Edit2 size={12} /></Button>
                        <Button size='sm' color='light' onClick={() => setDeleteTarget(c)}><Trash2 size={12} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal crea/modifica */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='md'>
        <ModalHeader toggle={() => setModalOpen(false)}>{editTarget ? 'Modifica certificazione' : 'Nuova certificazione'}</ModalHeader>
        <ModalBody>
          {formMsg && <Alert color='danger'>{formMsg}</Alert>}
          <FormGroup>
            <Label>Tipo certificazione <span className='text-danger'>*</span></Label>
            <Input type='select' value={form.certification_type_id}
              onChange={(e) => setForm((f) => ({ ...f, certification_type_id: Number(e.target.value) }))}>
              <option value={0}>Seleziona…</option>
              {certTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Documento di prova</Label>
            <Input type='select' value={form.document_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, document_id: e.target.value ? Number(e.target.value) : null }))}>
              <option value=''>Nessuno</option>
              {docs.map((d) => <option key={d.id} value={d.id}>{d.document_type?.name ?? `Doc #${d.id}`} — {d.attachment?.original_name ?? '—'}</option>)}
            </Input>
            <small className='text-muted'>Solo documenti del presente professionista già caricati.</small>
          </FormGroup>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Data rilascio</Label>
                <Input type='date' bsSize='sm' value={form.issue_date ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value || null }))} />
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Data scadenza</Label>
                <Input type='date' bsSize='sm' value={form.expiry_date ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value || null }))} />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Riferimento / numero</Label>
            <Input bsSize='sm' value={form.reference ?? ''} placeholder='Es. CERT-2024-001'
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value || null }))} />
          </FormGroup>
          <FormGroup>
            <Label>Nota</Label>
            <Input type='textarea' bsSize='sm' rows={2} value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal elimina */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)} size='sm'>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Elimina certificazione</ModalHeader>
        <ModalBody><p>Eliminare la certificazione <strong>{deleteTarget?.certification_type?.name}</strong>? L'operazione è irreversibile.</p></ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>
          <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ─── Tab Profilo professionale ────────────────────────────────────────────────

function ProfiloProfessionaleTab({ staffId }: { staffId: number }) {
  const [profile, setProfile] = useState<StaffProfessionalProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [skills, setSkills] = useState<StaffProfileLookupItem[]>([])
  const [languages, setLanguages] = useState<StaffProfileLookupItem[]>([])
  const [specializations, setSpecializations] = useState<StaffProfileLookupItem[]>([])
  const [proficiencyLevels, setProficiencyLevels] = useState<StaffProfileLookupItem[]>([])

  // Local editable state
  const [editSkills, setEditSkills] = useState<{ skill_id: number; proficiency_level_code: string; acquired_at: string; notes: string }[]>([])
  const [editLanguages, setEditLanguages] = useState<{ language_id: number; proficiency_level_code: string; notes: string }[]>([])
  const [editSpecializations, setEditSpecializations] = useState<{ specialization_id: number; achieved_at: string; notes: string }[]>([])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      staffProfessionalProfileApi.get(staffId),
      staffProfessionalProfileApi.lookups('skills'),
      staffProfessionalProfileApi.lookups('languages'),
      staffProfessionalProfileApi.lookups('specializations'),
      staffProfessionalProfileApi.lookups('proficiency-levels'),
    ]).then(([prof, sk, la, sp, pl]) => {
      setProfile(prof)
      setSkills(sk); setLanguages(la); setSpecializations(sp); setProficiencyLevels(pl)
      setEditSkills((prof.skills ?? []).map((e) => ({ skill_id: e.skill_id, proficiency_level_code: e.proficiency_level_code ?? '', acquired_at: e.acquired_at ?? '', notes: e.notes ?? '' })))
      setEditLanguages((prof.languages ?? []).map((e) => ({ language_id: e.language_id, proficiency_level_code: e.proficiency_level_code ?? '', notes: e.notes ?? '' })))
      setEditSpecializations((prof.specializations ?? []).map((e) => ({ specialization_id: e.specialization_id, achieved_at: e.achieved_at ?? '', notes: e.notes ?? '' })))
    }).catch((e) => setError(apiError(e).message ?? 'Errore caricamento profilo'))
      .finally(() => setLoading(false))
  }, [staffId]) // eslint-disable-line

  const handleSave = async () => {
    setSaving(true); setMsg(null)
    const payload: import('../../types').StaffProfessionalProfileWrite = {
      skills: editSkills.filter((e) => e.skill_id).map((e) => ({
        skill_id: e.skill_id,
        proficiency_level_code: e.proficiency_level_code || null,
        acquired_at: e.acquired_at || null,
        notes: e.notes || null,
      })),
      languages: editLanguages.filter((e) => e.language_id).map((e) => ({
        language_id: e.language_id,
        proficiency_level_code: e.proficiency_level_code || null,
        notes: e.notes || null,
      })),
      specializations: editSpecializations.filter((e) => e.specialization_id).map((e) => ({
        specialization_id: e.specialization_id,
        achieved_at: e.achieved_at || null,
        notes: e.notes || null,
      })),
    }
    try {
      const updated = await staffProfessionalProfileApi.save(staffId, payload)
      setProfile(updated)
      toast.success('Profilo professionale salvato.')
    } catch (e) {
      const ae = apiError(e)
      setMsg(ae.message ?? 'Errore salvataggio.')
    } finally { setSaving(false) }
  }

  if (loading) return <div className='text-center py-4'><div className='loader' /></div>
  if (error) return <Alert color='danger'>{error}</Alert>

  return (
    <div>
      <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
        Il profilo professionale non assegna accessi al sistema e non modifica il ruolo applicativo. Ogni modifica è auditata.
      </Alert>
      {msg && <Alert color='danger'>{msg}</Alert>}

      {/* Competenze */}
      <h6 className='fw-bold border-bottom pb-1 mb-3'>Competenze</h6>
      {editSkills.map((entry, idx) => (
        <Row key={idx} className='g-2 mb-2 align-items-end'>
          <Col md='3'>
            <Input type='select' bsSize='sm' value={entry.skill_id}
              onChange={(e) => { const c = [...editSkills]; c[idx].skill_id = Number(e.target.value); setEditSkills(c) }}>
              <option value={0}>Seleziona competenza…</option>
              {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Input>
          </Col>
          <Col md='2'>
            <Input type='select' bsSize='sm' value={entry.proficiency_level_code}
              onChange={(e) => { const c = [...editSkills]; c[idx].proficiency_level_code = e.target.value; setEditSkills(c) }}>
              <option value=''>Livello…</option>
              {proficiencyLevels.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </Input>
          </Col>
          <Col md='2'>
            <Input type='date' bsSize='sm' value={entry.acquired_at}
              onChange={(e) => { const c = [...editSkills]; c[idx].acquired_at = e.target.value; setEditSkills(c) }} />
          </Col>
          <Col md='4'>
            <Input bsSize='sm' placeholder='Nota opzionale…' value={entry.notes}
              onChange={(e) => { const c = [...editSkills]; c[idx].notes = e.target.value; setEditSkills(c) }} />
          </Col>
          <Col md='1'>
            <Button size='sm' color='light' onClick={() => setEditSkills(editSkills.filter((_, i) => i !== idx))}><Trash2 size={12} /></Button>
          </Col>
        </Row>
      ))}
      <Button size='sm' color='light' className='d-flex align-items-center gap-1 mb-4'
        onClick={() => setEditSkills([...editSkills, { skill_id: 0, proficiency_level_code: '', acquired_at: '', notes: '' }])}>
        <Plus size={12} /> Aggiungi competenza
      </Button>

      {/* Lingue */}
      <h6 className='fw-bold border-bottom pb-1 mb-3'>Lingue</h6>
      {editLanguages.map((entry, idx) => (
        <Row key={idx} className='g-2 mb-2 align-items-end'>
          <Col md='4'>
            <Input type='select' bsSize='sm' value={entry.language_id}
              onChange={(e) => { const c = [...editLanguages]; c[idx].language_id = Number(e.target.value); setEditLanguages(c) }}>
              <option value={0}>Seleziona lingua…</option>
              {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Input>
          </Col>
          <Col md='3'>
            <Input type='select' bsSize='sm' value={entry.proficiency_level_code}
              onChange={(e) => { const c = [...editLanguages]; c[idx].proficiency_level_code = e.target.value; setEditLanguages(c) }}>
              <option value=''>Livello…</option>
              {proficiencyLevels.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </Input>
          </Col>
          <Col md='4'>
            <Input bsSize='sm' placeholder='Nota opzionale…' value={entry.notes}
              onChange={(e) => { const c = [...editLanguages]; c[idx].notes = e.target.value; setEditLanguages(c) }} />
          </Col>
          <Col md='1'>
            <Button size='sm' color='light' onClick={() => setEditLanguages(editLanguages.filter((_, i) => i !== idx))}><Trash2 size={12} /></Button>
          </Col>
        </Row>
      ))}
      <Button size='sm' color='light' className='d-flex align-items-center gap-1 mb-4'
        onClick={() => setEditLanguages([...editLanguages, { language_id: 0, proficiency_level_code: '', notes: '' }])}>
        <Plus size={12} /> Aggiungi lingua
      </Button>

      {/* Specializzazioni */}
      <h6 className='fw-bold border-bottom pb-1 mb-3'>Specializzazioni</h6>
      {editSpecializations.map((entry, idx) => (
        <Row key={idx} className='g-2 mb-2 align-items-end'>
          <Col md='4'>
            <Input type='select' bsSize='sm' value={entry.specialization_id}
              onChange={(e) => { const c = [...editSpecializations]; c[idx].specialization_id = Number(e.target.value); setEditSpecializations(c) }}>
              <option value={0}>Seleziona specializzazione…</option>
              {specializations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Input>
          </Col>
          <Col md='3'>
            <Input type='date' bsSize='sm' value={entry.achieved_at}
              onChange={(e) => { const c = [...editSpecializations]; c[idx].achieved_at = e.target.value; setEditSpecializations(c) }} />
          </Col>
          <Col md='4'>
            <Input bsSize='sm' placeholder='Nota opzionale…' value={entry.notes}
              onChange={(e) => { const c = [...editSpecializations]; c[idx].notes = e.target.value; setEditSpecializations(c) }} />
          </Col>
          <Col md='1'>
            <Button size='sm' color='light' onClick={() => setEditSpecializations(editSpecializations.filter((_, i) => i !== idx))}><Trash2 size={12} /></Button>
          </Col>
        </Row>
      ))}
      <Button size='sm' color='light' className='d-flex align-items-center gap-1 mb-4'
        onClick={() => setEditSpecializations([...editSpecializations, { specialization_id: 0, achieved_at: '', notes: '' }])}>
        <Plus size={12} /> Aggiungi specializzazione
      </Button>

      <div className='d-flex justify-content-end'>
        <Button color='primary' className='d-flex align-items-center gap-1' onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Salvataggio…' : 'Salva profilo'}
        </Button>
      </div>
    </div>
  )
}
