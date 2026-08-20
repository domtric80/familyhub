import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Nav, NavItem, NavLink, TabContent, TabPane,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Table,
} from 'reactstrap'
import { Home, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'react-feather'
import { toast } from 'react-toastify'
import { staffProfessionalProfileApi, staffEvaluationCriteriaApi, apiError } from '../../services/api'
import type { StaffProfileLookupItem, StaffEvaluationCriterion } from '../../types'

type LookupType = 'skills' | 'languages' | 'specializations' | 'proficiency-levels' | 'certification-types'

interface TabDef {
  key: LookupType
  label: string
  singolare: string
}

const TABS: TabDef[] = [
  { key: 'skills', label: 'Competenze', singolare: 'competenza' },
  { key: 'languages', label: 'Lingue', singolare: 'lingua' },
  { key: 'specializations', label: 'Specializzazioni', singolare: 'specializzazione' },
  { key: 'proficiency-levels', label: 'Livelli di padronanza', singolare: 'livello' },
  { key: 'certification-types', label: 'Tipi certificazione', singolare: 'tipo certificazione' },
]

export default function AnagraficheProfessionaliPage() {
  const [activeTab, setActiveTab] = useState<LookupType | 'criteria'>('skills')

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Anagrafiche professionali</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Amministrazione</li>
                <li className='breadcrumb-item active'>Anagrafiche professionali</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Card>
          <CardHeader className='p-0 border-bottom-0'>
            <Nav tabs className='border-tab nav-primary mb-0 px-3 pt-3'>
              {TABS.map((t) => (
                <NavItem key={t.key}>
                  <NavLink
                    className={activeTab === t.key ? 'active' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.label}
                  </NavLink>
                </NavItem>
              ))}
              <NavItem>
                <NavLink
                  className={activeTab === 'criteria' ? 'active' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab('criteria')}
                >
                  Criteri valutazione
                </NavLink>
              </NavItem>
            </Nav>
          </CardHeader>
          <CardBody>
            <TabContent activeTab={activeTab}>
              {TABS.map((t) => (
                <TabPane tabId={t.key} key={t.key}>
                  {activeTab === t.key && <LookupCrudTab lookupType={t.key} singolare={t.singolare} label={t.label} />}
                </TabPane>
              ))}
              <TabPane tabId='criteria'>
                {activeTab === 'criteria' && <CriteriCrudTab />}
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Container>
    </>
  )
}

// ─── CRUD generico per ogni tipo di anagrafica ────────────────────────────────

interface LookupCrudTabProps {
  lookupType: LookupType
  singolare: string
  label: string
}

const EMPTY_FORM = { code: '', name: '', description: '', sort_order: '', is_active: true }

function LookupCrudTab({ lookupType, singolare, label }: LookupCrudTabProps) {
  const [items, setItems] = useState<StaffProfileLookupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StaffProfileLookupItem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<StaffProfileLookupItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteConflict, setDeleteConflict] = useState(false)

  const load = () => {
    setLoading(true); setError(null)
    staffProfessionalProfileApi.lookups(lookupType)
      .then(setItems)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [lookupType]) // eslint-disable-line

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormMsg(null)
    setModalOpen(true)
  }

  const openEdit = (item: StaffProfileLookupItem) => {
    setEditTarget(item)
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      sort_order: item.sort_order != null ? String(item.sort_order) : '',
      is_active: item.is_active,
    })
    setFormMsg(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.code.trim()) { setFormMsg('Il codice è obbligatorio.'); return }
    if (!form.name.trim()) { setFormMsg('Il nome è obbligatorio.'); return }
    setSaving(true); setFormMsg(null)
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      sort_order: form.sort_order ? Number(form.sort_order) : null,
      is_active: form.is_active,
    }
    try {
      if (editTarget) {
        await staffProfessionalProfileApi.updateLookupItem(lookupType, editTarget.id, payload)
        toast.success(`${label.slice(0, -1) || singolare} aggiornata.`)
      } else {
        await staffProfessionalProfileApi.createLookupItem(lookupType, payload)
        toast.success(`${singolare.charAt(0).toUpperCase() + singolare.slice(1)} creata.`)
      }
      setModalOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 422) setFormMsg(ae.message ?? 'Dati non validi.')
      else if (ae.status === 409) setFormMsg('Codice già esistente. Scegli un codice diverso.')
      else setFormMsg(ae.message ?? 'Errore salvataggio.')
    } finally { setSaving(false) }
  }

  const handleToggleActive = async (item: StaffProfileLookupItem) => {
    try {
      await staffProfessionalProfileApi.updateLookupItem(lookupType, item.id, {
        code: item.code,
        name: item.name,
        description: item.description ?? null,
        sort_order: item.sort_order ?? null,
        is_active: !item.is_active,
      })
      toast.success(`Voce ${item.is_active ? 'disattivata' : 'attivata'}.`)
      load()
    } catch (e) { toast.error(apiError(e).message ?? 'Errore aggiornamento.') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true); setDeleteConflict(false)
    try {
      await staffProfessionalProfileApi.deleteLookupItem(lookupType, deleteTarget.id)
      toast.success('Voce eliminata.')
      setDeleteTarget(null); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 409) {
        setDeleteConflict(true)
      } else {
        toast.error(ae.message ?? 'Errore eliminazione.')
        setDeleteTarget(null)
      }
    } finally { setDeleting(false) }
  }

  return (
    <div>
      <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 13 }}>
        Queste anagrafiche controllano i valori selezionabili nel profilo professionale degli educatori. Le voci disattivate non sono selezionabili nei nuovi profili, ma restano visibili nei profili esistenti.
      </div>

      <div className='d-flex justify-content-end mb-3'>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Nuova voce
        </Button>
      </div>

      {error && <Alert color='danger'>{error}</Alert>}
      {loading ? (
        <div className='text-center py-4'><div className='loader' /></div>
      ) : items.length === 0 ? (
        <p className='text-muted'>Nessuna voce presente.</p>
      ) : (
        <div className='table-responsive'>
          <Table hover size='sm' className='align-middle'>
            <thead className='table-light'>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Codice</th>
                <th>Nome</th>
                <th>Descrizione</th>
                <th style={{ width: 80 }}>Ordine</th>
                <th style={{ width: 90 }}>Stato</th>
                <th style={{ width: 100 }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ opacity: item.is_active ? 1 : 0.55 }}>
                  <td className='text-muted small'>{item.id}</td>
                  <td><code className='small'>{item.code}</code></td>
                  <td>{item.name}</td>
                  <td className='text-muted small'>{item.description ?? '—'}</td>
                  <td className='text-center'>{item.sort_order ?? '—'}</td>
                  <td>
                    <span className={`badge ${item.is_active ? 'badge-light-success' : 'badge-light-secondary'}`}>
                      {item.is_active ? 'Attiva' : 'Inattiva'}
                    </span>
                  </td>
                  <td>
                    <div className='d-flex gap-1'>
                      <Button size='sm' color='light' title='Modifica' onClick={() => openEdit(item)}><Edit2 size={12} /></Button>
                      <Button size='sm' color='light' title={item.is_active ? 'Disattiva' : 'Attiva'} onClick={() => handleToggleActive(item)}>
                        {item.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      </Button>
                      <Button size='sm' color='light' title='Elimina' onClick={() => { setDeleteTarget(item); setDeleteConflict(false) }}><Trash2 size={12} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal crea/modifica */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='md'>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica voce' : `Nuova ${singolare}`}
        </ModalHeader>
        <ModalBody>
          {formMsg && <Alert color='danger'>{formMsg}</Alert>}
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Codice <span className='text-danger'>*</span></Label>
                <Input bsSize='sm' value={form.code} disabled={!!editTarget}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder='es. ITALIANO' />
                {editTarget && <small className='text-muted'>Il codice non è modificabile dopo la creazione.</small>}
              </FormGroup>
            </Col>
            <Col md='8'>
              <FormGroup>
                <Label>Nome <span className='text-danger'>*</span></Label>
                <Input bsSize='sm' value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder='Nome visibile' />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Descrizione</Label>
            <Input type='textarea' bsSize='sm' rows={2} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder='Descrizione opzionale…' />
          </FormGroup>
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Ordinamento</Label>
                <Input type='number' bsSize='sm' value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  placeholder='Es. 10' />
              </FormGroup>
            </Col>
            <Col md='8' className='d-flex align-items-center pt-3'>
              <FormGroup check className='mb-0 mt-1'>
                <Input type='checkbox' id='is_active_cb' checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                <Label check for='is_active_cb'>Voce attiva (selezionabile nei profili)</Label>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal elimina */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)} size='sm'>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Elimina voce</ModalHeader>
        <ModalBody>
          {deleteConflict ? (
            <div>
              <Alert color='warning'>
                <strong>Impossibile eliminare:</strong> questa voce è già associata a uno o più profili professionali. Per renderla non selezionabile, usa invece la <strong>disattivazione</strong>.
              </Alert>
              <p className='small text-muted'>Le voci disattivate restano visibili nei profili già compilati, ma non appaiono più nei menu di selezione.</p>
            </div>
          ) : (
            <p>Eliminare <strong>{deleteTarget?.name}</strong>? L'operazione è irreversibile.</p>
          )}
        </ModalBody>
        <ModalFooter>
          {deleteConflict ? (
            <>
              <Button color='warning' onClick={() => { if (deleteTarget) handleToggleActive(deleteTarget); setDeleteTarget(null) }}>
                Disattiva invece
              </Button>
              <Button color='light' onClick={() => setDeleteTarget(null)}>Chiudi</Button>
            </>
          ) : (
            <>
              <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>
              <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ─── Criteri valutazione periodica ────────────────────────────────────────────

const EMPTY_CRIT_FORM = { code: '', name: '', description: '', sort_order: '', is_active: true }

function CriteriCrudTab() {
  const [items, setItems] = useState<StaffEvaluationCriterion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StaffEvaluationCriterion | null>(null)
  const [form, setForm] = useState(EMPTY_CRIT_FORM)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<StaffEvaluationCriterion | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteConflict, setDeleteConflict] = useState(false)

  const load = () => {
    setLoading(true); setError(null)
    staffEvaluationCriteriaApi.list()
      .then(setItems)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const openCreate = () => {
    setEditTarget(null); setForm(EMPTY_CRIT_FORM); setFormMsg(null); setModalOpen(true)
  }

  const openEdit = (item: StaffEvaluationCriterion) => {
    setEditTarget(item)
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      sort_order: item.sort_order != null ? String(item.sort_order) : '',
      is_active: item.is_active,
    })
    setFormMsg(null); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.code.trim()) { setFormMsg('Il codice è obbligatorio.'); return }
    if (!form.name.trim()) { setFormMsg('Il nome è obbligatorio.'); return }
    setSaving(true); setFormMsg(null)
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      sort_order: form.sort_order ? Number(form.sort_order) : null,
      is_active: form.is_active,
    }
    try {
      if (editTarget) {
        await staffEvaluationCriteriaApi.update(editTarget.id, payload)
        toast.success('Criterio aggiornato.')
      } else {
        await staffEvaluationCriteriaApi.create(payload)
        toast.success('Criterio creato.')
      }
      setModalOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 422) setFormMsg(ae.message ?? 'Dati non validi.')
      else if (ae.status === 409) setFormMsg('Codice già esistente. Scegli un codice diverso.')
      else setFormMsg(ae.message ?? 'Errore salvataggio.')
    } finally { setSaving(false) }
  }

  const handleToggleActive = async (item: StaffEvaluationCriterion) => {
    try {
      await staffEvaluationCriteriaApi.update(item.id, {
        code: item.code, name: item.name,
        description: item.description ?? null,
        sort_order: item.sort_order ?? null,
        is_active: !item.is_active,
      })
      toast.success(`Criterio ${item.is_active ? 'disattivato' : 'attivato'}.`)
      load()
    } catch (e) { toast.error(apiError(e).message ?? 'Errore aggiornamento.') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true); setDeleteConflict(false)
    try {
      await staffEvaluationCriteriaApi.delete(deleteTarget.id)
      toast.success('Criterio eliminato.')
      setDeleteTarget(null); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 409) {
        setDeleteConflict(true)
      } else {
        toast.error(ae.message ?? 'Errore eliminazione.')
        setDeleteTarget(null)
      }
    } finally { setDeleting(false) }
  }

  return (
    <div>
      <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 13 }}>
        I criteri definiscono gli assi di valutazione periodica dei professionisti. I criteri disattivati non appaiono nei nuovi moduli di valutazione, ma restano visibili nelle valutazioni già compilate.
      </div>

      <div className='d-flex justify-content-end mb-3'>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Nuovo criterio
        </Button>
      </div>

      {error && <Alert color='danger'>{error}</Alert>}
      {loading ? (
        <div className='text-center py-4'><div className='loader' /></div>
      ) : items.length === 0 ? (
        <p className='text-muted'>Nessun criterio configurato.</p>
      ) : (
        <div className='table-responsive'>
          <Table hover size='sm' className='align-middle'>
            <thead className='table-light'>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Codice</th>
                <th>Nome</th>
                <th>Descrizione</th>
                <th style={{ width: 80 }}>Ordine</th>
                <th style={{ width: 90 }}>Stato</th>
                <th style={{ width: 100 }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ opacity: item.is_active ? 1 : 0.55 }}>
                  <td className='text-muted small'>{item.id}</td>
                  <td><code className='small'>{item.code}</code></td>
                  <td>{item.name}</td>
                  <td className='text-muted small'>{item.description ?? '—'}</td>
                  <td className='text-center'>{item.sort_order ?? '—'}</td>
                  <td>
                    <span className={`badge ${item.is_active ? 'badge-light-success' : 'badge-light-secondary'}`}>
                      {item.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td>
                    <div className='d-flex gap-1'>
                      <Button size='sm' color='light' title='Modifica' onClick={() => openEdit(item)}><Edit2 size={12} /></Button>
                      <Button size='sm' color='light' title={item.is_active ? 'Disattiva' : 'Attiva'} onClick={() => handleToggleActive(item)}>
                        {item.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      </Button>
                      <Button size='sm' color='light' title='Elimina' onClick={() => { setDeleteTarget(item); setDeleteConflict(false) }}><Trash2 size={12} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal crea/modifica */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='md'>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica criterio' : 'Nuovo criterio di valutazione'}
        </ModalHeader>
        <ModalBody>
          {formMsg && <Alert color='danger'>{formMsg}</Alert>}
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Codice <span className='text-danger'>*</span></Label>
                <Input bsSize='sm' value={form.code} disabled={!!editTarget}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder='es. RELAZIONE' />
                {editTarget && <small className='text-muted'>Il codice non è modificabile dopo la creazione.</small>}
              </FormGroup>
            </Col>
            <Col md='8'>
              <FormGroup>
                <Label>Nome <span className='text-danger'>*</span></Label>
                <Input bsSize='sm' value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder='Nome del criterio' />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Descrizione</Label>
            <Input type='textarea' bsSize='sm' rows={2} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder='Descrizione del criterio di valutazione…' />
          </FormGroup>
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Ordinamento</Label>
                <Input type='number' bsSize='sm' value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  placeholder='Es. 10' />
              </FormGroup>
            </Col>
            <Col md='8' className='d-flex align-items-center pt-3'>
              <FormGroup check className='mb-0 mt-1'>
                <Input type='checkbox' id='crit_is_active_cb' checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                <Label check for='crit_is_active_cb'>Criterio attivo (usato nelle nuove valutazioni)</Label>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal elimina */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)} size='sm'>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Elimina criterio</ModalHeader>
        <ModalBody>
          {deleteConflict ? (
            <div>
              <Alert color='warning'>
                <strong>Impossibile eliminare:</strong> questo criterio è già usato in una o più valutazioni. Per escluderlo dai nuovi moduli, usa invece la <strong>disattivazione</strong>.
              </Alert>
              <p className='small text-muted'>I criteri disattivati restano visibili nelle valutazioni già compilate, ma non appaiono nei nuovi moduli.</p>
            </div>
          ) : (
            <p>Eliminare il criterio <strong>{deleteTarget?.name}</strong>? L'operazione è irreversibile.</p>
          )}
        </ModalBody>
        <ModalFooter>
          {deleteConflict ? (
            <>
              <Button color='warning' onClick={() => { if (deleteTarget) handleToggleActive(deleteTarget); setDeleteTarget(null) }}>
                Disattiva invece
              </Button>
              <Button color='light' onClick={() => setDeleteTarget(null)}>Chiudi</Button>
            </>
          ) : (
            <>
              <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>
              <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </div>
  )
}
