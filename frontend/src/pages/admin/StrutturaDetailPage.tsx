import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Nav, NavItem, NavLink, TabContent, TabPane,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, ArrowLeft, Plus, Edit2, Trash2 } from 'react-feather'
import { toast } from 'react-toastify'
import {
  facilityApi, facilityCertificationApi, staffProfessionalProfileApi,
  lookupsApi, apiError,
} from '../../services/api'
import type {
  Facility,
  FacilityCertificationRequirement, FacilityCertificationRequirementWrite,
  FacilityCertificationCompliance, FacilityCertificationComplianceRow,
  StaffProfileLookupItem, StaffQualification,
} from '../../types'

function fmtDate(s?: string | null) { return s ? new Date(s).toLocaleDateString('it-IT') : '—' }

const COMPLIANCE_BADGE: Record<string, string> = {
  compliant: 'badge-light-success',
  expiring: 'badge-light-warning',
  expired: 'badge-light-danger',
  missing: 'badge-light-danger',
  revoked: 'badge-light-secondary',
}
const COMPLIANCE_LABEL: Record<string, string> = {
  compliant: 'Conforme',
  expiring: 'In scadenza',
  expired: 'Scaduta',
  missing: 'Mancante',
  revoked: 'Revocata',
}

export default function StrutturaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const facilityId = Number(id)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('requisiti')
  const [facility, setFacility] = useState<Facility | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    facilityApi.get(facilityId)
      .then(setFacility)
      .catch((e) => setError(apiError(e).message ?? 'Struttura non trovata'))
      .finally(() => setLoading(false))
  }, [facilityId]) // eslint-disable-line

  if (loading) return <Container fluid><div className='text-center py-5'><div className='loader' /></div></Container>
  if (error || !facility) return (
    <Container fluid>
      <Alert color='danger'>{error ?? 'Struttura non trovata.'}</Alert>
      <Button color='light' size='sm' onClick={() => navigate('/admin/strutture')}><ArrowLeft size={13} className='me-1' />Torna alla lista</Button>
    </Container>
  )

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <Button color='light' size='sm' onClick={() => navigate('/admin/strutture')}><ArrowLeft size={13} /></Button>
                <h3 className='mb-0'>{facility.name}</h3>
                <span className='badge badge-light-primary'>{facility.code}</span>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/admin/strutture'>Strutture</Link></li>
                <li className='breadcrumb-item active'>{facility.name}</li>
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
                ['requisiti', 'Requisiti certificativi'],
                ['conformita', 'Conformità'],
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
              <TabPane tabId='requisiti'>
                {activeTab === 'requisiti' && <RequisitiTab facilityId={facilityId} />}
              </TabPane>
              <TabPane tabId='conformita'>
                {activeTab === 'conformita' && <ConformitaTab facilityId={facilityId} />}
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Container>
    </>
  )
}

// ─── Tab Requisiti certificativi ─────────────────────────────────────────────

const EMPTY_REQ: FacilityCertificationRequirementWrite = {
  certification_type_id: 0,
  qualification_code: null,
  is_mandatory: true,
  advance_notice_days: null,
  notes: null,
}

function RequisitiTab({ facilityId }: { facilityId: number }) {
  const [reqs, setReqs] = useState<FacilityCertificationRequirement[]>([])
  const [certTypes, setCertTypes] = useState<StaffProfileLookupItem[]>([])
  const [qualifications, setQualifications] = useState<StaffQualification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FacilityCertificationRequirement | null>(null)
  const [form, setForm] = useState<FacilityCertificationRequirementWrite>(EMPTY_REQ)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<FacilityCertificationRequirement | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true); setError(null)
    Promise.all([
      facilityCertificationApi.listRequirements(facilityId),
      staffProfessionalProfileApi.lookups('certification-types'),
      lookupsApi.staffQualifications(),
    ]).then(([r, ct, q]) => { setReqs(r); setCertTypes(ct); setQualifications(q) })
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [facilityId]) // eslint-disable-line

  const openCreate = () => {
    setEditTarget(null); setForm(EMPTY_REQ); setFormMsg(null); setModalOpen(true)
  }
  const openEdit = (r: FacilityCertificationRequirement) => {
    setEditTarget(r)
    setForm({
      certification_type_id: r.certification_type_id,
      qualification_code: r.qualification_code ?? null,
      is_mandatory: r.is_mandatory,
      advance_notice_days: r.advance_notice_days ?? null,
      notes: r.notes ?? null,
    })
    setFormMsg(null); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.certification_type_id) { setFormMsg('Seleziona il tipo certificazione.'); return }
    setSaving(true); setFormMsg(null)
    try {
      if (editTarget) {
        await facilityCertificationApi.updateRequirement(facilityId, editTarget.id, form)
        toast.success('Requisito aggiornato.')
      } else {
        await facilityCertificationApi.createRequirement(facilityId, form)
        toast.success('Requisito aggiunto.')
      }
      setModalOpen(false); load()
    } catch (e) {
      setFormMsg(apiError(e).message ?? 'Errore salvataggio.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await facilityCertificationApi.deleteRequirement(facilityId, deleteTarget.id)
      toast.success('Requisito eliminato.')
      setDeleteTarget(null); load()
    } catch (e) { toast.error(apiError(e).message ?? 'Errore eliminazione.') }
    finally { setDeleting(false) }
  }

  return (
    <div>
      <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 13 }}>
        I requisiti sono controlli organizzativi. Il mancato rispetto è un alert informativo e non blocca automaticamente turni o accessi. Creazione, modifica e rimozione sono tracciate nell'Audit.
      </div>
      <div className='d-flex justify-content-end mb-3'>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Nuovo requisito
        </Button>
      </div>
      {error && <Alert color='danger'>{error}</Alert>}
      {loading ? <div className='text-center py-4'><div className='loader' /></div> : (
        reqs.length === 0 ? <p className='text-muted'>Nessun requisito configurato.</p> : (
          <div className='table-responsive'>
            <table className='table table-hover table-sm align-middle'>
              <thead className='table-light'>
                <tr>
                  <th>Tipo certificazione</th>
                  <th>Qualifica</th>
                  <th>Obbligatorio</th>
                  <th>Preavviso (gg)</th>
                  <th>Nota</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {reqs.map((r) => (
                  <tr key={r.id}>
                    <td className='small fw-semibold'>{r.certification_type?.name ?? '—'}</td>
                    <td className='small'>{r.qualification?.name ?? (r.qualification_code ? r.qualification_code : 'Tutte')}</td>
                    <td>{r.is_mandatory ? <Badge color='danger' className='badge-light-danger'>Obbligatorio</Badge> : <Badge color='secondary' className='badge-light-secondary'>Facoltativo</Badge>}</td>
                    <td className='small text-center'>{r.advance_notice_days ?? '—'}</td>
                    <td className='small text-muted'>{r.notes ?? '—'}</td>
                    <td>
                      <div className='d-flex gap-1'>
                        <Button size='sm' color='light' onClick={() => openEdit(r)}><Edit2 size={12} /></Button>
                        <Button size='sm' color='light' onClick={() => setDeleteTarget(r)}><Trash2 size={12} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='md'>
        <ModalHeader toggle={() => setModalOpen(false)}>{editTarget ? 'Modifica requisito' : 'Nuovo requisito certificativo'}</ModalHeader>
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
            <Label>Qualifica (opzionale — lasciare vuoto per tutte)</Label>
            <Input type='select' value={form.qualification_code ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, qualification_code: e.target.value || null }))}>
              <option value=''>Tutte le qualifiche</option>
              {qualifications.map((q) => <option key={q.code} value={q.code}>{q.name}</option>)}
            </Input>
          </FormGroup>
          <Row>
            <Col md='6'>
              <FormGroup check className='mt-2'>
                <Input type='checkbox' id='mandatory_cb' checked={form.is_mandatory}
                  onChange={(e) => setForm((f) => ({ ...f, is_mandatory: e.target.checked }))} />
                <Label check for='mandatory_cb'>Requisito obbligatorio</Label>
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Giorni preavviso scadenza</Label>
                <Input type='number' bsSize='sm' value={form.advance_notice_days ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, advance_notice_days: e.target.value ? Number(e.target.value) : null }))}
                  placeholder='Es. 30' />
              </FormGroup>
            </Col>
          </Row>
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

      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)} size='sm'>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Elimina requisito</ModalHeader>
        <ModalBody><p>Eliminare il requisito <strong>{deleteTarget?.certification_type?.name}</strong>?</p></ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>
          <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ─── Tab Conformità ───────────────────────────────────────────────────────────

function ConformitaTab({ facilityId }: { facilityId: number }) {
  const [compliance, setCompliance] = useState<FacilityCertificationCompliance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('')

  const load = () => {
    setLoading(true); setError(null)
    facilityCertificationApi.compliance(facilityId)
      .then(setCompliance)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento conformità'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [facilityId]) // eslint-disable-line

  const rows: FacilityCertificationComplianceRow[] = compliance?.rows.filter(
    (r) => !filterStatus || r.status === filterStatus
  ) ?? []

  return (
    <div>
      <div className='alert alert-warning py-2 px-3 mb-3' style={{ fontSize: 13 }}>
        La conformità è un alert operativo. Non modifica, non blocca e non rimuove turni o assegnazioni. Le azioni correttive vanno eseguite nella scheda del professionista.
      </div>

      {/* KPI */}
      {compliance && (
        <Row className='mb-3'>
          {[
            { label: 'Totale verifiche', value: compliance.total, color: 'primary' },
            { label: 'Conformi', value: compliance.compliant, color: 'success' },
            { label: 'Non conformi', value: compliance.non_compliant, color: 'danger' },
          ].map((k) => (
            <Col xs='auto' key={k.label} style={{ minWidth: 130 }} className='mb-2'>
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

      <div className='d-flex gap-2 mb-3 align-items-center'>
        <Label className='mb-0 small'>Filtra stato:</Label>
        <Input type='select' bsSize='sm' style={{ width: 160 }} value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}>
          <option value=''>Tutti</option>
          <option value='compliant'>Conforme</option>
          <option value='expiring'>In scadenza</option>
          <option value='expired'>Scaduta</option>
          <option value='missing'>Mancante</option>
          <option value='revoked'>Revocata</option>
        </Input>
        <Button size='sm' color='light' onClick={load}>Aggiorna</Button>
      </div>

      {error && <Alert color='danger'>{error}</Alert>}
      {loading ? <div className='text-center py-4'><div className='loader' /></div> : (
        rows.length === 0 ? <p className='text-muted'>Nessun elemento trovato.</p> : (
          <div className='table-responsive'>
            <table className='table table-hover table-sm align-middle'>
              <thead className='table-light'>
                <tr>
                  <th>Professionista</th>
                  <th>Qualifica</th>
                  <th>Certificazione richiesta</th>
                  <th>Obbligatorio</th>
                  <th>Stato</th>
                  <th>Scadenza</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className='small fw-semibold'>{r.display_name}</td>
                    <td className='small text-muted'>{r.qualification_label ?? '—'}</td>
                    <td className='small'>{r.certification_type_name}</td>
                    <td>{r.is_mandatory ? <span className='badge badge-light-danger'>Obbligatorio</span> : <span className='badge badge-light-secondary'>Facoltativo</span>}</td>
                    <td>
                      <span className={`badge ${COMPLIANCE_BADGE[r.status] ?? 'badge-light-secondary'}`}>
                        {COMPLIANCE_LABEL[r.status] ?? r.status}
                      </span>
                      {r.days_until_expiry != null && <span className='ms-1 small text-muted'>{r.days_until_expiry}gg</span>}
                    </td>
                    <td className='small'>{fmtDate(r.expiry_date)}</td>
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
      )}
    </div>
  )
}
