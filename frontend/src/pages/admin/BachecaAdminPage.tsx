import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Nav, NavItem, NavLink, TabContent, TabPane,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, Plus, Edit2 } from 'react-feather'
import { toast } from 'react-toastify'
import { bulletinAdminApi, facilityApi, lookupsApi, apiError } from '../../services/api'
import type { FacilityBulletin, FacilityBulletinWrite, Facility, Role } from '../../types'

function fmtDateTime(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

type BulletinStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

const STATUS_BADGE: Record<BulletinStatus, string> = {
  DRAFT:     'badge-light-warning',
  PUBLISHED: 'badge-light-success',
  ARCHIVED:  'badge-light-secondary',
}
const STATUS_LABEL: Record<BulletinStatus, string> = {
  DRAFT:     'Bozza',
  PUBLISHED: 'Pubblicata',
  ARCHIVED:  'Archiviata',
}

const EMPTY_FORM: FacilityBulletinWrite = {
  facility_id: 0,
  title: '',
  body: '',
  expires_at: null,
  target_role_ids: [],
}

export default function BachecaAdminPage() {
  const [activeTab, setActiveTab] = useState<BulletinStatus>('DRAFT')
  const [bulletins, setBulletins] = useState<FacilityBulletin[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form modal (crea / modifica BOZZA)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FacilityBulletin | null>(null)
  const [form, setForm] = useState<FacilityBulletinWrite>(EMPTY_FORM)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Vista dettaglio (read-only per PUBLISHED/ARCHIVED)
  const [viewTarget, setViewTarget] = useState<FacilityBulletin | null>(null)

  // Pubblica
  const [publishTarget, setPublishTarget] = useState<FacilityBulletin | null>(null)
  const [publishing, setPublishing] = useState(false)

  // Archivia
  const [archiveTarget, setArchiveTarget] = useState<FacilityBulletin | null>(null)
  const [archiving, setArchiving] = useState(false)

  const load = (status = activeTab) => {
    setLoading(true); setError(null)
    bulletinAdminApi.list({ status })
      .then(setBulletins)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    facilityApi.list().then(setFacilities).catch(() => {})
    lookupsApi.roles().then(setRoles).catch(() => {})
    load()
  }, []) // eslint-disable-line

  const changeTab = (tab: BulletinStatus) => { setActiveTab(tab); load(tab) }

  const openCreate = () => {
    setEditTarget(null); setForm(EMPTY_FORM); setFormMsg(null); setFormOpen(true)
  }

  const openEdit = (b: FacilityBulletin) => {
    setEditTarget(b)
    setForm({
      facility_id: b.facility_id,
      title: b.title,
      body: b.body,
      expires_at: b.expires_at ? b.expires_at.substring(0, 16) : null,
      target_role_ids: b.target_roles.map((r) => r.id),
    })
    setFormMsg(null); setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.facility_id) { setFormMsg('Seleziona la struttura.'); return }
    if (!form.title.trim()) { setFormMsg('Il titolo è obbligatorio.'); return }
    if (!form.body.trim()) { setFormMsg('Il contenuto è obbligatorio.'); return }
    setSaving(true); setFormMsg(null)
    const payload: FacilityBulletinWrite = {
      ...form,
      title: form.title.trim(),
      body: form.body.trim(),
      expires_at: form.expires_at || null,
    }
    try {
      if (editTarget) {
        await bulletinAdminApi.update(editTarget.id, payload)
        // titolo non incluso nel toast — corpo cifrato
        toast.success('Bozza aggiornata.')
      } else {
        await bulletinAdminApi.create(payload)
        toast.success('Bozza creata.')
      }
      setFormOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      setFormMsg(ae.message ?? 'Errore salvataggio.')
    } finally { setSaving(false) }
  }

  const handlePublish = async () => {
    if (!publishTarget) return
    setPublishing(true)
    try {
      await bulletinAdminApi.publish(publishTarget.id)
      toast.success('Circolare pubblicata.')
      setPublishTarget(null); changeTab('PUBLISHED')
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore pubblicazione.')
      setPublishTarget(null)
    } finally { setPublishing(false) }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    setArchiving(true)
    try {
      await bulletinAdminApi.archive(archiveTarget.id)
      toast.success('Circolare archiviata.')
      setArchiveTarget(null); load()
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore archiviazione.')
      setArchiveTarget(null)
    } finally { setArchiving(false) }
  }

  const toggleRole = (roleId: number) => {
    const ids = form.target_role_ids ?? []
    setForm((f) => ({
      ...f,
      target_role_ids: ids.includes(roleId) ? ids.filter((id) => id !== roleId) : [...ids, roleId],
    }))
  }

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Gestione bacheca circolari</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Amministrazione</li>
                <li className='breadcrumb-item active'>Bacheca admin</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Card>
          <CardHeader className='p-0 border-bottom-0'>
            <Nav tabs className='border-tab nav-primary mb-0 px-3 pt-3'>
              {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as BulletinStatus[]).map((s) => (
                <NavItem key={s}>
                  <NavLink className={activeTab === s ? 'active' : ''} style={{ cursor: 'pointer' }} onClick={() => changeTab(s)}>
                    {STATUS_LABEL[s]}
                  </NavLink>
                </NavItem>
              ))}
            </Nav>
          </CardHeader>
          <CardBody>
            <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 13 }}>
              Le <strong>circolari pubblicate sono immutabili</strong>. Per correzioni, archivia quella corrente e crea una nuova circolare. I destinatari sono ruoli della struttura — mai singoli utenti.
            </div>

            <TabContent activeTab={activeTab}>
              {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as BulletinStatus[]).map((s) => (
                <TabPane tabId={s} key={s}>
                  {activeTab === s && (
                    <>
                      {s === 'DRAFT' && (
                        <div className='d-flex justify-content-end mb-3'>
                          <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                            <Plus size={13} /> Nuova circolare
                          </Button>
                        </div>
                      )}
                      {error && <Alert color='danger'>{error}</Alert>}
                      {loading ? <div className='text-center py-4'><div className='loader' /></div> : (
                        bulletins.length === 0 ? <p className='text-muted'>Nessuna circolare in questa sezione.</p> : (
                          <div className='table-responsive'>
                            <table className='table table-hover table-sm align-middle'>
                              <thead className='table-light'>
                                <tr>
                                  <th>Titolo</th>
                                  <th>Struttura</th>
                                  <th>Pubblicata il</th>
                                  <th>Scadenza</th>
                                  {s === 'PUBLISHED' && <th style={{ width: 100 }}>Letture</th>}
                                  <th style={{ width: 130 }}>Azioni</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bulletins.map((b) => (
                                  <tr key={b.id}>
                                    <td className='small fw-semibold'>{b.title}</td>
                                    <td className='small text-muted'>—</td>
                                    <td className='small'>{fmtDateTime(b.published_at)}</td>
                                    <td className='small'>{fmtDateTime(b.expires_at)}</td>
                                    {s === 'PUBLISHED' && (
                                      <td className='small text-center'>{b.acknowledgement_count ?? '—'}</td>
                                    )}
                                    <td>
                                      <div className='d-flex gap-1 flex-wrap'>
                                        {s === 'DRAFT' && (
                                          <>
                                            <Button size='sm' color='light' title='Modifica' onClick={() => openEdit(b)}><Edit2 size={12} /></Button>
                                            <Button size='sm' color='success' title='Pubblica' onClick={() => setPublishTarget(b)} style={{ fontSize: 11 }}>Pubblica</Button>
                                          </>
                                        )}
                                        {s === 'PUBLISHED' && (
                                          <>
                                            <Button size='sm' color='light' onClick={() => setViewTarget(b)}>Vedi</Button>
                                            <Button size='sm' color='light' title='Archivia' onClick={() => setArchiveTarget(b)} style={{ fontSize: 11 }}>Archivia</Button>
                                          </>
                                        )}
                                        {s === 'ARCHIVED' && (
                                          <Button size='sm' color='light' onClick={() => setViewTarget(b)}>Vedi</Button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}
                    </>
                  )}
                </TabPane>
              ))}
            </TabContent>
          </CardBody>
        </Card>
      </Container>

      {/* Modal crea/modifica BOZZA */}
      <Modal isOpen={formOpen} toggle={() => setFormOpen(false)} size='lg'>
        <ModalHeader toggle={() => setFormOpen(false)}>
          {editTarget ? 'Modifica bozza' : 'Nuova circolare'}
        </ModalHeader>
        <ModalBody>
          {formMsg && <Alert color='danger'>{formMsg}</Alert>}
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Struttura <span className='text-danger'>*</span></Label>
                <Input type='select' bsSize='sm' value={form.facility_id}
                  onChange={(e) => setForm((f) => ({ ...f, facility_id: Number(e.target.value) }))}>
                  <option value={0}>Seleziona struttura…</option>
                  {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Scadenza</Label>
                <Input type='datetime-local' bsSize='sm' value={form.expires_at ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value || null }))} />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Titolo <span className='text-danger'>*</span></Label>
            <Input bsSize='sm' value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder='Titolo della circolare' maxLength={200} />
          </FormGroup>
          <FormGroup>
            <Label>Contenuto <span className='text-danger'>*</span></Label>
            <Input type='textarea' rows={8} bsSize='sm' value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder='Testo della circolare…' maxLength={20000} />
            <small className='text-muted'>Il contenuto è cifrato a riposo e non viene incluso in notifiche o log di sistema.</small>
          </FormGroup>
          <FormGroup>
            <Label>Destinatari (ruoli)</Label>
            <div className='border rounded p-2' style={{ maxHeight: 160, overflowY: 'auto' }}>
              {roles.map((r) => (
                <FormGroup check key={r.id} className='mb-1'>
                  <Input type='checkbox' id={`role_${r.id}`}
                    checked={(form.target_role_ids ?? []).includes(r.id)}
                    onChange={() => toggleRole(r.id)} />
                  <Label check for={`role_${r.id}`}>{r.name}</Label>
                </FormGroup>
              ))}
            </div>
            <small className='text-muted'>Nessuna selezione = tutti i ruoli attivi nella struttura. I destinatari sono ruoli, mai singoli utenti.</small>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva bozza'}</Button>
          <Button color='light' onClick={() => setFormOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal vista read-only */}
      <Modal isOpen={!!viewTarget} toggle={() => setViewTarget(null)} size='lg'>
        <ModalHeader toggle={() => setViewTarget(null)}>
          {viewTarget?.title}
          {viewTarget && (
            <span className={`ms-2 badge ${STATUS_BADGE[viewTarget.status as BulletinStatus] ?? 'badge-light-secondary'}`}>
              {STATUS_LABEL[viewTarget.status as BulletinStatus] ?? viewTarget.status}
            </span>
          )}
        </ModalHeader>
        <ModalBody>
          {viewTarget && (
            <>
              <table className='table table-sm table-borderless mb-3' style={{ maxWidth: 480 }}>
                <tbody>
                  <tr><td className='text-muted fw-semibold' style={{ width: 160 }}>Pubblicata il</td><td>{fmtDateTime(viewTarget.published_at)}</td></tr>
                  <tr><td className='text-muted fw-semibold'>Scadenza</td><td>{fmtDateTime(viewTarget.expires_at)}</td></tr>
                  <tr>
                    <td className='text-muted fw-semibold'>Destinatari</td>
                    <td>
                      {viewTarget.target_roles.length === 0
                        ? <span className='text-muted'>Tutti i ruoli attivi della struttura</span>
                        : viewTarget.target_roles.map((r) => <Badge key={r.id} color='light' className='me-1 text-dark border'>{r.name}</Badge>)
                      }
                    </td>
                  </tr>
                  <tr><td className='text-muted fw-semibold'>Letture</td><td>{viewTarget.acknowledgement_count ?? '—'}</td></tr>
                </tbody>
              </table>
              <div className='border rounded p-3 mb-3' style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
                {viewTarget.body}
              </div>
              {viewTarget.status === 'PUBLISHED' && (
                <Alert color='info' className='py-2 px-3' style={{ fontSize: 13 }}>
                  La circolare è pubblicata e <strong>immutabile</strong>. Per correzioni, archivia questa circolare e creane una nuova.
                </Alert>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color='light' onClick={() => setViewTarget(null)}>Chiudi</Button>
        </ModalFooter>
      </Modal>

      {/* Modal pubblica */}
      <Modal isOpen={!!publishTarget} toggle={() => setPublishTarget(null)} size='sm'>
        <ModalHeader toggle={() => setPublishTarget(null)}>Pubblica circolare</ModalHeader>
        <ModalBody>
          <Alert color='warning' className='py-2 px-3' style={{ fontSize: 13 }}>
            <strong>Attenzione:</strong> una circolare pubblicata non può essere modificata. Per correzioni sarà necessario archiviarla e creare una nuova circolare.
          </Alert>
          <p className='small mb-0'>La circolare sarà visibile immediatamente ai destinatari nella struttura.</p>
        </ModalBody>
        <ModalFooter>
          <Button color='success' onClick={handlePublish} disabled={publishing}>{publishing ? 'Pubblicazione…' : 'Pubblica'}</Button>
          <Button color='light' onClick={() => setPublishTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal archivia */}
      <Modal isOpen={!!archiveTarget} toggle={() => setArchiveTarget(null)} size='sm'>
        <ModalHeader toggle={() => setArchiveTarget(null)}>Archivia circolare</ModalHeader>
        <ModalBody>
          <p>Archiviare la circolare <strong>"{archiveTarget?.title}"</strong>?</p>
          <p className='small text-muted'>La circolare non sarà più visibile agli utenti, ma resterà nello storico per consultazione amministrativa.</p>
        </ModalBody>
        <ModalFooter>
          <Button color='warning' onClick={handleArchive} disabled={archiving}>{archiving ? 'Archiviazione…' : 'Archivia'}</Button>
          <Button color='light' onClick={() => setArchiveTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
